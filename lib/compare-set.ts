/**
 * The products /compare/[pair] pre-renders pairs for (and that the sitemap, related-pair links
 * and product-page quick-compare links draw from). Top-graded products, capped per brand so one
 * brand's catalogue can't fill the set — without the cap, 7 of the 15 were Pürblack.
 */
import { prisma } from "./db";

export const COMPARE_SET_SIZE = 15;
const PER_BRAND = 2;
const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"];
const TIER_ORDER = ["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"];

/** Brands that sell another brand's product under their own label count as that brand. */
export const BRAND_GROUPS: Record<string, string> = {
  "life-cykel-store": "purblack", // Pürblack white-label
};

export async function getCompareProducts() {
  const candidates = await prisma.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" }, overallGrade: { not: null } },
    orderBy: [{ overallGrade: "asc" }, { qualityTier: "desc" }, { evidence: { _count: "desc" } }, { name: "asc" }],
    take: 100,
    select: {
      slug: true,
      name: true,
      updatedAt: true,
      overallGrade: true,
      qualityTier: true,
      bestForTags: true,
      brand: { select: { name: true, slug: true } },
      _count: { select: { evidence: true } },
    },
  });
  // Within a grade: better tier, then Editor's Picks, then more evidence sources, then name
  // (the stable sort keeps the database's name order for anything still tied).
  const isPick = (p: (typeof candidates)[number]) => (p.bestForTags.includes("editors_pick") ? 0 : 1);
  candidates.sort(
    (a, b) =>
      GRADE_ORDER.indexOf(a.overallGrade!) - GRADE_ORDER.indexOf(b.overallGrade!) ||
      TIER_ORDER.indexOf(a.qualityTier) - TIER_ORDER.indexOf(b.qualityTier) ||
      isPick(a) - isPick(b) ||
      b._count.evidence - a._count.evidence,
  );

  const perBrand = new Map<string, number>();
  const out: typeof candidates = [];
  for (const p of candidates) {
    const group = BRAND_GROUPS[p.brand.slug] ?? p.brand.slug;
    const n = perBrand.get(group) ?? 0;
    if (n >= PER_BRAND) continue;
    perBrand.set(group, n + 1);
    out.push(p);
    if (out.length >= COMPARE_SET_SIZE) break;
  }
  return out;
}
