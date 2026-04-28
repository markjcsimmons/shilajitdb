import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { SearchBox } from "@/components/search-box";
import { SortSelect } from "@/components/sort-select";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import {
  buildOrderBy,
  buildProductWhere,
  PAGE_SIZE,
  parseProductFilters,
  type SearchParams,
} from "@/lib/search";

export const dynamic = "force-dynamic";

const BEST_FOR_CATEGORIES = [
  {
    tag: "best_tested",
    label: "Best Tested",
    description: "Public COA from a named independent lab, heavy metals confirmed",
    icon: "🔬",
  },
  {
    tag: "best_value",
    label: "Best Value",
    description: "Strong testing credentials at a competitive price",
    icon: "💰",
  },
  {
    tag: "best_resin",
    label: "Best Resin",
    description: "Top-rated resin — the least processed, most traditional form",
    icon: "🪨",
  },
  {
    tag: "best_capsules",
    label: "Best Capsules",
    description: "Top capsule products by grade, testing, and transparency",
    icon: "💊",
  },
  {
    tag: "best_gummies",
    label: "Best Gummies",
    description: "Top gummy-form shilajit products by grade and transparency",
    icon: "🍬",
  },
  {
    tag: "editors_pick",
    label: "Editor's Picks",
    description: "Hand-selected across quality, transparency, and value",
    icon: "⭐",
  },
];

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
    filters.manufacturingCountryClaim ||
    filters.minPriceGram != null ||
    filters.maxPriceGram != null
  );

  const where = buildProductWhere(filters);
  const orderBy = buildOrderBy(filters.sort);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [total, products, productCount, brandCount, publicCoaCount, lastVerified] = await Promise.all([
    hasActiveFilter ? prisma.product.count({ where }) : Promise.resolve(0),
    hasActiveFilter
      ? prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: PAGE_SIZE,
          select: {
            id: true, slug: true, name: true, form: true,
            dataCompleteness: true, manufacturingCountryClaim: true,
            coaStatus: true, coaUrl: true, transparencyGrade: true,
            qualityTier: true, overallGrade: true, thirdPartyTestingLab: true,
            lastVerifiedAt: true, heavyMetalsTested: true, bestForTags: true,
            pricePerServingCents: true, pricePerGramCents: true,
            brand: { select: { name: true, slug: true } },
          },
        })
      : Promise.resolve([]),
    prisma.product.count({ where: { isCanonical: true, dataCompleteness: { not: "LOW" } } }),
    prisma.brand.count(),
    prisma.product.count({ where: { isCanonical: true, coaStatus: "PUBLIC" } }),
    prisma.product.findFirst({
      where: { isCanonical: true, lastVerifiedAt: { not: null } },
      orderBy: { lastVerifiedAt: "desc" },
      select: { lastVerifiedAt: true },
    }),
  ]);

  const coaPercent = productCount > 0 ? Math.round((publicCoaCount / productCount) * 100) : 0;
  const lastVerifiedLabel = lastVerified?.lastVerifiedAt
    ? new Date(lastVerified.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

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

  const filterState: FilterState = {
    qualityTier: filters.qualityTier,
    coaStatus: filters.coaStatus,
    thirdPartyTested: filters.thirdPartyTested,
    heavyMetalsTested: filters.heavyMetalsTested,
    form: filters.form,
    manufacturingCountryClaim: filters.manufacturingCountryClaim,
    q: filters.q,
    page: filters.page,
    sort: filters.sort,
    minPriceGram: filters.minPriceGram,
    maxPriceGram: filters.maxPriceGram,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* ── Stats strip ── */}
      <div className="-mx-4 border-b border-[#252A40] px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-6 overflow-x-auto">
          {[
            { value: String(productCount), label: "products graded" },
            { value: String(brandCount), label: "brands tracked" },
            { value: `${coaPercent}%`, label: "with public COA" },
            { value: lastVerifiedLabel ?? "—", label: "last updated" },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5 whitespace-nowrap shrink-0">
              <span className="font-mono text-sm font-semibold text-[#EEF0F8]">{s.value}</span>
              <span className="text-xs text-[#4A5070]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="-mx-4 border-b border-[#252A40] px-4 pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3D7AFF] mb-4">
              Independent · Unaffiliated · Free
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight tracking-tight text-[#EEF0F8] mb-4">
              Shilajit<br />
              <span className="italic font-normal text-[#8892B8]">Transparency</span> Database
            </h1>
            <p className="text-base leading-relaxed text-[#8892B8] max-w-lg mb-6">
              Every product graded on COA quality, testing lab credibility, heavy metal safety,
              and manufacturing transparency — so you can buy with confidence. We do not earn
              revenue from this site; our goal is to educate and inform.
            </p>
          </div>

          {/* Search + How We Grade */}
          <div className="flex gap-2 items-stretch max-w-2xl">
            <div className="flex-1">
              <SearchBox initialQ={filters.q} filters={filterState} hero />
            </div>
            <Link
              href="/methodology"
              className="shrink-0 inline-flex items-center border border-[#313760] text-[#EEF0F8] font-semibold text-sm px-4 rounded-lg hover:bg-[#171C2E] transition-colors whitespace-nowrap"
            >
              How We Grade
            </Link>
          </div>

          {/* Filter chips */}
          <div className="mt-3 max-w-2xl">
            <FilterBar filters={filterState} total={total} active={hasActiveFilter} />
          </div>

          {hasActiveFilter && (
            <div className="flex justify-end max-w-2xl mt-2">
              <SortSelect current={filters.sort} filters={filterState} />
            </div>
          )}
        </div>
      </div>

      {/* ── Product list / discovery ── */}
      {!hasActiveFilter ? (
        <div className="space-y-12 pt-8">

          {/* Top picks */}
          <div className="-mx-4 border-t border-b border-[#252A40] py-10 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5070] mb-1.5">Top Picks</p>
                <h2 className="font-serif text-2xl font-semibold text-[#EEF0F8]">Editor-curated categories</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BEST_FOR_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.tag}
                    href={`/best/${cat.tag.replace(/_/g, "-")}`}
                    className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-4 transition-colors hover:bg-[#171C2E] hover:border-[#313760]"
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-semibold text-[#EEF0F8] mb-1">{cat.label}</div>
                    <div className="text-xs text-[#4A5070] leading-snug">{cat.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* How we grade */}
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5070] mb-1.5">Methodology</p>
              <h2 className="font-serif text-2xl font-semibold text-[#EEF0F8]">How we grade products</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  title: "COA Verification",
                  desc: "We check whether a Certificate of Analysis exists, who issued it, and whether it covers the right panels.",
                },
                {
                  title: "Testing Credibility",
                  desc: "We identify whether the testing laboratory is named, independent, and ISO-accredited.",
                },
                {
                  title: "Safety Signals",
                  desc: "Heavy metals testing, GMP certification, and manufacturing transparency all factor into the grade.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
                  <div className="text-sm font-semibold text-[#EEF0F8] mb-2">{item.title}</div>
                  <div className="text-xs text-[#4A5070] leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/methodology"
                className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors"
              >
                Read the full methodology →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {products.length === 0 && (
              <div className="col-span-2 rounded-lg border border-dashed border-[#252A40] bg-[#0F1320] p-10 text-center">
                <p className="text-sm font-medium text-[#8892B8]">No products matched your filters.</p>
                <Link href="/" className="mt-2 inline-block text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
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
