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

const BEST_FOR_CATEGORIES = [
  {
    tag: "best_tested",
    label: "Best Tested",
    description: "Public COA from a named independent laboratory",
    icon: "🔬",
    color: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    labelColor: "text-sky-800",
  },
  {
    tag: "best_value",
    label: "Best Value",
    description: "Strong testing credentials at a fair price",
    icon: "💰",
    color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    labelColor: "text-emerald-800",
  },
  {
    tag: "best_resin",
    label: "Best Resin",
    description: "Top-rated resin — least processed format",
    icon: "🪨",
    color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    labelColor: "text-amber-900",
  },
  {
    tag: "best_us_made",
    label: "Best US-Made",
    description: "Manufactured in the United States",
    icon: "🇺🇸",
    color: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    labelColor: "text-slate-800",
  },
  {
    tag: "best_beginners",
    label: "Best for Beginners",
    description: "Easy to start with, well-documented",
    icon: "✨",
    color: "bg-violet-50 border-violet-200 hover:bg-violet-100",
    labelColor: "text-violet-800",
  },
  {
    tag: "editors_pick",
    label: "Editor's Picks",
    description: "Hand-selected across quality, transparency, and value",
    icon: "⭐",
    color: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    labelColor: "text-rose-800",
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
    filters.manufacturingCountryClaim
  );

  const where = buildProductWhere(filters);
  const orderBy = buildDefaultOrderBy();
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [total, products, productCount, brandCount, publicCoaCount] = await Promise.all([
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
    prisma.product.count({ where: { isCanonical: true, dataCompleteness: { not: "LOW" } } }),
    prisma.brand.count(),
    prisma.product.count({ where: { isCanonical: true, coaStatus: "PUBLIC" } }),
  ]);

  const coaPercent = productCount > 0 ? Math.round((publicCoaCount / productCount) * 100) : 0;

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
  };

  return (
    <div className="space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 md:px-10 md:py-10">
        {/* Subtle amber glow top-right */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-amber-500/5 blur-2xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Unbiased. Comprehensive. Free.
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl max-w-xl leading-snug">
            Shilajit transparency database
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-lg leading-relaxed">
            Every product graded on COA quality, testing lab credibility, heavy metal safety,
            and manufacturing transparency — so you can buy with confidence.
          </p>

          {/* Stat chips */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { value: productCount, label: "products graded" },
              { value: brandCount, label: "brands tracked" },
              { value: `${coaPercent}%`, label: "with public COA" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search + filters ── */}
      <SearchBox initialQ={filters.q} filters={filterState} />
      <FilterBar filters={filterState} total={total} active={hasActiveFilter} />

      {/* ── Product list / discovery ── */}
      {!hasActiveFilter ? (
        <div className="space-y-6 pt-2">
          {/* Best-of category cards */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Browse by category</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BEST_FOR_CATEGORIES.map((cat) => (
                <Link
                  key={cat.tag}
                  href={`/best/${cat.tag.replace(/_/g, "-")}`}
                  className={`group rounded-2xl border p-4 transition-all duration-150 hover:shadow-sm ${cat.color}`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className={`text-sm font-semibold ${cat.labelColor}`}>{cat.label}</div>
                  <div className="mt-0.5 text-xs text-stone-500 leading-snug">{cat.description}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* How we grade mini-explainer */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">How we grade products</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "COA verification",
                  desc: "We check whether a Certificate of Analysis exists, who issued it, and whether it covers the right panels.",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                  title: "Testing credibility",
                  desc: "We identify whether the testing laboratory is named, independent, and ISO-accredited.",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  ),
                  title: "Safety signals",
                  desc: "Heavy metals testing, GMP certification, and manufacturing transparency all factor into the grade.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                    <div className="mt-0.5 text-xs text-stone-500 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100">
              <Link
                href="/methodology"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
              >
                Read the full methodology →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-sm font-medium text-slate-600">No products matched your filters.</p>
                <Link href="/" className="mt-2 inline-block text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800">
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
