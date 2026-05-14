import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { SearchBox } from "@/components/search-box";
import { SortSelect } from "@/components/sort-select";
import { ProductCard } from "@/components/product-card";
import { CompareProvider } from "@/components/compare-provider";
import { CompareButton } from "@/components/compare-button";
import { prisma } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import {
  buildOrderBy,
  buildProductWhere,
  PAGE_SIZE,
  parseProductFilters,
  type SearchParams,
} from "@/lib/search";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Shilajit Brands Ranked & Compared | ShilajitDB",
  description:
    "Compare 189+ shilajit products by COA quality, lab credibility, and heavy metal safety. Independently graded — find the best shilajit resin, capsules, and more.",
  openGraph: {
    title: "Best Shilajit Brands Ranked & Compared | ShilajitDB",
    description:
      "Compare shilajit brands on COA quality, third-party lab testing, and heavy metal safety. 189+ products independently graded.",
  },
  alternates: { canonical: getSiteUrl() },
};

const BEST_FOR_CATEGORIES = [
  {
    tag: "editors_pick",
    label: "Editor's Picks",
    description: "Hand-selected across quality, transparency, and value",
    icon: "⭐",
  },
  {
    tag: "best_tested",
    label: "Best Tested",
    description: "Public COA from a named independent lab, heavy metals confirmed",
    icon: "🔬",
  },
  {
    tag: "best_resin",
    label: "Best Resin",
    description: "Top-rated resin — the least processed, most traditional form",
    icon: "🪨",
  },
  {
    tag: "best_value",
    label: "Best Budget",
    description: "Strong testing credentials at a competitive price",
    icon: "💰",
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
      <div className="-mx-4 border-b border-[#252A40] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center gap-4 sm:gap-8 overflow-x-auto">
          {[
            { value: String(productCount), label: "products graded" },
            { value: String(brandCount), label: "brands tracked" },
            { value: `${coaPercent}%`, label: "with public COA" },
            { value: lastVerifiedLabel ?? "—", label: "last updated" },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-2 whitespace-nowrap shrink-0">
              <span className="font-mono text-base font-bold text-[#EEF0F8]">{s.value}</span>
              <span className="text-xs text-[#8892B8]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="-mx-4 border-b border-[#252A40] px-4 pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8 xl:gap-10">

            {/* Left: headline + search + filters */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3D7AFF] mb-4">
                Independent · Unaffiliated · Free
              </p>
              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight tracking-tight text-[#EEF0F8] mb-4">
                Shilajit<br />
                <span className="italic font-normal text-[#8892B8]">Transparency</span> Database
              </h1>
              <p className="text-base leading-relaxed text-[#C8D0E8] max-w-lg mb-2">
                Every product graded on COA quality, lab credibility, heavy metal safety, and manufacturing transparency.
              </p>
              <Link href="/methodology" className="text-sm text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors mb-6 inline-block">
                How do we grade? →
              </Link>

              {/* Search */}
              <div className="mt-2">
                <SearchBox initialQ={filters.q} filters={filterState} hero />
              </div>

              {/* Filter chips */}
              <div className="mt-3">
                <FilterBar filters={filterState} total={total} active={hasActiveFilter} />
              </div>

              {hasActiveFilter && (
                <div className="flex justify-end mt-2">
                  <SortSelect current={filters.sort} filters={filterState} />
                </div>
              )}
            </div>

            {/* Right: Top Picks */}
            <div className="mt-10 lg:mt-0 lg:flex lg:flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A] mb-3 shrink-0">Top Picks</p>
              <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 lg:flex-1 lg:grid-rows-3">
                {BEST_FOR_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.tag}
                    href={`/best/${cat.tag.replace(/_/g, "-")}`}
                    className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-3 transition-colors hover:bg-[#171C2E] hover:border-[#313760] flex flex-col"
                  >
                    <div className="text-xl mb-1.5">{cat.icon}</div>
                    <div className="text-xs font-semibold text-[#EEF0F8] mb-1 leading-snug">{cat.label}</div>
                    <div className="hidden lg:block text-[11px] text-[#6E7A9A] leading-snug">{cat.description}</div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Product list / discovery ── */}
      {!hasActiveFilter ? (
        <div className="space-y-12 pt-8">

          {/* How we grade */}
          <div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A] mb-1.5">Methodology</p>
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
                  <div className="text-xs text-[#8892B8] leading-relaxed">{item.desc}</div>
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
        <CompareProvider>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {products.map((p) => (
              <div key={p.id}>
                <ProductCard product={p} />
                <CompareButton slug={p.slug} name={p.name} grade={p.overallGrade} />
              </div>
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
        </CompareProvider>
      )}
    </div>
  );
}
