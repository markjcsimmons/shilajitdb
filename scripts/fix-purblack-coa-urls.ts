/**
 * Repoint the 7 Pürblack products at their Cambium Analytica lab reports.
 *
 * Their coaUrl currently serves a Pürblack-letterhead certificate with no lab named on it,
 * which is what a visitor downloads from the product page and what scripts/audit-coa-review.ts
 * reads. Fill in COA_URLS below with the Cambium report for each product; the script refuses
 * to write any row whose document does not fetch as a PDF naming Cambium.
 *
 * Only coaUrl is written. Review fields that drive the grade (coaReportDate, batch, heavy
 * metals) are reported for a human decision, never changed here.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/fix-purblack-coa-urls.ts
 * Apply:    ./node_modules/.bin/tsx scripts/fix-purblack-coa-urls.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const run = promisify(execFile);

/** slug -> Cambium Analytica report URL. Leave a value empty to skip that product. */
const COA_URLS: Record<string, string> = {
  "purblack-purblack-research-grade-shilajit-resin-15-grams": "",
  "purblack-purblack-deja-brew-shilajit-resin-15-grams": "",
  "purblack-purblack-immunity-max-shilajit-resin-with-coated-silver-30-grams": "",
  "purblack-purblack-shilajit-resin-with-true-gold-555-ppm-30-grams": "",
  "purblack-purblack-white-rabbit-serene-shilajit-resin-15-grams": "",
  "purblack-purblack-white-rabbit-slim-shilajit-resin-15-grams": "",
  "purblack-purblack-white-rabbit-vive-shilajit-resin-15-grams": "",
};

/** The document must name this lab, or the row is refused. */
const REQUIRED_LAB = /cambium/i;
const BATCH_RE = /\b(?:batch|lot)\s*(?:number|no\.?|code|#)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9_\-\/]{2,})/i;
const DATE_RE = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+\w{3,9},?\s+\d{4})\b/g;

async function readCoa(url: string, dir: string) {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 4).toString() !== "%PDF") throw new Error(`not a PDF (${res.headers.get("content-type") ?? "unknown"})`);
  const file = join(dir, `${Date.now()}.pdf`);
  await writeFile(file, buf);
  const { stdout } = await run("pdftotext", [file, "-"], { maxBuffer: 20 * 1024 * 1024 });
  const text = stdout.replace(/\s+/g, " ").trim();
  if (text.length < 40) throw new Error("no text layer (scanned image) — verify by eye instead");
  if (!REQUIRED_LAB.test(text)) throw new Error("document does not name Cambium — wrong file?");
  return text;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dir = await mkdtemp(join(tmpdir(), "purblack-coa-"));
  let ready = 0;
  let refused = 0;
  let skipped = 0;

  for (const [slug, url] of Object.entries(COA_URLS)) {
    const p = await prisma.product.findFirst({ where: { slug, isCanonical: true }, select: { id: true, coaUrl: true, coaReportDate: true, coaBatchIdentified: true } });
    if (!p) { console.log(`?? ${slug}\n   no canonical product with this slug\n`); refused++; continue; }
    if (!url.trim()) { console.log(`-- ${slug}\n   no URL filled in — skipped\n`); skipped++; continue; }

    let text: string;
    try {
      text = await readCoa(url, dir);
    } catch (e) {
      console.log(`XX ${slug}\n   REFUSED: ${(e as Error).message}\n   ${url}\n`);
      refused++;
      continue;
    }

    const batch = BATCH_RE.exec(text)?.[1] ?? null;
    const batchReal = !!batch && !/^n\/?a$/i.test(batch);
    const dates = [...new Set(text.match(DATE_RE) ?? [])].slice(0, 3);
    const stored = p.coaReportDate ? new Date(p.coaReportDate).toISOString().slice(0, 10) : "(none)";

    console.log(`ok ${slug}`);
    console.log(`   old ${p.coaUrl ?? "(none)"}`);
    console.log(`   new ${url}`);
    console.log(`   document batch/lot: ${batch ?? "none found"}${batchReal ? "" : "  -> coaBatchIdentified=false is correct"}`);
    console.log(`   stored coaBatchIdentified=${p.coaBatchIdentified}${batchReal === p.coaBatchIdentified ? "" : "  <-- REVIEW: document disagrees"}`);
    console.log(`   stored coaReportDate=${stored} · dates in document: ${dates.join(" | ") || "none found"}`);
    console.log("");
    ready++;

    if (apply) await prisma.product.update({ where: { id: p.id }, data: { coaUrl: url } });
  }

  await rm(dir, { recursive: true, force: true });
  console.log(`${ready} ready · ${refused} refused · ${skipped} skipped (no URL).`);
  console.log(apply ? `Applied: coaUrl updated on ${ready} product(s). Review fields untouched.` : "Dry run — pass --apply to write coaUrl.");
  console.log("Re-run scripts/audit-coa-review.ts afterwards to confirm the flags clear.");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
