/**
 * A brand page is worth indexing only when at least one of its products is: product pages are
 * noindexed below 2 evidence sources, and a brand page listing nothing but noindexed products is
 * thin. The brand page's robots tag and the sitemap both use this so they can't disagree.
 */
export const BRAND_INDEXING_SELECT = {
  products: {
    where: { isCanonical: true, dataCompleteness: { not: "LOW" as const } },
    select: { _count: { select: { evidence: true } } },
  },
};

export function hasIndexableProduct(brand: { products: { _count: { evidence: number } }[] }): boolean {
  return brand.products.some((p) => p._count.evidence >= 2);
}
