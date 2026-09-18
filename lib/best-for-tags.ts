/**
 * The bestForTags that drive /best/[tag]: who qualifies for each tag and in what order.
 *
 * retagBestFor() rebuilds every tag from current grades and COA review fields. It runs
 * automatically after anything that can change a grade (admin saves and recomputes, both
 * CSV importers, the regrade scripts); scripts/retag-best-for.ts runs it by hand.
 *
 * Eligible products are ranked by rankForTag(), capped at 2 per brand (1 for best_for_women)
 * and 15 per tag. White-label brands count as their parent brand for the cap (BRAND_GROUPS).
 * editors_pick is built last, from the other tags (see EDITORS_PICK). Tags not managed here
 * are left alone.
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

/**
 * Editor's Picks: `first` always leads, then A+ and then A products that made at least
 * `minCategories` of the RULES lists, ranked as usual and capped at 2 per brand group (the
 * pinned product counts toward its brand's cap). Manual overrides: `include` products are
 * always picks, listed after the rule-based ones and exempt from the cap; `exclude` products
 * never are. Slugs are exact.
 */
export const EDITORS_PICK = {
  first: ["purblack-purblack-research-grade-shilajit-resin-15-grams"],
  grades: ["A_PLUS", "A"],
  minCategories: 2,
  include: [] as string[],
  exclude: [
    // One Pure Himalayan Shilajit Store pick is enough (user decision 2026-09-18); its resin stays.
    "pure-himalayan-shilajit-store-soft-resin-shilajit",
  ] as string[],
};

const MANAGED_TAGS = [...RETAGGED_TAGS, "editors_pick"];
const isManaged = (t: string) => MANAGED_TAGS.includes(t);

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

/** editors_pick: pinned products first (in listed order), manual includes last. */
const pickSlot = (p: RankRow) => {
  const i = EDITORS_PICK.first.indexOf(p.slug);
  if (i >= 0) return i - EDITORS_PICK.first.length;
  return EDITORS_PICK.include.includes(p.slug) ? 1 : 0;
};
const byEditorsPick = (a: RankRow, b: RankRow) => pickSlot(a) - pickSlot(b) || byQuality(a, b);

/** Sort products in a tag's order. /best/[tag] and the homepage render exactly this order. */
export function rankForTag<T extends RankRow>(tag: string, products: T[]): T[] {
  return [...products].sort(tag === "best_value" ? byValue : tag === "editors_pick" ? byEditorsPick : byQuality);
}

// ── Tagging ───────────────────────────────────────────────────────────────────

const groupOf = (p: RankRow) => BRAND_GROUPS[p.brand.slug] ?? p.brand.slug;

function pick(tag: string, products: RankRow[]): RankRow[] {
  const eligible = rankForTag(tag, products.filter(RULES[tag]));
  const preferred = new Set(PREFERRED[tag] ?? []);
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

/**
 * Editor's Picks from the freshly computed tags. `tagsOf` returns a product's new tags.
 * Pinned and included products must be rankable (canonical, not LOW, 2+ evidence sources).
 */
function pickEditors(rankable: RankRow[], tagsOf: (p: RankRow) => Set<string>, warnings: string[]): RankRow[] {
  const bySlug = new Map(rankable.map((p) => [p.slug, p]));
  for (const slug of [...EDITORS_PICK.first, ...EDITORS_PICK.include]) {
    if (!bySlug.has(slug)) warnings.push(`editors_pick: ${slug} is not a rankable product (canonical, not LOW, 2+ evidence) — skipped`);
  }
  const excluded = new Set(EDITORS_PICK.exclude);
  const pinned = EDITORS_PICK.first.flatMap((s) => bySlug.get(s) ?? []).filter((p) => !excluded.has(p.slug));
  const perBrand = new Map<string, number>();
  for (const p of pinned) perBrand.set(groupOf(p), (perBrand.get(groupOf(p)) ?? 0) + 1);

  const out = [...pinned];
  for (const grade of EDITORS_PICK.grades) {
    const pool = rankable.filter(
      (p) =>
        p.overallGrade === grade &&
        !out.includes(p) &&
        !excluded.has(p.slug) &&
        [...tagsOf(p)].filter((t) => t in RULES).length >= EDITORS_PICK.minCategories,
    );
    for (const p of rankForTag("editors_pick", pool)) {
      const n = perBrand.get(groupOf(p)) ?? 0;
      if (n >= PER_BRAND) continue;
      perBrand.set(groupOf(p), n + 1);
      out.push(p);
    }
  }
  for (const slug of EDITORS_PICK.include) {
    const p = bySlug.get(slug);
    if (p && !out.includes(p) && !excluded.has(slug)) out.push(p);
  }
  return out;
}

export type RetagResult = {
  products: number;
  /** Products whose tags differ (written when apply is true). */
  changed: number;
  tags: { tag: string; before: RankRow[]; after: RankRow[] }[];
  /** Pinned or included Editor's Picks that couldn't be placed. */
  warnings: string[];
};

/** Rebuild every tag in RULES. With apply false it only reports what would change. */
export async function retagBestFor(db: PrismaClient, { apply }: { apply: boolean }): Promise<RetagResult> {
  const products = await db.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
    select: RANK_SELECT,
  });
  // Thin products (under 2 evidence sources) are noindexed on their own pages; don't rank them.
  const rankable = products.filter((p) => p._count.evidence >= 2);

  const next = new Map(products.map((p) => [p.id, new Set(p.bestForTags.filter((t) => !isManaged(t)))]));
  const tags = RETAGGED_TAGS.map((tag) => {
    const after = pick(tag, rankable);
    for (const p of after) next.get(p.id)!.add(tag);
    return { tag, before: products.filter((p) => p.bestForTags.includes(tag)), after };
  });

  const warnings: string[] = [];
  const picks = pickEditors(rankable, (p) => next.get(p.id)!, warnings);
  for (const p of picks) next.get(p.id)!.add("editors_pick");
  tags.push({ tag: "editors_pick", before: products.filter((p) => p.bestForTags.includes("editors_pick")), after: picks });

  const updates = products.flatMap((p) => {
    const tagsNow = [...next.get(p.id)!].sort();
    return tagsNow.join(",") === [...p.bestForTags].sort().join(",") ? [] : [{ id: p.id, bestForTags: tagsNow }];
  });

  // Products that dropped out of the canonical set keep stale tags otherwise; /best only
  // lists canonical products, but clear them so the field stays truthful.
  const stale = await db.product.findMany({
    where: {
      NOT: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      bestForTags: { hasSome: MANAGED_TAGS },
    },
    select: { id: true, bestForTags: true },
  });
  for (const p of stale) updates.push({ id: p.id, bestForTags: p.bestForTags.filter((t) => !isManaged(t)) });

  if (apply && updates.length > 0) {
    await db.$transaction(
      updates.map(({ id, bestForTags }) => db.product.update({ where: { id }, data: { bestForTags } })),
    );
  }
  return { products: products.length, changed: updates.length, tags, warnings };
}
