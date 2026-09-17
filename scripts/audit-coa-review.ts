/**
 * Read-only audit of the COA review fields that drive the overall grade, checked against
 * the actual COA document at coaUrl. Fetches each COA, extracts its text (requires
 * `pdftotext` from poppler) and flags stored fields the document does not support.
 *
 * Text extraction is a triage aid, not a verdict: image-only COAs and scanned PDFs have no
 * text layer, and those are reported as MANUAL rather than guessed at. Every FLAG should be
 * confirmed by eye before anything is changed. This script never writes to the database.
 *
 *   ./node_modules/.bin/tsx scripts/audit-coa-review.ts            # A+ and A products
 *   ./node_modules/.bin/tsx scripts/audit-coa-review.ts --all      # every graded product
 *   ./node_modules/.bin/tsx scripts/audit-coa-review.ts --slug=foo # one product
 */
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const run = promisify(execFile);

const ANALYTES = ["lead", "arsenic", "cadmium", "mercury"];
const NUMERIC_RE = /(?:<\s*)?\d+(?:\.\d+)?\s*(?:ppm|ppb|mg\/kg|µg\/g|ug\/g|mcg\/g)/i;
const PASSFAIL_RE = /\b(complies|conforms|pass(?:es|ed)?|meets|within\s+limits|absent)\b/i;
const BATCH_RE = /\b(?:batch|lot)\s*(?:number|no\.?|code|#)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9_\-\/]{3,})/i;
const DATE_RE = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+\w{3,9},?\s+\d{4}|\w{3,9}\s+\d{1,2},?\s+\d{4})\b/g;

type Verdict = "OK" | "FLAG" | "MANUAL";
/** Collapse pdftotext's column-shattered output into one searchable line. */
const flatten = (t: string) => t.replace(/\s+/g, " ").trim();

async function extractText(url: string, dir: string): Promise<{ text?: string; why?: string }> {
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    return { why: `fetch failed: ${(e as Error).message}` };
  }
  if (!res.ok) return { why: `HTTP ${res.status}` };
  const type = res.headers.get("content-type") ?? "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!type.includes("pdf") && buf.subarray(0, 4).toString() !== "%PDF") {
    return { why: `not a PDF (${type.split(";")[0] || "unknown"}) — image COA, read it by eye` };
  }
  const file = join(dir, "coa.pdf");
  await writeFile(file, buf);
  try {
    const { stdout } = await run("pdftotext", [file, "-"], { maxBuffer: 20 * 1024 * 1024 });
    const text = flatten(stdout);
    if (text.length < 40) return { why: "no text layer (scanned image) — read it by eye" };
    return { text };
  } catch (e) {
    return { why: `pdftotext failed: ${(e as Error).message}` };
  }
}

function auditHeavyMetals(text: string, stored: string | null) {
  let numeric = 0;
  let passfail = 0;
  for (const a of ANALYTES) {
    const i = text.toLowerCase().indexOf(a);
    if (i < 0) continue;
    const window = text.slice(i, i + 90);
    if (NUMERIC_RE.test(window)) numeric++;
    else if (PASSFAIL_RE.test(window)) passfail++;
  }
  if (numeric === 0 && passfail === 0) return { verdict: "MANUAL" as Verdict, detail: "no analyte lines found in text" };
  const looks = numeric >= 2 ? "NUMERIC" : passfail >= 1 ? "PASS_FAIL" : "MANUAL";
  if (looks === "MANUAL") return { verdict: "MANUAL" as Verdict, detail: `${numeric} numeric / ${passfail} pass-fail analytes` };
  return {
    verdict: (looks === stored ? "OK" : "FLAG") as Verdict,
    detail: `document looks ${looks} (${numeric} numeric, ${passfail} pass/fail) · stored ${stored}`,
  };
}

async function main() {
  const all = process.argv.includes("--all");
  const one = process.argv.find((a) => a.startsWith("--slug="))?.slice(7);

  const products = await prisma.product.findMany({
    where: {
      isCanonical: true,
      dataCompleteness: { not: "LOW" },
      ...(one ? { slug: one } : all ? {} : { overallGrade: { in: ["A_PLUS", "A"] } }),
    },
    select: {
      slug: true, coaUrl: true, overallGrade: true, qualityTier: true,
      coaVerified: true, coaIssuer: true, labNamedOnCoa: true, coaBatchIdentified: true,
      coaReportDate: true, heavyMetalsResult: true, heavyMetalsScope: true,
      microbialPanel: true, thirdPartyTestingLab: true,
      brand: { select: { name: true } },
    },
    orderBy: [{ overallGrade: "asc" }, { slug: "asc" }],
  });

  console.log(`Auditing ${products.length} product(s) against their COA documents.\n`);
  const dir = await mkdtemp(join(tmpdir(), "coa-audit-"));
  let flagged = 0;
  let manual = 0;

  for (const p of products) {
    const head = `${(p.overallGrade ?? "—").replace("_PLUS", "+").padEnd(2)} ${p.slug}`;
    if (!p.coaUrl) {
      console.log(`${head}\n     MANUAL  no coaUrl on file · stored issuer=${p.coaIssuer} hm=${p.heavyMetalsResult}\n`);
      manual++;
      continue;
    }
    const { text, why } = await extractText(p.coaUrl, dir);
    if (!text) {
      console.log(`${head}\n     MANUAL  ${why}\n             ${p.coaUrl}\n`);
      manual++;
      continue;
    }

    const lines: string[] = [];
    const flag = (v: Verdict, msg: string) => {
      if (v === "FLAG") flagged++;
      if (v === "MANUAL") manual++;
      lines.push(`     ${v === "OK" ? "ok    " : v === "FLAG" ? "FLAG  " : "MANUAL"}  ${msg}`);
    };

    // Lab named on the COA: look for the stored lab's distinctive first word.
    const lab = p.thirdPartyTestingLab?.trim();
    const token = lab?.split(/\s+/)[0];
    if (p.labNamedOnCoa) {
      const found = !!token && new RegExp(token.replace(/[^\w]/g, ""), "i").test(text);
      flag(found ? "OK" : "FLAG", `labNamedOnCoa=true · ${found ? `"${token}" appears in the COA` : `"${lab ?? "(none stored)"}" does NOT appear in the COA text`}`);
    } else if (token && new RegExp(token.replace(/[^\w]/g, ""), "i").test(text)) {
      flag("FLAG", `labNamedOnCoa=false but "${token}" does appear in the COA`);
    }

    // Heavy metals: numeric concentrations vs a pass/fail verdict.
    const hm = auditHeavyMetals(text, p.heavyMetalsResult);
    flag(hm.verdict, `heavyMetalsResult · ${hm.detail}`);

    // Batch / lot code on the document.
    const m = BATCH_RE.exec(text);
    const batchOnDoc = !!m && !/^n\/?a$/i.test(m[1]);
    if (batchOnDoc !== p.coaBatchIdentified) {
      flag("FLAG", `coaBatchIdentified=${p.coaBatchIdentified} but document ${batchOnDoc ? `shows batch "${m![1]}"` : "shows no batch/lot code"}`);
    } else {
      flag("OK", `coaBatchIdentified=${p.coaBatchIdentified}${batchOnDoc ? ` ("${m![1]}")` : ""}`);
    }

    // Report date: list what the document contains, for a human to compare.
    const dates = [...new Set(text.match(DATE_RE) ?? [])].slice(0, 4);
    const stored = p.coaReportDate ? new Date(p.coaReportDate).toISOString().slice(0, 10) : "(none)";
    const storedYMD = stored.slice(0, 7);
    const matches = dates.some((d) => {
      const parsed = new Date(d);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 7) === storedYMD;
    });
    flag(matches ? "OK" : "MANUAL", `coaReportDate=${stored} · dates in document: ${dates.join(" | ") || "none found"}`);

    // Issuer is a judgement call from the letterhead — always show it.
    lines.push(`     ----    coaIssuer=${p.coaIssuer} · letterhead: "${text.slice(0, 70)}…"`);
    console.log(`${head}\n${lines.join("\n")}\n             ${p.coaUrl}\n`);
  }

  await rm(dir, { recursive: true, force: true });
  console.log(`${products.length} audited · ${flagged} FLAG · ${manual} need manual review.`);
  console.log("Read-only — this script never writes. Confirm every FLAG against the document before changing anything.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
