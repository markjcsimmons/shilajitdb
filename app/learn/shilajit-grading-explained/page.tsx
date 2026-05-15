import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
  description:
    "A clear breakdown of how ShilajitDB grades shilajit products from A+ to D — the specific criteria, why high price never equals high grade, and how to move up the scale.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-grading-explained") },
  openGraph: {
    title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
    description:
      "The exact criteria separating A+ from A — named labs, numeric heavy metals, GMP documentation, and why they matter for your safety.",
    url: absoluteUrl("/learn/shilajit-grading-explained"),
  },
};

export default function ShilajitGradingExplainedPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-grading-explained"
        title="Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ"
        description="A clear breakdown of how ShilajitDB grades shilajit products from A+ to D — the specific criteria, why high price never equals high grade, and how to move up the scale."
        datePublished="2026-05-14"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Grades Explained</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#0A1628] border border-[#3D7AFF]/30 px-3 py-1 text-xs font-medium text-[#6E9FFF] mb-4">
              Grading
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 9 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base">
              The ShilajitDB Overall Grade is a single composite score from F to A+ that
              summarises how transparently a brand documents its product and how well that
              documentation reflects evidence-based quality signals. It is not a taste test,
              not a bioavailability measurement, and not an opinion. Every grade is computed
              deterministically from structured, publicly verifiable data points — applied
              identically to every product in the database.
            </p>
            <p>
              This article explains what each grade means in practice, the specific criteria
              that separate A+ from A, why price has no relationship to grade, and what a
              brand would need to change to move from, say, a C to a B. See the <Link href="/methodology" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">full methodology →</Link>
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How the Overall Grade Is Calculated</h2>
            <p>
              The Overall Grade is based on a 14-point weighted scoring system. Nine signals
              are evaluated for each product. Points are awarded for each verified signal, and
              the total score maps to a letter grade. No subjective adjustments are made.
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Signal</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Points</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Why it matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Form = Resin</td>
                    <td className="px-4 py-3 text-[#8892B8]">+4</td>
                    <td className="px-4 py-3 text-[#8892B8]">Least-processed form; best preserves the fulvic-humic matrix</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Manufacturing country: USA</td>
                    <td className="px-4 py-3 text-[#8892B8]">+3</td>
                    <td className="px-4 py-3 text-[#8892B8]">FDA 21 CFR Part 111 mandatory regulatory oversight</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Patent claim</td>
                    <td className="px-4 py-3 text-[#8892B8]">+2</td>
                    <td className="px-4 py-3 text-[#8892B8]">Verifiable IP — patents require documented, reviewed processes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">COA publicly available</td>
                    <td className="px-4 py-3 text-[#8892B8]">+2</td>
                    <td className="px-4 py-3 text-[#8892B8]">Lab results downloadable and independently auditable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Named third-party testing lab</td>
                    <td className="px-4 py-3 text-[#8892B8]">+2</td>
                    <td className="px-4 py-3 text-[#8892B8]">Accreditation and methods are checkable by anyone</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">COA embedded on product page</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Visible but not independently downloadable — partial credit</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">COA available on request</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Testing exists but is gated — partial credit only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Manufacturing country: other stated</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Origin disclosed even without strong local regulation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">GMP certified</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Baseline manufacturing standard — ~80% of products claim it</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Grade Thresholds: What Each Letter Means</h2>

            <div className="rounded-xl border border-[#252A40] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Grade</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Score needed (of 14)</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Typical profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#22C55E]">A+</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 13</td>
                    <td className="px-4 py-3 text-[#8892B8]">Resin + USA manufacturing + patent + public COA + named lab + GMP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#4ADE80]">A</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 10</td>
                    <td className="px-4 py-3 text-[#8892B8]">Resin + USA + public COA + named lab + GMP (no patent)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#3B82F6]">B</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 7</td>
                    <td className="px-4 py-3 text-[#8892B8]">Resin + public COA + named lab (no USA, no patent)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#EAB308]">C</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 4</td>
                    <td className="px-4 py-3 text-[#8892B8]">Public COA + GMP + stated country — but unnamed lab</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#F97316]">D</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 2</td>
                    <td className="px-4 py-3 text-[#8892B8]">COA on request + stated country — no public lab results</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#EF4444]">F</td>
                    <td className="px-4 py-3 text-[#8892B8]">0</td>
                    <td className="px-4 py-3 text-[#8892B8]">No verifiable quality signal of any kind</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Separates A+ from A: The Three Differentiators</h2>
            <p>
              The gap between A and A+ is not large in terms of points (10 vs 13), but it is
              significant in terms of what it requires. In practice, three things separate
              them:
            </p>
            <p>
              <strong className="text-[#EEF0F8]">1. A manufacturing patent.</strong> A+ requires a patented process
              (worth +2 points). Patents are granted after review by a patent authority and
              represent a documented, differentiated manufacturing method. Most brands do not
              have one. The patent number should be verifiable on Google Patents or the USPTO
              database — a brand claiming a patent without a verifiable number does not earn
              this credit.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">2. USA manufacturing.</strong> US-based manufacturing brings FDA
              regulatory oversight under 21 CFR Part 111, which mandates identity, purity,
              strength, and composition testing for dietary supplements. This is structural
              accountability that self-reported GMP certification in other countries cannot
              match — which is why USA manufacturing is worth +3 points and other stated
              countries only +1.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">3. Named third-party lab with a public COA.</strong> An A grade
              requires a public COA and a named lab (+2 +2 = 4 points for these two signals
              combined). A brand with a public COA from an unnamed "accredited laboratory" earns
              only +2 — and stays in the C/B range regardless of other signals.
            </p>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ What an A+ profile looks like</p>
              <p className="text-xs text-[#22C55E]">
                Resin form. Manufactured in the USA. Holds a verifiable patent (number listed,
                searchable on USPTO). Publishes a COA that is downloadable as a PDF from their
                website. The COA names a recognised third-party laboratory (e.g. Eurofins,
                Certified Laboratories, Anresco). Claims cGMP certification. This combination
                scores 4+3+2+2+2+1 = 14 points — the maximum possible.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Moves a Product Between Grades: Real Examples</h2>
            <p>
              Consider a brand selling resin with a COA posted on their website, but the COA
              does not name the laboratory. The lab anonymisation might seem minor — but it
              removes +2 points, dropping the product from a potential B to a C. The consumer
              has no way to verify the lab&apos;s ISO 17025 accreditation, check the specific ICP-MS
              methodology used, or confirm the results are not self-generated.
            </p>
            <p>
              A capsule product from a non-US brand with a named lab and public COA typically
              scores: 0 (capsule) + 1 (other country) + 2 (public COA) + 2 (named lab) + 1
              (GMP) = 6 points — a B grade. The same brand switching to resin, with identical
              documentation, would score 4 + 1 + 2 + 2 + 1 = 10 — an A grade. Form alone
              shifts the grade by four letter positions.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Quality Tier: A Different Axis</h2>
            <p>
              The Overall Grade is separate from the Quality Tier (Ultra Premium, Premium,
              Average, Poor). The Quality Tier uses a binary checklist — all criteria for a
              tier must be met simultaneously; there is no partial credit. Ultra Premium
              requires: resin form, public COA, named third-party lab, stated manufacturing
              country, GMP certification, and a patent. This is a stricter standard than the
              grade — a product can score 12 points (an A) but miss the patent requirement
              and therefore land in Premium rather than Ultra Premium.
            </p>
            <p>
              Conversely, a product cannot be Ultra Premium without also having a very high
              Overall Grade, because the Ultra Premium checklist incorporates the strongest
              individual signals.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Why Price Has No Relationship to Grade</h2>
            <p>
              This is one of the most consistently misunderstood aspects of the shilajit market.
              In our database, there are products priced above $80 for a month&apos;s supply
              that receive a D or F grade — because they publish no COA, name no lab, and make
              no verifiable manufacturing claim. There are products priced at $30–40 that receive
              a B or A — because they publish a clean, named-lab COA. Premium pricing in the
              supplement industry reflects marketing spend, packaging, brand positioning, and
              retail margins, not objective quality documentation.
            </p>
            <p>
              The correlation between price and grade in our database is close to zero. This
              is by design: the grade rewards disclosure and verifiability, not marketing
              investment.
            </p>

            <div className="rounded-lg bg-[#200505] border border-[#EF4444]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#EF4444] mb-1">⚠ Watch out for</p>
              <p className="text-xs text-[#EF4444]">
                Brands that advertise &quot;third-party tested&quot; without naming the laboratory, or
                display a COA image on their product page without making the underlying PDF
                downloadable. Both are step-down documentation practices that earn reduced
                scores — and, more importantly, prevent independent verification of the
                results.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Our Grades Do Not Measure</h2>
            <p>
              The Overall Grade and Quality Tier do not assess taste, texture, colour, dissolution
              speed, or consumer satisfaction. They do not measure efficacy — whether the
              product produces the health outcomes claimed. They do not measure the geographic
              source of raw material (which cannot be verified from product listings). They
              do not penalise for price.
            </p>
            <p>
              What they measure is simpler and more limited: does this brand provide the
              documentation a consumer would need to independently verify that the product is
              what it claims to be, and that it has been tested for safety by a credible
              independent laboratory? Those are the questions the grading system is designed
              to answer.
            </p>
            <p>
              For a full technical breakdown of every signal weight and threshold, see our{" "}
              <Link href="/methodology" className="underline hover:text-[#EEF0F8]">
                scoring methodology
              </Link>
              .
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Browse A+ rated products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Filter the database to show only products that have achieved the maximum score —
              resin form, US manufacturing, patent, public COA, and named lab.
            </p>
            <Link
              href="/?qualityTier=ULTRA_PREMIUM"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              View Ultra Premium products →
            </Link>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. FDA. 21 CFR Part 111 — Current Good Manufacturing Practice in Manufacturing,
                Packaging, Labeling, or Holding Operations for Dietary Supplements.{" "}
                <a href="https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-111" target="_blank" rel="noopener noreferrer" className="underline">ecfr.gov</a>
              </li>
              <li>
                2. ISO 17025:2017. General requirements for the competence of testing and calibration
                laboratories.{" "}
                <a href="https://www.iso.org/standard/66912.html" target="_blank" rel="noopener noreferrer" className="underline">ISO.org</a>
              </li>
              <li>
                3. Stohs SJ. Safety and efficacy of shilajit (mumie, moomiyo).{" "}
                <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
              </li>
              <li>
                4. US Pharmacopeia. General Chapter &lt;232&gt; Elemental Impurities — Limits.{" "}
                <a href="https://www.usp.org/harmonization-standards/pdg/excipients/elemental-impurities" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/how-to-read-shilajit-coa" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Up next</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Read a Shilajit COA →</p>
          </Link>
          <Link href="/shilajit-comparison" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Compare Shilajit Products Side by Side →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
