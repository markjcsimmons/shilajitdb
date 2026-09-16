import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductCard, coaLabel, formLabel } from "@/components/product-card";
import { absoluteUrl } from "@/lib/site";
import { gradeBadgeClasses, gradeLabel, coaStatusClasses } from "@/lib/grade-colors";
import { cn } from "@/components/ui";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const totalCount = await prisma.product.count({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
  });
  const count = `${Math.floor(totalCount / 10) * 10}+`;
  return {
    title: `Shilajit Comparison: ${count} Products Ranked Side-by-Side (2026)`,
    description: `Compare ${count} shilajit products side-by-side: COA quality, heavy metal safety, lab accreditation, fulvic acid content, and price. Independent, unaffiliated ratings.`,
    alternates: { canonical: absoluteUrl("/shilajit-comparison") },
    openGraph: {
      title: `Shilajit Comparison: ${count} Products Ranked Side-by-Side (2026) | ShilajitDB`,
      description: `Compare ${count} shilajit products side-by-side: COA quality, heavy metal safety, lab accreditation, fulvic acid content, and price. Independent, unaffiliated ratings.`,
      url: absoluteUrl("/shilajit-comparison"),
    },
  };
}

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
  { grade: "A_PLUS", label: "A+", desc: "Resin only. Verified independent COA with numeric finished-product heavy metals, named lab, microbial panel, batch code" },
  { grade: "A",      label: "A",  desc: "Verified independent COA with numeric heavy metals, missing an extra such as a batch code. Resin or liquid extract" },
  { grade: "B",      label: "B",  desc: "Verified COA with gaps — no heavy metal values, or issued by the manufacturer. Highest grade for powders, capsules, tablets" },
  { grade: "C",      label: "C",  desc: "Unverified COA with partial evidence. Highest grade for gummies, honey sticks, blends" },
  { grade: "D",      label: "D",  desc: "COA claimed but not verified" },
  { grade: "E",      label: "E",  desc: "A single weak signal, such as a GMP claim" },
  { grade: "F",      label: "F",  desc: "No verifiable quality signal of any kind" },
];

const FAQS = [
  {
    q: "What is the best shilajit brand in 2026?",
    a: "The products graded A+ in our database are resins from Pürblack, Life Cykel, and Mars by GHC — each with a verified COA from a named independent laboratory reporting numeric heavy metals for the finished product. Pure Himalayan Shilajit Store, Pure Indian Foods, Puralis, and U.S. Shilajit (a liquid extract) follow at A. Only resin can reach A+, because every other form has been through extra processing. We earn affiliate commission on Pürblack links; it has no effect on grades.",
  },
  {
    q: "What does an A+ grade mean on ShilajitDB?",
    a: "An A+ grade means the product is a resin with a verified Certificate of Analysis from an independent laboratory that names itself on the report, with actual numeric values for lead, mercury, arsenic, and cadmium on the finished product, plus most of: a microbial panel, a batch code, a report dated within two years, a stated manufacturing country, and GMP certification. Powders, capsules, and gummies cannot reach A+ however good their COA. Fewer than 5% of products reviewed reach this standard.",
  },
  {
    q: "Which shilajit has the most fulvic acid?",
    a: "Fulvic acid percentages are not comparable between brands. Fulvic acid is sold as a standalone additive, labs measure it with different methods, and some brands report it on the raw extract rather than the finished product — so a higher number proves neither authenticity nor quality. That is why fulvic acid percentage earns no points in our grading; we score heavy metal results, lab independence, and batch traceability instead.",
  },
  {
    q: "Is Pürblack shilajit worth the price?",
    a: "Pürblack's resins grade A+, with public COAs from Cambium Analytica reporting numeric heavy metal values for the finished product. They sit in the Premium rather than Ultra Premium tier because those COAs carry no batch or lot code. Whether the premium price is justified depends on how much weight you place on testing depth versus cost per gram. Disclosure: we earn affiliate commission on Pürblack links, which has no effect on its grade.",
  },
  {
    q: "What is a Certificate of Analysis (COA) and why does it matter?",
    a: "A COA is a document from a laboratory showing what was actually found in a tested sample. For shilajit, a meaningful COA shows: the lab's name and accreditation, numeric heavy metal concentrations for the finished product (not just pass/fail), and a batch code tying the report to what you bought. Without a public COA from a named lab, there is no independent verification that the product contains what it claims or that it is safe.",
  },
  {
    q: "Which shilajit is safest for heavy metals?",
    a: "Products with low measured lead in our database include Pürblack (0.121 mg/kg) and Based (0.0005 mg/serving). Every product currently graded A or A+ has a verified independent COA with numeric heavy metal values. Products without a public COA cannot be assessed for heavy metal safety at all.",
  },
];

export default async function ShilajitComparisonPage() {
  const [topProducts, gradeCounts, coaCount, totalCount, bestResin, bestTested, bestValue] = await Promise.all([
    // Top 6 highest-graded products with public COA
    prisma.product.findMany({
      where: { isCanonical: true, coaStatus: "PUBLIC", dataCompleteness: { not: "LOW" } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 10,
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
            <p className="hidden sm:block text-sm text-[#C8D0E8] leading-relaxed">
              The result is a comparable, apples-to-apples ranking across brands that vary widely in price, form, and marketing claims. Of {totalCount}+ products reviewed, only {coaCount} ({Math.round((coaCount / totalCount) * 100)}%) have a fully public COA from a named independent laboratory — a number that reflects how opaque the shilajit industry still is.
            </p>
            <p className="hidden sm:block text-sm text-[#C8D0E8] leading-relaxed">
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

        {/* ── Side-by-side comparison table ── */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">Top-graded shilajit, ranked side-by-side</h2>
          <p className="text-sm text-[#8892B8] mb-4">
            The {topProducts.length} highest-graded products with a public Certificate of Analysis, compared on the criteria that matter.
          </p>
          <div className="overflow-x-auto rounded-lg border border-[#252A40]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252A40] bg-[#171C2E] text-left text-xs uppercase tracking-wider text-[#6E7A9A]">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                  <th className="px-4 py-3 font-semibold">Form</th>
                  <th className="px-4 py-3 font-semibold">COA</th>
                  <th className="px-4 py-3 font-semibold">Heavy metals</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id} className="border-b border-[#252A40] last:border-0 hover:bg-[#171C2E] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/product/${p.slug}`} className="block">
                        <span className="block text-xs font-medium uppercase tracking-[0.07em] text-[#8892B8]">{p.brand.name}</span>
                        <span className="block text-sm font-semibold text-[#EEF0F8] hover:text-[#6E9FFF] transition-colors">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded text-sm font-bold",
                        gradeBadgeClasses(p.overallGrade)
                      )}>
                        {gradeLabel(p.overallGrade)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#B0B8D0]">{formLabel(p.form)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded px-1.5 py-px text-xs whitespace-nowrap", coaStatusClasses(p.coaStatus))}>
                        {coaLabel(p.coaStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.heavyMetalsTested === "CONFIRMED" ? (
                        <span className="text-xs text-[#22C55E]">Confirmed</span>
                      ) : p.heavyMetalsTested === "CLAIMED" ? (
                        <span className="text-xs text-[#EAB308]">Claimed</span>
                      ) : (
                        <span className="text-xs text-[#4A5070]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-[#EEF0F8]">
                      {p.pricePerGramCents != null
                        ? `$${(p.pricePerGramCents / 100).toFixed(2)}/g`
                        : p.pricePerServingCents != null
                        ? `$${(p.pricePerServingCents / 100).toFixed(2)}/serving`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#6E7A9A]">
            <Link href="/" className="hover:text-[#8892B8] transition-colors underline underline-offset-2">See all {totalCount} products →</Link>
          </p>
        </div>

        {/* ── Grade key ── */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-1">How to read the grades</h2>
          <p className="text-sm text-[#8892B8] mb-4">Each product receives an overall grade from A+ to F based on what its COA documents, capped by product form.</p>
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
                title: "Batch code and report date",
                body: "A COA without a batch or lot code could describe any sample a brand chose to send. We check that the report is tied to a batch and dated within the last two years. Advertised fulvic acid percentages are not scored — they are measured inconsistently and easy to inflate.",
              },
              {
                title: "Manufacturing transparency",
                body: "We record whether the brand publicly states a manufacturing country, whether they claim GMP certification, and whether that claim is verifiable. US manufacturing carries FDA 21 CFR Part 111 oversight.",
              },
              {
                title: "Form factor",
                body: "Resin is the least processed form and the only one that can grade A+. Liquid extracts cap at A; powders, capsules, and tablets — made from extract dried at high temperature — cap at B; gummies, honey sticks, and blends cap at C.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
                <div className="text-sm font-semibold text-[#EEF0F8] mb-2">{item.title}</div>
                <div className="text-xs text-[#8892B8] leading-relaxed">{item.body}</div>
              </div>
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
