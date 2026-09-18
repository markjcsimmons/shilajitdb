/**
 * The bestForTags that drive /best/[tag]: who qualifies for each tag and in what order.
 *
 * retagBestFor() rebuilds every tag from current grades and COA review fields. It runs
 * automatically after anything that can change a grade (admin saves and recomputes, both
 * CSV importers, the regrade scripts); scripts/retag-best-for.ts runs it by hand.
 *
 * Eligible products are ranked by rankForTag(), capped at 2 per brand (1 for best_for_women)
 * and 15 per tag. White-label brands count as their parent brand for the cap (BRAND_GROUPS).
 * editors_pick is hand-curated (scripts/set-editors-picks.ts) and never touched here, nor
 * are any tags not listed in RULES.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { GRADING_SELECT, computeTransparencyGrade, effectiveOverallScore, toProductForGrading } from "./grading";

const PER_BRAND = 2;
const PER_BRAND_OVERRIDE: Record<string, number> = { best_for_women: 1 };
const PER_TAG = 15;

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

const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"];
const TIER_ORDER = ["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"];

/** Every column the rules and the ranking read. /best/[tag] selects these too. */
export const RANK_SELECT = {
  ...GRADING_SELECT,
  id: true,
  slug: true,
  name: true,
  overallGrade: true,
  qualityTier: true,
  sourceRegion: true,
  pricePerGramCents: true,
  bestForTags: true,
  _count: { select: { evidence: true } },
} satisfies Prisma.ProductSelect;

export type RankRow = Prisma.ProductGetPayload<{ select: typeof RANK_SELECT }>;

const verifiedNumericNamedLab = (p: RankRow) =>
  !!p.coaVerified && p.coaIssuer === "INDEPENDENT_LAB" && !!p.labNamedOnCoa && p.heavyMetalsResult === "NUMERIC";

/** Grades that qualify for best_value: C or better. */
const VALUE_GRADES = new Set(["A_PLUS", "A", "B", "C"]);

const RULES: Record<string, (p: RankRow) => boolean> = {
  best_resin: (p) => p.form === "RESIN",
  best_capsules: (p) => p.form === "CAPSULE",
  best_gummies: (p) => p.form === "GUMMY",
  best_tested: verifiedNumericNamedLab,
  best_third_party_tested: (p) => verifiedNumericNamedLab(p) && p.heavyMetalsScope !== "INGREDIENT",
  best_for_men: (p) => verifiedNumericNamedLab(p) && (p.qualityTier === "ULTRA_PREMIUM" || p.qualityTier === "PREMIUM"),
  // Contamination-first: heavy metals AND a microbial panel on the finished product, any form.
  best_for_women: (p) => verifiedNumericNamedLab(p) && p.heavyMetalsScope !== "INGREDIENT" && !!p.microbialPanel,
  best_himalayan_shilajit: (p) => /himalaya/i.test(p.sourceRegion ?? ""),
  // Price per gram is only comparable within a unit; today only resins carry one.
  best_value: (p) => VALUE_GRADES.has(p.overallGrade ?? "F") && (p.pricePerGramCents ?? 0) > 0,
};

export const RETAGGED_TAGS = Object.keys(RULES);

// ── Ranking ───────────────────────────────────────────────────────────────────

/** Overall score out of 14, held to the product's graded band (form ceilings apply). */
export const qualityScore = (p: RankRow) => effectiveOverallScore(toProductForGrading(p));

const transparencyScore = (p: RankRow) => computeTransparencyGrade(toProductForGrading(p)).score;
const coaTime = (p: RankRow) => (p.coaReportDate ? new Date(p.coaReportDate).getTime() : 0);

/**
 * Dollars per gram for each quality point: what best_value ranks by, lowest first.
 * A C (5 points) at $1.00/g costs $0.20 per point; an A+ (13) at $3.25/g costs $0.25.
 */
export const costPerQualityPoint = (p: RankRow) => p.pricePerGramCents! / 100 / qualityScore(p);

/**
 * Default order, most important first. Each step only breaks ties left by the one before:
 *   1. overall grade           — the published verdict
 *   2. quality tier            — the testing bar the COA clears
 *   3. quality score           — points within the grade band (a 12 outranks a 10, both A)
 *   4. transparency score      — includes how findable the COA is from the product page
 *   5. COA date                — more recently tested first; undated last
 *   6. price per gram          — same evidence for less money; unpriced last
 *   7. evidence sources        — more independent corroboration first
 *   8. name                    — only so the order is stable
 */
const byQuality = (a: RankRow, b: RankRow) =>
  GRADE_ORDER.indexOf(a.overallGrade ?? "F") - GRADE_ORDER.indexOf(b.overallGrade ?? "F") ||
  TIER_ORDER.indexOf(a.qualityTier) - TIER_ORDER.indexOf(b.qualityTier) ||
  qualityScore(b) - qualityScore(a) ||
  transparencyScore(b) - transparencyScore(a) ||
  coaTime(b) - coaTime(a) ||
  (a.pricePerGramCents || Infinity) - (b.pricePerGramCents || Infinity) ||
  b._count.evidence - a._count.evidence ||
  a.name.localeCompare(b.name);

/** best_value: lowest cost per quality point, then the default order. */
const byValue = (a: RankRow, b: RankRow) => costPerQualityPoint(a) - costPerQualityPoint(b) || byQuality(a, b);

/** Sort products in a tag's order. /best/[tag] renders exactly this order. */
export function rankForTag<T extends RankRow>(tag: string, products: T[]): T[] {
  return [...products].sort(tag === "best_value" ? byValue : byQuality);
}

// ── Tagging ───────────────────────────────────────────────────────────────────

function pick(tag: string, products: RankRow[]): RankRow[] {
  const eligible = rankForTag(tag, products.filter(RULES[tag]));
  const preferred = new Set(PREFERRED[tag] ?? []);
  const groupOf = (p: RankRow) => BRAND_GROUPS[p.brand.slug] ?? p.brand.slug;
  const preferredGroups = new Set(eligible.filter((p) => preferred.has(p.slug)).map(groupOf));
  // Preferred products claim their brand's slot before anything else from that brand.
  eligible.sort((a, b) => {
    const pa = preferred.has(a.slug) ? 0 : preferredGroups.has(groupOf(a)) ? 1 : 0;
    const pb = preferred.has(b.slug) ? 0 : preferredGroups.has(groupOf(b)) ? 1 : 0;
    return pa - pb;
  });
  const cap = PER_BRAND_OVERRIDE[tag] ?? PER_BRAND;
  const perBrand = new Map<string, number>();
  const out: RankRow[] = [];
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

export type RetagResult = {
  products: number;
  /** Products whose tags differ (written when apply is true). */
  changed: number;
  tags: { tag: string; before: RankRow[]; after: RankRow[] }[];
};

/** Rebuild every tag in RULES. With apply false it only reports what would change. */
export async function retagBestFor(db: PrismaClient, { apply }: { apply: boolean }): Promise<RetagResult> {
  const products = await db.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
    select: RANK_SELECT,
  });
  // Thin products (under 2 evidence sources) are noindexed on their own pages; don't rank them.
  const rankable = products.filter((p) => p._count.evidence >= 2);

  const next = new Map(products.map((p) => [p.id, new Set(p.bestForTags.filter((t) => !(t in RULES)))]));
  const tags = RETAGGED_TAGS.map((tag) => {
    const after = pick(tag, rankable);
    for (const p of after) next.get(p.id)!.add(tag);
    return { tag, before: products.filter((p) => p.bestForTags.includes(tag)), after };
  });

  const updates = products.flatMap((p) => {
    const tagsNow = [...next.get(p.id)!].sort();
    return tagsNow.join(",") === [...p.bestForTags].sort().join(",") ? [] : [{ id: p.id, bestForTags: tagsNow }];
  });

  // Products that dropped out of the canonical set keep stale tags otherwise; /best only
  // lists canonical products, but clear them so the field stays truthful.
  const stale = await db.product.findMany({
    where: {
      NOT: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      bestForTags: { hasSome: RETAGGED_TAGS },
    },
    select: { id: true, bestForTags: true },
  });
  for (const p of stale) updates.push({ id: p.id, bestForTags: p.bestForTags.filter((t) => !(t in RULES)) });

  if (apply && updates.length > 0) {
    await db.$transaction(
      updates.map(({ id, bestForTags }) => db.product.update({ where: { id }, data: { bestForTags } })),
    );
  }
  return { products: products.length, changed: updates.length, tags };
}
