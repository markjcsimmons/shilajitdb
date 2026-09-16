import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
  description:
    "How ShilajitDB grades shilajit from A+ to F: points for what the COA documents, a grade ceiling set by product form, and why price never equals grade.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-grading-explained") },
  openGraph: {
    title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
    description:
      "The exact criteria separating A+ from A — verified independent COAs, numeric heavy metals, batch codes, and why only resin can reach the top grade.",
    url: absoluteUrl("/learn/shilajit-grading-explained"),
  },
};

export default function ShilajitGradingExplainedPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-grading-explained"
        title="Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ"
        description="How ShilajitDB grades shilajit from A+ to F: points for what the COA documents, a grade ceiling set by product form, and why price never equals grade."
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
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed September 2026 · 9 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base">
              The ShilajitDB Overall Grade is a single composite score from F to A+ that
              summarises what a product&apos;s lab testing actually documents, capped by how far
              its form has been processed away from whole resin. It is not a taste test and not
              an opinion. Every grade is computed deterministically from the same rules, applied
              identically to every product in the database.
            </p>
            <p>
              This article explains what each grade means in practice, the specific criteria
              that separate A+ from A, how product form limits the grade, why price has no
              relationship to grade, and what a brand would need to change to move up. See the <Link href="/methodology" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">full methodology →</Link>
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How the Overall Grade Is Calculated</h2>
            <p>
              The grade is built in two steps. First, a 14-point score is calculated from what
              the product&apos;s Certificate of Analysis actually documents — 11 of those points
              come from laboratory evidence. Second, the letter that score earns is capped by
              the product&apos;s form. No subjective adjustments are made.
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
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Verified COA from an independent lab</td>
                    <td className="px-4 py-3 text-[#8892B8]">+3</td>
                    <td className="px-4 py-3 text-[#8892B8]">A real lab document for this product has been reviewed — manufacturer- or brand-issued COAs, or COAs that cannot be verified, earn +1</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Numeric heavy metals on the finished product</td>
                    <td className="px-4 py-3 text-[#8892B8]">+4</td>
                    <td className="px-4 py-3 text-[#8892B8]">Actual lead, arsenic, cadmium and mercury concentrations — +2 if only the raw ingredient was tested, +1 for pass/fail only, halved on a manufacturer-issued COA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Testing lab named on the COA</td>
                    <td className="px-4 py-3 text-[#8892B8]">+2</td>
                    <td className="px-4 py-3 text-[#8892B8]">The lab can be looked up and its accreditation checked</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Microbial panel</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Checks for bacteria, yeast and mould as well as metals</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Batch or lot code on the COA</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Ties the report to the product actually sold rather than a one-off sample</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">COA dated within 24 months</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Old reports say little about current batches</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Country of manufacture stated</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Origin disclosed</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">GMP certified</td>
                    <td className="px-4 py-3 text-[#8892B8]">+1</td>
                    <td className="px-4 py-3 text-[#8892B8]">Baseline manufacturing standard</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Patent claims and advertised fulvic acid percentages earn no points. A patent says
              nothing about what a laboratory measured, and fulvic acid is sold as a standalone
              additive and measured inconsistently between labs, so a high figure proves neither
              identity nor quality.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Product Form Caps the Grade</h2>
            <p>
              Resin is the least-processed form of shilajit and the closest to the material used in
              clinical research. Every step away from it adds processing and dilution: powders are
              extract dried at high temperature, capsules and tablets are made from that powder, and
              gummies reheat it into a sugar, glycerin and gelatin base — typically at 50–200 mg per
              piece against the 250–500 mg/day used in trials. No trial has compared forms head to
              head, so form earns no points, but a clean COA cannot undo that processing either.
            </p>
            <div className="rounded-xl border border-[#252A40] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Form</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Highest grade</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Highest quality tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr><td className="px-4 py-3 text-[#EEF0F8]">Resin</td><td className="px-4 py-3 text-[#22C55E] font-semibold">A+</td><td className="px-4 py-3 text-[#8892B8]">Ultra Premium</td></tr>
                  <tr><td className="px-4 py-3 text-[#EEF0F8]">Liquid extract</td><td className="px-4 py-3 text-[#4ADE80] font-semibold">A</td><td className="px-4 py-3 text-[#8892B8]">Premium</td></tr>
                  <tr><td className="px-4 py-3 text-[#EEF0F8]">Powder, capsules, tablets</td><td className="px-4 py-3 text-[#3B82F6] font-semibold">B</td><td className="px-4 py-3 text-[#8892B8]">Premium</td></tr>
                  <tr><td className="px-4 py-3 text-[#EEF0F8]">Gummies, honey sticks, blends</td><td className="px-4 py-3 text-[#EAB308] font-semibold">C</td><td className="px-4 py-3 text-[#8892B8]">Average</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              When the cap lowers a grade, the product page says so next to the point score. See 
              <Link href="/learn/shilajit-gummies" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">how shilajit gummies are made</Link> 
              for the processing detail.
            </p>

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
                    <td className="px-4 py-3 text-[#8892B8]">Resin only. Verified independent COA + numeric finished-product heavy metals + lab named + microbial panel + batch code + recent date + stated country + GMP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#4ADE80]">A</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 10</td>
                    <td className="px-4 py-3 text-[#8892B8]">The same COA missing one or two extras, such as a batch code or microbial panel (liquid extracts can also reach A)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#3B82F6]">B</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 7</td>
                    <td className="px-4 py-3 text-[#8892B8]">Verified COA with a named lab but no heavy metal values, or a manufacturer-issued COA with numbers — and the ceiling for powders, capsules and tablets</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#EAB308]">C</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 4</td>
                    <td className="px-4 py-3 text-[#8892B8]">A COA that cannot be verified plus pass/fail metals, country and GMP — and the ceiling for gummies, honey sticks and blends</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#F97316]">D</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 2</td>
                    <td className="px-4 py-3 text-[#8892B8]">COA claimed but not verified, plus a stated country</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#F87171]">E</td>
                    <td className="px-4 py-3 text-[#8892B8]">≥ 1</td>
                    <td className="px-4 py-3 text-[#8892B8]">A single weak signal, such as a GMP claim</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-[#EF4444]">F</td>
                    <td className="px-4 py-3 text-[#8892B8]">0</td>
                    <td className="px-4 py-3 text-[#8892B8]">No verifiable quality signal of any kind</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Separates A+ from A</h2>
            <p>
              The gap is three points (10 vs 13), and in practice it comes down to whether the COA
              is complete enough to tie a clean result to the jar you buy:
            </p>
            <p>
              <strong className="text-[#EEF0F8]">1. Heavy metals measured on the finished product.</strong> A report
              with actual concentrations for the finished product earns +4. Testing only the raw
              ingredient earns +2, because what goes into a product is not necessarily what comes out.
              A pass/fail stamp earns +1, because it cannot be checked against a different safety limit.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">2. A batch or lot code and a recent date.</strong> Without a batch code,
              a COA could describe any sample the brand chose to send. A report older than 24 months
              says little about what is on the shelf today.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">3. Resin form.</strong> Only resin can reach A+. A gummy with a
              flawless COA still stops at C.
            </p>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ What an A+ profile looks like</p>
              <p className="text-xs text-[#22C55E]">
                Resin form. A COA issued by an independent laboratory that names itself on the
                document, reports numeric lead, arsenic, cadmium and mercury for the finished resin,
                includes a microbial panel, carries a batch code and is less than two years old. A
                stated manufacturing country and GMP certification. That scores 3+4+2+1+1+1+1+1 = 14.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Moves a Product Between Grades: Real Examples</h2>
            <p>
              A resin brand publishes a COA from an independent lab with numeric heavy metals, a
              named lab and a microbial panel, but no batch code and a report that is three years
              old. It scores 3+4+2+1+1+1 = 12 — an A. Retesting a current batch and printing the lot
              number on the report adds two points and takes it to A+.
            </p>
            <p>
              A gummy brand publishes exactly the same quality of COA. It also scores 12 — but its
              form caps it at C. No documentation change moves it higher.
            </p>
            <p>
              A capsule brand posts a COA its own manufacturer issued, with numeric heavy metals.
              The manufacturer-issued COA earns +1 instead of +3, and its heavy metal points are
              halved to +2. With a stated country and GMP it scores 5 — a C.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Quality Tier: A Different Axis</h2>
            <p>
              The Overall Grade is separate from the Quality Tier (Ultra Premium, Premium,
              Average, Poor). The tier is a strict checklist with no partial credit. Premium
              requires a verified COA from an independent lab with numeric heavy metal results.
              Ultra Premium additionally requires the lab named on the COA, heavy metals measured
              on the finished product, a microbial panel and a batch code. Form caps the tier the
              same way it caps the grade: only resin can be Ultra Premium, and gummies, honey
              sticks and blends stop at Average.
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
              speed, or consumer satisfaction. They do not directly measure efficacy — no product
              is tested for health outcomes — though the form ceiling reflects how much processing
              and dilution stand between the product and the material studied in clinical trials. They do not measure the geographic
              source of raw material (which cannot be verified from product listings). They
              do not penalise for price.
            </p>
            <p>
              What they measure is simpler: does this brand provide the documentation a consumer
              would need to independently verify that the product has been tested for safety by a
              credible independent laboratory — and how close is the product to the form that
              research actually describes?
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
            <p className="text-sm font-medium text-[#EEF0F8]">Browse Ultra Premium products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Filter the database to resin products whose COA meets every testing criterion —
              independent named lab, numeric finished-product heavy metals, microbial panel, and batch code.
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
