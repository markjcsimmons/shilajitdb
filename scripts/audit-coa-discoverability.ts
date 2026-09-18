/**
 * Classify how findable each product's COA is from its own product page, and store it in
 * Product.coaDiscoverability. Feeds the transparency grade only (see computeTransparencyGrade
 * in lib/grading.ts) — the overall grade and quality tier are untouched.
 *
 * A COA that is published but collapsed behind an accordion, or linked as bare "Learn more",
 * is public in name but not in practice. The classifier fetches officialCanonicalUrl and looks
 * for the coaUrl in the returned HTML:
 *
 *   PROMINENT  linked, visible, with link text a buyer would recognise as a COA
 *   BURIED     linked, but inside a collapsed <details> / accordion, or with vague link text
 *   UNLINKED   the COA URL is public but the product page does not reference it
 *   UNKNOWN    page could not be fetched, or there is no public COA to find
 *
 * This is a heuristic over server-rendered HTML. Pages that inject their COA link client-side
 * will look UNLINKED, so spot-check that bucket before trusting it. Re-runnable; brands
 * redesign, so the answer goes stale.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/audit-coa-discoverability.ts
 * Apply:    ./node_modules/.bin/tsx scripts/audit-coa-discoverability.ts --apply
 * One slug: ./node_modules/.bin/tsx scripts/audit-coa-discoverability.ts --slug=foo
 */
import { PrismaClient, type CoaDiscoverability } from "@prisma/client";
import { retagBestFor } from "../lib/best-for-tags";
import { GRADING_SELECT, toProductForGrading, computeTransparencyGrade } from "../lib/grading";

const prisma = new PrismaClient();
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/** Link text that tells a buyer what they are clicking. Plurals matter: "lab results" is fine. */
const DESCRIPTIVE = /\b(coa|certificate of analysis|lab\s+(report|result|test)s?|test\s+(report|result)s?|third[- ]party\s+test\w*|analysis|purity report)\b/i;
/** Wrappers that hide their contents until the visitor interacts. */
const COLLAPSIBLE = /<(details|summary)\b|class="[^"]*\b(accordion|collapse|collapsible|tab-content|disclosure)\b/i;

/** The filename is the stable part of a CDN URL; query strings and hosts drift. */
const GENERIC_FILENAMES = /^(viewer|view|index|download|file|document|preview)(\.\w+)?$/i;

function coaNeedles(coaUrl: string): string[] {
  const out = new Set<string>();
  const add = (raw: string, depth = 0) => {
    out.add(raw);
    let u: URL;
    try { u = new URL(raw); } catch { return; }
    out.add(`${u.origin}${u.pathname}`);
    const file = u.pathname.split("/").filter(Boolean).pop();
    if (file && !GENERIC_FILENAMES.test(file)) { out.add(file); out.add(decodeURIComponent(file)); }
    // Viewer/proxy wrappers (e.g. docs.google.com/viewerng/viewer?url=…) hide the real document.
    if (depth < 2) {
      for (const [, v] of u.searchParams) {
        if (/^https?:\/\//i.test(v)) add(decodeURIComponent(v), depth + 1);
      }
    }
  };
  add(coaUrl);
  return [...out].filter((n) => n.length > 8);
}

function samePage(a: string, b: string): boolean {
  try {
    const x = new URL(a), y = new URL(b);
    return x.host === y.host && x.pathname.replace(/\/$/, "") === y.pathname.replace(/\/$/, "");
  } catch { return false; }
}

function classify(html: string, coaUrl: string, pageUrl: string): { verdict: CoaDiscoverability; why: string } {
  // Some products use the product page itself as the COA (an embedded image). Nothing to find.
  if (samePage(coaUrl, pageUrl)) return { verdict: "PROMINENT", why: "the COA is published on the product page itself" };

  const needles = coaNeedles(coaUrl);
  let at = -1;
  for (const n of needles) {
    const i = html.indexOf(n);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return { verdict: "UNLINKED", why: "COA URL does not appear in the page HTML" };

  // Which attribute is the match sitting in? Only an href is a link a buyer can click.
  const attr = html.slice(Math.max(0, at - 300), at);
  const inHref = /href\s*=\s*["'][^"']*$/i.test(attr);
  const inSrc = /(?:src|data-src|srcset|content)\s*=\s*["'][^"']*$/i.test(attr);

  if (!inHref && !inSrc) {
    return { verdict: "BURIED", why: "referenced only in page data (script/JSON), not as a visible link" };
  }
  if (inSrc) {
    return { verdict: "PROMINENT", why: "COA is embedded on the product page as an image" };
  }

  const before = html.slice(Math.max(0, at - 4000), at);
  const around = html.slice(Math.max(0, at - 600), Math.min(html.length, at + 800));
  const anchorText = /<a\b[^>]*>([\s\S]{0,160}?)<\/a>/i.exec(around)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";

  const lastOpen = Math.max(before.lastIndexOf("<details"), before.lastIndexOf("<summary"));
  const lastClose = before.lastIndexOf("</details>");
  const insideCollapsed = lastOpen > lastClose || COLLAPSIBLE.test(before.slice(-1500));
  const described = DESCRIPTIVE.test(anchorText);

  if (insideCollapsed) return { verdict: "BURIED", why: `inside a collapsed section, link text "${anchorText || "(none)"}"` };
  if (!described) return { verdict: "BURIED", why: `visible link, but vague text "${anchorText || "(none)"}"` };
  return { verdict: "PROMINENT", why: `linked as "${anchorText}"` };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const one = process.argv.find((a) => a.startsWith("--slug="))?.slice(7);
  // UNLINKED is the least reliable verdict and the only one carrying a -2 penalty: a COA shown
  // as an unnamed gallery image, or injected client-side, is invisible to this classifier.
  // By default it is reported but stored as UNKNOWN (no penalty) pending review by eye.
  const trustUnlinked = process.argv.includes("--trust-unlinked");

  const products = await prisma.product.findMany({
    where: {
      isCanonical: true,
      coaStatus: { in: ["PUBLIC", "PUBLIC_EMBEDDED"] },
      coaUrl: { not: null },
      officialCanonicalUrl: { not: null },
      ...(one ? { slug: one } : {}),
    },
    select: { ...GRADING_SELECT, id: true, slug: true, coaUrl: true, officialCanonicalUrl: true, transparencyGrade: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Checking ${products.length} product(s) with a public COA and a product page.\n`);
  const tally: Record<string, number> = {};
  let regraded = 0;

  for (const p of products) {
    let verdict: CoaDiscoverability = "UNKNOWN";
    let why = "";
    try {
      const res = await fetch(p.officialCanonicalUrl!, { redirect: "follow", headers: { "user-agent": UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) why = `HTTP ${res.status}`;
      else {
        const html = await res.text();
        // A 200 with almost no body is a bot wall or a client-rendered shell, not a real page.
        if (html.length < 2000) why = `page returned only ${html.length} bytes — blocked or client-rendered`;
        else ({ verdict, why } = classify(html, p.coaUrl!, p.officialCanonicalUrl!));
      }
    } catch (e) {
      why = `fetch failed: ${(e as Error).message}`;
    }

    tally[verdict] = (tally[verdict] ?? 0) + 1;
    const stored: CoaDiscoverability = verdict === "UNLINKED" && !trustUnlinked ? "UNKNOWN" : verdict;
    const next = computeTransparencyGrade({ ...toProductForGrading(p), coaDiscoverability: stored });
    const moves = next.grade !== p.transparencyGrade;
    if (moves) regraded++;

    console.log(`${verdict.padEnd(9)} ${p.slug.slice(0, 54).padEnd(54)} ${p.coaDiscoverability !== verdict ? `(was ${p.coaDiscoverability})` : ""}`);
    console.log(`          ${why}`);
    if (moves) console.log(`          transparency ${p.transparencyGrade} -> ${next.grade} (score ${next.score})`);

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: { coaDiscoverability: stored, transparencyGrade: next.grade },
      });
    }
  }

  console.log(`\n${JSON.stringify(tally)} · ${regraded} transparency-grade change(s).`);
  if (!trustUnlinked && (tally.UNLINKED ?? 0) > 0) {
    console.log(`${tally.UNLINKED} UNLINKED verdict(s) stored as UNKNOWN (no penalty) — review by eye, then re-run with --trust-unlinked.`);
  }
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  if (apply) {
    const retag = await retagBestFor(prisma, { apply: true });
    console.log(`Rebuilt /best tags: ${retag.changed} product(s) changed.`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
