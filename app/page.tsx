import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { SearchBox } from "@/components/search-box";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import {
  buildDefaultOrderBy,
  buildProductWhere,
  PAGE_SIZE,
  parseProductFilters,
  type SearchParams,
} from "@/lib/search";
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseProductFilters(await searchParams);

  const hasActiveFilter = !!(
    filters.q ||
    filters.qualityTier ||
    filters.coaStatus ||
    filters.thirdPartyTested ||
    filters.heavyMetalsTested ||
    filters.form ||
    filters.manufacturingCountryClaim
  );

  const where = buildProductWhere(filters);
  const orderBy = buildDefaultOrderBy();
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [total, products] = await Promise.all([
    hasActiveFilter ? prisma.product.count({ where }) : Promise.resolve(0),
    hasActiveFilter
      ? prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: PAGE_SIZE,
          select: {
            id: true,
            slug: true,
            name: true,
            form: true,
            dataCompleteness: true,
            manufacturingCountryClaim: true,
            coaStatus: true,
            coaUrl: true,
            transparencyGrade: true,
            qualityTier: true,
            overallGrade: true,
            thirdPartyTestingLab: true,
            lastVerifiedAt: true,
            heavyMetalsTested: true,
            bestForTags: true,
            pricePerServingCents: true,
            pricePerGramCents: true,
            brand: {
              select: { name: true, slug: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: getSiteUrl(),
    name: "Shilajit Transparency Database",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Search + filter strip */}
      {(() => {
        const filterState: FilterState = {
          qualityTier: filters.qualityTier,
          coaStatus: filters.coaStatus,
          thirdPartyTested: filters.thirdPartyTested,
          heavyMetalsTested: filters.heavyMetalsTested,
          form: filters.form,
          manufacturingCountryClaim: filters.manufacturingCountryClaim,
          q: filters.q,
          page: filters.page,
        };
        return (
          <>
            <SearchBox initialQ={filters.q} filters={filterState} />
            <FilterBar filters={filterState} total={total} active={hasActiveFilter} />
          </>
        );
      })()}

      {/* Product list */}
      {!hasActiveFilter ? (
        <div className="py-16 text-center text-sm text-stone-400">
          Select a filter or search above to browse products.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No products matched.{" "}
                <Link href="/" className="underline underline-offset-4 hover:text-slate-900">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
          <Pagination total={total} filters={filters} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}
