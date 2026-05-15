import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { absoluteUrl } from "@/lib/site";
import { gradeBadgeClasses, gradeLabel } from "@/lib/grade-colors";
import { cn } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Shilajit Brands (2026): 189+ Products Ranked by COA & Lab Testing | ShilajitDB",
  description:
    "Compare 189+ shilajit brands ranked by COA quality, lab accreditation, heavy metal safety, and price. Independent, unaffiliated ratings — find the best shilajit resin, capsules, and more.",
  alternates: { canonical: absoluteUrl("/shilajit-comparison") },
  openGraph: {
    title: "Best Shilajit Brands (2026): 189+ Products Ranked by COA & Lab Testing",
    description:
      "Compare 189+ shilajit brands ranked by COA quality, lab accreditation, heavy metal safety, and price. Independent, unaffiliated ratings.",
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

const GRADE_EXPLAIN = [
  { grade: "A_PLUS", label: "A+", desc: "Public COA, named accredited lab, numeric heavy metals, GMP manufacturing" },
  { grade: "A",      label: "A",  desc: "Public COA, named lab, most transparency criteria met" },
  { grade: "B",      label: "B",  desc: "Some COA evidence but gaps — unnamed lab, pass/fail only, or missing panels" },
  { grade: "C",      label: "C",  desc: "Limited or embedded COA, partial transparency" },
  { grade: "D",      label: "D",  desc: "No public COA, claims only" },
  { grade: "E",      label: "E",  desc: "No evidence of any testing" },
  { grade: "F",      label: "F",  desc: "Active safety or transparency concerns" },
];

const FAQS = [
  {
    q: "What is the best shilajit brand in 2026?",
    a: "Based on COA quality, lab accreditation, and heavy metal testing, the highest-graded brands in our database are Pürblack, Life Cykel, and Healthforce — all carrying A+ or A grades with public COAs from named ISO 17025-accredited laboratories. The 'best' brand depends on your priorities: resin vs capsules, price range, and sourcing region all vary across top picks.",
  },
  {
    q: "What does an A+ grade mean on ShilajitDB?",
    a: "An A+ grade means the product has a publicly available Certificate of Analysis from a named, independent, ISO 17025-accredited laboratory, with actual numeric values for at least the four primary heavy metals (lead, mercury, arsenic, cadmium), documented GMP manufacturing, and a transparent sourcing claim. Fewer than 10% of products reviewed reach this standard.",
  },
  {
    q: "Which shilajit has the most fulvic acid?",
    a: "Fulvic acid percentage varies by brand and product form. Resin products in our database typically report 60–85% fulvic acid on the finished product. Some brands report fulvic acid only on the raw extract, which inflates the figure. We flag whether fulvic acid was measured on the finished product vs raw material in each product's COA notes.",
  },
  {
    q: "Is Pürblack shilajit worth the price?",
    a: "Pürblack carries A+ grades across its product line — the highest in the database — with public COAs from named accredited labs, confirmed numeric heavy metal values, and proprietary radioactivity screening not seen in other brands. Whether the premium price is justified depends on how much weight you place on testing depth versus cost per gram.",
  },
  {
    q: "What is a Certificate of Analysis (COA) and why does it matter?",
    a: "A COA is a document from a laboratory showing what was actually found in a tested sample. For shilajit, a meaningful COA shows: the lab's name and accreditation, numeric heavy metal concentrations (not just pass/fail), and fulvic acid content on the finished product. Without a public COA from a named lab, there is no independent verification that the product contains what it claims or that it is safe.",
  },
  {
    q: "Which shilajit is safest for heavy metals?",
    a: "Products with the lowest measured heavy metal concentrations in our database include Pürblack (Lead 0.121 mg/kg), Healing Shilajit (Lead 0.087 mg/kg), and Based (Lead 0.0005 mg/serving). All products with an A or A+ grade have confirmed numeric heavy metal values below established safety thresholds. Products without a public COA cannot be assessed for heavy metal safety.",
  },
];

export default async function ShilajitComparisonPage() {
  const [topProducts, gradeCounts, coaCount, totalCount, bestResin, bestTested, bestValue] = await Promise.all([
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
    // Public COA count
    prisma.product.count({ where: { isCanonical: true, coaStatus: "PUBLIC" } }),
    // Total graded
    prisma.product.count({ where: { isCanonical: true, dataCompleteness: { not: "LOW" } } }),
    // Shortlist: best resin
    prisma.product.findMany({
      where: { isCanonical: true, bestForTags: { has: "best_resin" } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 3,
      select: PRODUCT_SELECT,
    }),
    // Shortlist: best tested
    prisma.product.findMany({
      where: { isCanonical: true, bestForTags: { has: "best_tested" } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 3,
      select: PRODUCT_SELECT,
    }),
    // Shortlist: best value
    prisma.product.findMany({
      where: { isCanonical: true, bestForTags: { has: "best_value" } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 3,
      select: PRODUCT_SELECT,
    }),
  ]);

  const gradeMap = Object.fromEntries(
    gradeCounts.map((g) => [g.overallGrade ?? "null", g._count])
  );

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best Shilajit Brands 2026",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="space-y-10">

        {/* ── Hero ── */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <div className="flex items-center gap-2 text-xs text-[#6E7A9A] mb-3">
            <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
            <span>/</span>
            <span>Shilajit Comparison</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8] leading-snug">
            Best Shilajit Brands (2026): {totalCount}+ Products Ranked by COA Quality & Lab Testing
          </h1>
          <div className="mt-4 space-y-3 max-w-2xl">
            <p className="text-sm text-[#C8D0E8] leading-relaxed">
              ShilajitDB has independently reviewed and graded {totalCount}+ shilajit products sold in the United States. Every product is assessed on the same objective criteria: whether a Certificate of Analysis exists and is publicly available, who issued it, whether that laboratory is independent and accredited, whether heavy metals were tested to actual numeric values, and what the manufacturing and sourcing claims are.
            </p>
            <p className="text-sm text-[#C8D0E8] leading-relaxed">
              The result is a comparable, apples-to-apples ranking across brands that vary widely in price, form, and marketing claims. Of {totalCount}+ products reviewed, only {coaCount} ({Math.round((coaCount / totalCount) * 100)}%) have a fully public COA from a named independent laboratory — a number that reflects how opaque the shilajit industry still is.
            </p>
            <p className="text-sm text-[#C8D0E8] leading-relaxed">
              We have no affiliation with any brand and earn no commission. Grades are assigned algorithmically from the evidence — not editorial opinion.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/methodology" className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              How we grade products →
            </Link>
            <Link href="/" className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              Browse all {totalCount} products →
            </Link>
          </div>
        </div>

        {/* ── Grade key ── */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">How to read the grades</h2>
          <p className="text-sm text-[#8892B8] mb-4">Each product receives an overall grade from A+ to F based on COA availability, lab credibility, heavy metals testing, and manufacturing transparency.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GRADE_EXPLAIN.map((g) => (
              <div key={g.grade} className="flex items-start gap-3 rounded-lg border border-[#252A40] bg-[#0F1320] p-3">
                <div className={cn(
                  "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold",
                  gradeBadgeClasses(g.grade as Parameters<typeof gradeBadgeClasses>[0])
                )}>
                  {gradeLabel(g.grade as Parameters<typeof gradeLabel>[0])}
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed pt-0.5">{g.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#6E7A9A]">
            <Link href="/methodology" className="hover:text-[#8892B8] transition-colors underline underline-offset-2">Full grading methodology →</Link>
          </p>
        </div>

        {/* ── Curated shortlists ── */}
        <div className="space-y-8">
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8]">Top picks by category</h2>

          {/* Best resin */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A] mb-0.5">Best Resin</p>
                <p className="text-sm text-[#8892B8]">Least-processed form — highest fulvic acid transparency</p>
              </div>
              <Link href="/best/best-resin" className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors shrink-0">
                See all 5 →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {bestResin.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>

          {/* Best tested */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A] mb-0.5">Best Tested</p>
                <p className="text-sm text-[#8892B8]">Public COA, named accredited lab, numeric heavy metal values</p>
              </div>
              <Link href="/best/best-tested" className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors shrink-0">
                See all 5 →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {bestTested.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>

          {/* Best value */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A] mb-0.5">Best Value</p>
                <p className="text-sm text-[#8892B8]">Strong testing credentials at a competitive price per gram</p>
              </div>
              <Link href="/best/best-value" className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors shrink-0">
                See all 5 →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {bestValue.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>

        {/* ── Grade distribution ── */}
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

        {/* ── What we compare ── */}
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
                body: "We distinguish between in-house testing, contracted testing from unnamed labs, and testing from named ISO 17025-accredited third-party laboratories such as Eurofins, Certified Laboratories, or Anresco. Only the last category earns full credit.",
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

        {/* ── Top products ── */}
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

        {/* ── By form ── */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">Compare shilajit by category</h2>
          <p className="text-sm text-[#8892B8] mb-4">Each category ranks products on the same grading criteria, filtered to the most relevant signal for that use case.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { href: "/best/best-resin",               label: "Best Shilajit Resin",        desc: "Least processed, most transparent" },
              { href: "/best/best-capsules",             label: "Best Shilajit Capsules",      desc: "Convenience with verified testing" },
              { href: "/best/best-tested",               label: "Best Tested Overall",         desc: "Public COA, named lab, numeric HM values" },
              { href: "/best/best-value",                label: "Best Value",                  desc: "Quality per dollar ranked" },
              { href: "/best/best-gummies",              label: "Best Gummies",                desc: "Most processed — COA especially important" },
              { href: "/best/best-third-party-tested",   label: "Best 3rd-Party Tested",       desc: "Confirmed numeric heavy metal values" },
              { href: "/best/best-for-men",              label: "Best for Men",                desc: "Top resin picks with confirmed testing" },
              { href: "/best/best-for-women",            label: "Best for Women",              desc: "Top capsule & gummy picks" },
              { href: "/best/best-himalayan-shilajit",   label: "Best Himalayan Shilajit",     desc: "India & Pakistan sourced, highest graded" },
              { href: "/best/editors-pick",              label: "Editor's Picks",              desc: "Top picks across all criteria" },
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

        {/* ── FAQ ── */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
                <p className="text-sm font-semibold text-[#EEF0F8] mb-2">{faq.q}</p>
                <p className="text-xs text-[#8892B8] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
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
