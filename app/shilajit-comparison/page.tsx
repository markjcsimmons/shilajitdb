import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { absoluteUrl } from "@/lib/site";
import { gradeBadgeClasses, gradeLabel } from "@/lib/grade-colors";
import { cn } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shilajit Brand Comparison (2026): 189+ Products Ranked | ShilajitDB",
  description:
    "Compare shilajit brands side by side on COA quality, lab accreditation, heavy metal safety, and price. Independent, unaffiliated ratings of 189+ products.",
  alternates: { canonical: absoluteUrl("/shilajit-comparison") },
  openGraph: {
    title: "Shilajit Brand Comparison (2026): 189+ Products Ranked",
    description:
      "Compare shilajit brands on COA quality, lab accreditation, heavy metal safety, and price. Independent ratings of 189+ products.",
    url: absoluteUrl("/shilajit-comparison"),
  },
};

const PRODUCT_SELECT = {
  id: true, slug: true, name: true, form: true,
  dataCompleteness: true, manufacturingCountryClaim: true,
  coaStatus: true, coaUrl: true, transparencyGrade: true,
  qualityTier: true, overallGrade: true, thirdPartyTestingLab: true,
  lastVerifiedAt: true, heavyMetalsTested: true, bestForTags: true,
  pricePerServingCents: true, pricePerGramCents: true,
  brand: { select: { name: true, slug: true } },
} as const;

const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"] as const;

export default async function ShilajitComparisonPage() {
  const [topProducts, gradeCounts, formCounts, coaCount, totalCount] = await Promise.all([
    // Top 6 highest-graded products with public COA
    prisma.product.findMany({
      where: { isCanonical: true, coaStatus: "PUBLIC", dataCompleteness: { not: "LOW" } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 6,
      select: PRODUCT_SELECT,
    }),
    // Grade distribution
    prisma.product.groupBy({
      by: ["overallGrade"],
      where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      _count: true,
    }),
    // Form distribution
    prisma.product.groupBy({
      by: ["form"],
      where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      _count: true,
      orderBy: { _count: { form: "desc" } },
    }),
    // Public COA count
    prisma.product.count({ where: { isCanonical: true, coaStatus: "PUBLIC" } }),
    // Total graded
    prisma.product.count({ where: { isCanonical: true, dataCompleteness: { not: "LOW" } } }),
  ]);

  const gradeMap = Object.fromEntries(
    gradeCounts.map((g) => [g.overallGrade ?? "null", g._count])
  );

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shilajit Brand Comparison",
    description: "Top-graded shilajit products ranked by COA quality, lab credibility, and heavy metal safety.",
    url: absoluteUrl("/shilajit-comparison"),
    numberOfItems: topProducts.length,
    itemListElement: topProducts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug}`),
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="space-y-8">

        {/* Hero */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <div className="flex items-center gap-2 text-xs text-[#6E7A9A] mb-3">
            <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
            <span>/</span>
            <span>Shilajit Comparison</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8] leading-snug">
            Shilajit Brand Comparison (2026)
          </h1>
          <div className="mt-4 space-y-3 max-w-2xl">
            <p className="text-sm text-[#C8D0E8] leading-relaxed">
              ShilajitDB has reviewed and graded {totalCount}+ shilajit products sold in the United States. Every product is assessed on the same objective criteria: whether a Certificate of Analysis exists and is publicly available, who issued it, whether that laboratory is independent and accredited, whether heavy metals were tested to actual numeric values, and what the manufacturing and sourcing claims are.
            </p>
            <p className="text-sm text-[#C8D0E8] leading-relaxed">
              The result is a comparable, apples-to-apples ranking across brands that vary widely in price, form, and marketing claims. Of {totalCount}+ products reviewed, only {coaCount} ({Math.round((coaCount / totalCount) * 100)}%) have a fully public COA from a named independent laboratory — a number that reflects how opaque the shilajit industry still is.
            </p>
          </div>
        </div>

        {/* Grade distribution */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">How shilajit brands compare on grade</h2>
          <p className="text-sm text-[#8892B8] mb-4">Distribution of overall grades across {totalCount} reviewed products.</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
            {GRADE_ORDER.map((grade) => {
              const count = gradeMap[grade] ?? 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={grade} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-3 text-center">
                  <div className={cn(
                    "mx-auto mb-2 h-10 w-10 rounded-lg flex items-center justify-center text-base font-bold",
                    gradeBadgeClasses(grade as Parameters<typeof gradeBadgeClasses>[0])
                  )}>
                    {gradeLabel(grade as Parameters<typeof gradeLabel>[0])}
                  </div>
                  <div className="text-lg font-bold text-[#EEF0F8]">{count}</div>
                  <div className="text-xs text-[#6E7A9A]">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What we compare */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">What we compare and why it matters</h2>
          <p className="text-sm text-[#8892B8] mb-4">The shilajit market has almost no regulatory oversight. These signals separate credible products from marketing-only brands.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Certificate of Analysis (COA)",
                body: "A COA is a lab document showing what was actually found in the product. We assess whether it is publicly available, whether it covers the finished product (not just the raw material), and whether results are numeric or just pass/fail.",
              },
              {
                title: "Laboratory independence & accreditation",
                body: "We distinguish between in-house testing, contracted testing from unnamed labs, and testing from named ISO 17025-accredited third-party laboratories such as Eurofins, A2LA members, or NSF. Only the last category earns full credit.",
              },
              {
                title: "Heavy metals panel",
                body: "Shilajit is a mineral-rich substance sourced from mountain rock deposits, which means heavy metal contamination is a genuine risk. We look for numeric results for lead, mercury, arsenic, and cadmium — not just a claim of testing.",
              },
              {
                title: "Fulvic acid percentage",
                body: "Fulvic acid is the primary active compound in shilajit. Some COAs report fulvic acid content on the raw extract; what matters is the percentage in the finished, formulated product you actually consume.",
              },
              {
                title: "Manufacturing transparency",
                body: "We record whether the brand publicly states a manufacturing country, whether they claim GMP certification, and whether that claim is verifiable. US manufacturing carries FDA 21 CFR Part 111 oversight.",
              },
              {
                title: "Form factor",
                body: "Resin is the least processed form — no carriers, no fillers, the mineral matrix is intact. Capsules and powders introduce additional processing steps. Gummies introduce the most. Form affects both what you get and what can be hidden.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
                <div className="text-sm font-semibold text-[#EEF0F8] mb-2">{item.title}</div>
                <div className="text-xs text-[#8892B8] leading-relaxed">{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">Highest-graded shilajit with a public COA</h2>
          <p className="text-sm text-[#8892B8] mb-4">
            Products below have a publicly available Certificate of Analysis from a named third-party laboratory.{" "}
            <Link href="/" className="text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">See all {totalCount} products →</Link>
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* By form */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">Compare shilajit by form</h2>
          <p className="text-sm text-[#8892B8] mb-4">Each form has different processing implications and testing considerations.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { href: "/best/best-resin",    label: "Best Shilajit Resin",    desc: "Least processed, most transparent" },
              { href: "/best/best-capsules", label: "Best Shilajit Capsules", desc: "Convenience with verified testing" },
              { href: "/best/best-tested",   label: "Best Tested Overall",    desc: "Public COA, named lab, numeric HM values" },
              { href: "/best/best-value",    label: "Best Value",             desc: "Quality per dollar ranked" },
              { href: "/best/best-gummies",  label: "Best Gummies",           desc: "Most processed — COA especially important" },
              { href: "/best/editors-pick",  label: "Editor's Picks",         desc: "Top picks across all criteria" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-4 transition-colors hover:bg-[#171C2E] hover:border-[#313760]"
              >
                <div className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#6E9FFF] transition-colors mb-1">{item.label}</div>
                <div className="text-xs text-[#6E7A9A]">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 text-center">
          <p className="text-sm font-semibold text-[#EEF0F8] mb-1">Browse the full database</p>
          <p className="text-xs text-[#8892B8] mb-4">Filter by quality tier, COA status, form, price, and more. Every product graded on the same criteria.</p>
          <Link
            href="/?qualityTier=ULTRA_PREMIUM"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D7AFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E9FFF] transition-colors"
          >
            View top-rated products →
          </Link>
        </div>

      </div>
    </>
  );
}
