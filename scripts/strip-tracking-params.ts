/**
 * Strip ad and analytics tracking parameters from product URLs.
 *
 * officialCanonicalUrl and Listing.url are published: the first feeds the product page's
 * "Official product page" link and the JSON-LD offers, the second the "Where to Buy" links.
 * A few were captured after an ad click and carry gclid/gbraid/_gl style parameters, which
 * are meaningless to anyone who follows them later.
 *
 * Affiliate tracking links are left alone — those are intentional and disclosed
 * (see lib/affiliate.ts and components/affiliate-tag.tsx).
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/strip-tracking-params.ts
 * Apply:    ./node_modules/.bin/tsx scripts/strip-tracking-params.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { isAffiliateTrackingUrl } from "../lib/affiliate";

const prisma = new PrismaClient();

/** Dropped wholesale; utm_* and similar prefixes are matched by startsWith. */
const EXACT = new Set(["gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "irclickid", "dclid", "yclid", "_gl", "gad_source", "gad_campaignid", "gclsrc", "mc_eid", "mc_cid"]);
const PREFIXES = ["utm_", "gad_", "pk_", "hsa_"];

/** Returns the cleaned URL, or null when nothing needed removing. */
export function stripTracking(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const drop = [...u.searchParams.keys()].filter((k) => EXACT.has(k) || PREFIXES.some((p) => k.startsWith(p)));
  if (drop.length === 0) return null;
  for (const k of drop) u.searchParams.delete(k);
  // Keep a bare "?" from surviving an emptied query string.
  const out = u.searchParams.toString() ? u.toString() : `${u.origin}${u.pathname}${u.hash}`;
  return out === raw ? null : out;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { officialCanonicalUrl: { not: null } },
    select: { id: true, slug: true, officialCanonicalUrl: true },
  });
  const listings = await prisma.listing.findMany({
    select: { id: true, url: true, source: true, isAffiliate: true, product: { select: { slug: true } } },
  });

  let changes = 0;

  for (const p of products) {
    const cleaned = stripTracking(p.officialCanonicalUrl!);
    if (!cleaned) continue;
    if (isAffiliateTrackingUrl(p.officialCanonicalUrl!)) {
      console.log(`skip (affiliate) ${p.slug}\n  ${p.officialCanonicalUrl}\n`);
      continue;
    }
    changes++;
    console.log(`product.officialCanonicalUrl  ${p.slug}\n  -  ${p.officialCanonicalUrl}\n  +  ${cleaned}\n`);
    if (apply) await prisma.product.update({ where: { id: p.id }, data: { officialCanonicalUrl: cleaned } });
  }

  for (const l of listings) {
    const cleaned = stripTracking(l.url);
    if (!cleaned) continue;
    if (l.isAffiliate || isAffiliateTrackingUrl(l.url)) {
      console.log(`skip (affiliate) listing ${l.product.slug}\n  ${l.url}\n`);
      continue;
    }
    changes++;
    console.log(`listing.url [${l.source}]  ${l.product.slug}\n  -  ${l.url}\n  +  ${cleaned}\n`);
    if (apply) await prisma.listing.update({ where: { id: l.id }, data: { url: cleaned } });
  }

  console.log(`${changes} URL(s) with tracking parameters.`);
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
