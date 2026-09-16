/**
 * Rebuild the bestForTags that drive /best/[tag] from current grades and COA review fields.
 *
 * Each tag has an eligibility rule; eligible products are ranked (grade, then tier, then
 * name — the same order the page uses), capped at 2 per brand (1 for best_for_women) and 15 per tag.
 * White-label brands count as their parent brand for the cap (BRAND_GROUPS).
 * editors_pick is hand-curated and left untouched, as are any tags not listed here.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/retag-best-for.ts
 * Apply:    ./node_modules/.bin/tsx scripts/retag-best-for.ts --apply
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const PER_BRAND = 2;
const PER_BRAND_OVERRIDE: Record<string, number> = { best_for_women: 1 };

/** Brands that sell another brand's product under their own label count as that brand. */
const BRAND_GROUPS: Record<string, string> = {
  "life-cykel-store": "purblack", // Pürblack white-label
};

/**
 * Editorial preference for which product fills a brand's slot on a tag, for reasons the
 * grade doesn't measure. Must still pass the tag's rule. Disclose the reason on the page.
 */
const PREFERRED: Record<string, string[]> = {
  // Milder taste and smell; stated in the best_for_women editorial copy.
  best_for_women: ["purblack-purblack-white-rabbit-slim-shilajit-resin-15-grams"],
};

const PER_TAG = 15;
const SHOWN_ON_PAGE = 5;

const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"];
const TIER_ORDER = ["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"];

const SELECT = {
  id: true,
  slug: true,
  brandId: true,
  brand: { select: { slug: true } },
  form: true,
  overallGrade: true,
  qualityTier: true,
  coaStatus: true,
  coaVerified: true,
  coaIssuer: true,
  labNamedOnCoa: true,
  microbialPanel: true,
  heavyMetalsResult: true,
  heavyMetalsScope: true,
  sourceRegion: true,
  pricePerGramCents: true,
  bestForTags: true,
  _count: { select: { evidence: true } },
} satisfies Prisma.ProductSelect;

type P = Prisma.ProductGetPayload<{ select: typeof SELECT }>;

const verifiedNumericNamedLab = (p: P) =>
  p.coaVerified && p.coaIssuer === "INDEPENDENT_LAB" && p.labNamedOnCoa && p.heavyMetalsResult === "NUMERIC";

const RULES: Record<string, (p: P) => boolean> = {
  best_resin: (p) => p.form === "RESIN",
  best_capsules: (p) => p.form === "CAPSULE",
  best_gummies: (p) => p.form === "GUMMY",
  best_tested: verifiedNumericNamedLab,
  best_third_party_tested: (p) => verifiedNumericNamedLab(p) && p.heavyMetalsScope !== "INGREDIENT",
  best_for_men: (p) => verifiedNumericNamedLab(p) && (p.qualityTier === "ULTRA_PREMIUM" || p.qualityTier === "PREMIUM"),
  // Contamination-first: heavy metals AND a microbial panel on the finished product, any form.
  best_for_women: (p) => verifiedNumericNamedLab(p) && p.heavyMetalsScope !== "INGREDIENT" && p.microbialPanel,
  best_himalayan_shilajit: (p) => /himalaya/i.test(p.sourceRegion ?? ""),
  best_value: (p) => p.qualityTier !== "POOR" && (p.pricePerGramCents ?? 0) > 0,
};

const rank = (p: P) => GRADE_ORDER.indexOf(p.overallGrade ?? "F") * 10 + TIER_ORDER.indexOf(p.qualityTier);

/** best_value ranks by grade per dollar, not grade alone. */
const valueScore = (p: P) => (GRADE_ORDER.length - GRADE_ORDER.indexOf(p.overallGrade ?? "F")) / p.pricePerGramCents!;

function pick(tag: string, products: P[]): P[] {
  const eligible = products.filter(RULES[tag]);
  eligible.sort(
    tag === "best_value"
      ? (a, b) => valueScore(b) - valueScore(a)
      : (a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug),
  );
  const preferred = new Set(PREFERRED[tag] ?? []);
  const groupOf = (p: P) => BRAND_GROUPS[p.brand.slug] ?? p.brand.slug;
  const preferredGroups = new Set(eligible.filter((p) => preferred.has(p.slug)).map(groupOf));
  // Preferred products claim their brand's slot before anything else from that brand.
  eligible.sort((a, b) => {
    const pa = preferred.has(a.slug) ? 0 : preferredGroups.has(groupOf(a)) ? 1 : 0;
    const pb = preferred.has(b.slug) ? 0 : preferredGroups.has(groupOf(b)) ? 1 : 0;
    return pa - pb;
  });
  const cap = PER_BRAND_OVERRIDE[tag] ?? PER_BRAND;
  const perBrand = new Map<string, number>();
  const out: P[] = [];
  for (const p of eligible) {
    const group = groupOf(p);
    const n = perBrand.get(group) ?? 0;
    if (n >= cap) continue;
    perBrand.set(group, n + 1);
    out.push(p);
    if (out.length >= PER_TAG) break;
  }
  return out;
}

const label = (p: P) => `${(p.overallGrade ?? "—").replace("_PLUS", "+")} ${p.qualityTier} ${p.form} ${p.slug.slice(0, 60)}`;

/** What /best/[tag] shows: the top 5 by grade among tagged products. */
const shown = (list: P[]) => [...list].sort((a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug)).slice(0, SHOWN_ON_PAGE);

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
    select: SELECT,
  });
  // Thin products (under 2 evidence sources) are noindexed on their own pages; don't rank them.
  const rankable = products.filter((p) => p._count.evidence >= 2);

  const newTags = new Map<string, Set<string>>(products.map((p) => [p.id, new Set(p.bestForTags.filter((t) => !(t in RULES)))]));

  for (const tag of Object.keys(RULES)) {
    const before = products.filter((p) => p.bestForTags.includes(tag));
    const after = pick(tag, rankable);
    for (const p of after) newTags.get(p.id)!.add(tag);

    console.log(`\n== ${tag}: ${before.length} -> ${after.length} tagged`);
    console.log("  shown before:");
    for (const p of shown(before)) console.log(`    ${label(p)}`);
    console.log("  shown after:");
    for (const p of shown(after)) console.log(`    ${label(p)}`);
  }

  let changed = 0;
  for (const p of products) {
    const next = [...newTags.get(p.id)!].sort();
    const prev = [...p.bestForTags].sort();
    if (next.join(",") === prev.join(",")) continue;
    changed++;
    if (apply) await prisma.product.update({ where: { id: p.id }, data: { bestForTags: next } });
  }

  console.log(`\n${products.length} products; ${changed} tag changes.`);
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
