import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Pass/Fail COA vs Numeric Results: Why the Difference Matters for Shilajit Safety",
  description:
    "Why a pass/fail heavy metals certificate is insufficient for shilajit, what ICP-MS numeric results look like, and how to tell the difference when reading a COA.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-coa-pass-fail-vs-numeric") },
  openGraph: {
    title: "Pass/Fail COA vs Numeric Results: Why the Difference Matters for Shilajit Safety",
    description:
      "Pass/fail certificates can hide dangerous proximity to safety limits. Here is what to look for and why numeric ICP-MS results are the only credible standard.",
    url: absoluteUrl("/learn/shilajit-coa-pass-fail-vs-numeric"),
  },
};

export default function CoaPassFailVsNumericPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-coa-pass-fail-vs-numeric"
        title="Pass/Fail COA vs Numeric Results: Why the Difference Matters for Shilajit Safety"
        description="Why a pass/fail heavy metals certificate is insufficient for shilajit, what ICP-MS numeric results look like, and how to tell the difference when reading a COA."
        datePublished="2026-05-14"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Pass/Fail vs Numeric COA</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#0A1628] border border-[#3D7AFF]/30 px-3 py-1 text-xs font-medium text-[#6E9FFF] mb-4">
              Testing
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Pass/Fail COA vs Numeric Results: Why the Difference Matters for Shilajit Safety
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 8 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base">
              When a shilajit brand says &quot;third-party tested for <Link href="/learn/shilajit-heavy-metals" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">heavy metals</Link>,&quot; the follow-up
              question that matters is: what type of results did that testing produce? There is
              a meaningful difference between a Certificate of Analysis that reports &quot;PASS&quot; for
              lead and one that reports &quot;Lead: 0.121 mg/kg (limit: 10 mg/kg).&quot; Both might be
              technically accurate — but only the second gives you the information needed to
              assess safety independently.
            </p>
            <p>
              This distinction is not widely understood by consumers, and some brands
              exploit the gap. Understanding it is the single most important skill for
              evaluating shilajit safety documentation.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What a Pass/Fail COA Looks Like</h2>
            <p>
              A pass/fail COA reports test results as a binary outcome: PASS or FAIL, CONFORM
              or NON-CONFORM, DETECTED / NOT DETECTED (when a detection threshold is the only
              information given). The product page or packaging states that the product has
              &quot;passed heavy metals testing&quot; — and the COA, if provided at all, confirms
              this with a checkbox or stamp.
            </p>
            <p>
              This format is widely used for microbiological testing — PASS / FAIL for
              Salmonella, E. coli, and Staph aureus is appropriate because the threshold is
              binary (presence vs absence). For heavy metals, however, it is not appropriate,
              because the safety question is quantitative: <em>how close to the limit is this
              product?</em>
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Why Pass/Fail Is Insufficient for Heavy Metals</h2>
            <p>
              There are four specific problems with pass/fail heavy metals results for shilajit:
            </p>
            <p>
              <strong className="text-[#EEF0F8]">1. You cannot verify the limit used.</strong> Different standards
              set different heavy metal limits. USP &lt;232&gt; allows up to 10 µg/day of lead for
              oral supplements. California Proposition 65 sets the threshold at 0.5 µg/day —
              twenty times stricter. If a COA says &quot;PASS&quot; without stating which limit was
              applied, you cannot know whether the product meets the standard relevant to your
              situation. A lab can legitimately issue a &quot;PASS&quot; against a lenient internal
              threshold that would fail under Prop 65.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">2. You cannot see proximity to the limit.</strong> A product
              containing 0.09 mg/kg of lead and a product containing 0.9 mg/kg of lead might
              both receive a &quot;PASS&quot; under the same standard. But the second product leaves
              almost no safety margin — and at twice the stated serving size, it could exceed
              the limit. Numeric results let you evaluate this; pass/fail does not.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">3. Labs can set their own thresholds.</strong> Not all testing
              laboratories apply the same limits. Some use USP &lt;232&gt;. Some use the
              dietary supplement reference limits from the FDA. Some apply internal thresholds
              agreed with the client brand. Without the numeric result, there is no way to
              translate &quot;PASS&quot; into any specific safety standard.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">4. The &quot;summarised version&quot; disclaimer.</strong> Some brands
              publish what they describe as a &quot;summary&quot; COA — a one-page pass/fail document
              described as being derived from a longer full report. This framing implies a
              complete analysis was done, while providing the least useful output. A COA
              described as &quot;summarised&quot; without the underlying numeric data should be treated
              as equivalent to no COA for the purposes of heavy metals assessment.
            </p>

            <div className="rounded-lg bg-[#200505] border border-[#EF4444]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#EF4444] mb-1">⚠ Watch out for</p>
              <p className="text-xs text-[#EF4444]">
                Brands that use phrases like &quot;passed all heavy metals tests&quot; or &quot;heavy metals:
                PASS&quot; without publishing a COA showing actual ppm values and the reference
                limits applied. This language is not false — but it is uninformative, and it
                prevents you from making an independent safety assessment.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What ICP-MS Is and Why It Is the Gold Standard</h2>
            <p>
              ICP-MS stands for Inductively Coupled Plasma Mass Spectrometry. It is the
              analytical method used by accredited laboratories to measure trace metals in
              food, supplements, and biological samples at parts-per-billion (ppb) and
              parts-per-trillion (ppt) concentrations — far more sensitive than older
              techniques such as atomic absorption spectroscopy (AAS).
            </p>
            <p>
              In a typical ICP-MS analysis, the sample is dissolved in acid and introduced
              into a plasma torch at approximately 6,000–8,000°C. The resulting ions are
              separated by mass-to-charge ratio and detected individually. This allows
              simultaneous quantification of lead, arsenic, mercury, cadmium, and dozens
              of other elements in a single run, with detection limits in the sub-ppb range.
            </p>
            <p>
              For heavy metals in shilajit, the relevant standard method is EPA 6020B or the
              equivalent USP &lt;233&gt; procedure. A COA that specifies the analytical method
              (e.g., &quot;ICP-MS per EPA 6020B&quot;) is more credible than one that simply states
              &quot;heavy metals panel.&quot;
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Numeric Results Look Like: Reference Values</h2>
            <p>
              A credible numeric heavy metals panel for a purified shilajit resin might
              look like the following — based on results observed in COAs from accredited
              laboratories for well-tested products in our database:
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Metal</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Example result</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">USP &lt;232&gt; limit (daily)</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Lead (Pb)</td>
                    <td className="px-4 py-3 text-[#8892B8]">0.121 mg/kg</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 10 µg/day</td>
                    <td className="px-4 py-3 text-[#22C55E]">Well below limit at typical serving</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Arsenic (As)</td>
                    <td className="px-4 py-3 text-[#8892B8]">0.214 mg/kg</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 15 µg/day</td>
                    <td className="px-4 py-3 text-[#22C55E]">Well below limit at typical serving</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Mercury (Hg)</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 0.005 mg/kg</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 15 µg/day</td>
                    <td className="px-4 py-3 text-[#22C55E]">Below detection limit — excellent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Cadmium (Cd)</td>
                    <td className="px-4 py-3 text-[#8892B8]">0.038 mg/kg</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 5 µg/day</td>
                    <td className="px-4 py-3 text-[#22C55E]">Well below limit at typical serving</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#4A5070]">
              Note: To convert mg/kg results to µg per serving, multiply the concentration
              by your serving weight in grams. A 500 mg serving of 0.121 mg/kg lead product
              yields 0.5 g × 0.121 mg/kg = 0.0000605 mg = 0.0605 µg of lead — well below the
              10 µg/day USP limit and also below the 0.5 µg/day Prop 65 threshold.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How to Tell the Difference When Reading a COA</h2>
            <p>
              When evaluating a COA, look for these specific indicators of numeric results:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Results expressed as mg/kg, ppm, ppb, or µg/g (not just PASS/FAIL)</li>
              <li>A reference or specification column stating the limit applied (e.g., &lt;10 mg/kg per USP &lt;232&gt;)</li>
              <li>The analytical method named (ICP-MS, ICP-OES, EPA 6020B)</li>
              <li>A detection limit (LOD/LOQ) listed for each element</li>
              <li>Lab accreditation number (ISO 17025 accreditation, A2LA, UKAS, or ANAB certificate number)</li>
            </ul>
            <p>
              If the COA has none of these and only shows PASS or CONFORM, treat it as
              unverified — regardless of how reputable the brand appears.
            </p>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ What good looks like</p>
              <p className="text-xs text-[#22C55E]">
                A multi-page PDF COA from a named laboratory (e.g. Eurofins, Certified
                Laboratories, Anresco) showing lead, arsenic, mercury, and cadmium with
                numeric ppm values, the method reference (ICP-MS), detection limits,
                applicable specification limits, and the laboratory&apos;s ISO 17025
                accreditation number. Dated within the last 24 months. Downloadable
                directly from the brand&apos;s website without requiring a purchase.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The ShilajitDB Approach</h2>
            <p>
              In our database, products with public COAs containing numeric heavy metal results
              from named, accredited laboratories receive the highest testing transparency
              scores. Products with pass/fail-only documentation receive partial credit only.
              Products with no COA at all receive no credit for testing claims regardless of
              what the brand states on its packaging.
            </p>
            <p>
              When you use our database filters, the &quot;Heavy metals tested&quot; filter shows
              products that have at least claimed some form of testing. To identify products
              with the most credible numeric documentation, look for products with a named lab
              and a public COA — these are the ones most likely to have the full numeric
              results format described in this article.
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Find the best-tested shilajit products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Browse products with verified, named-lab COAs — the highest standard of
              third-party testing documentation in the database.
            </p>
            <Link
              href="/best/best-third-party-tested"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              View best-tested products →
            </Link>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. US Pharmacopeia. General Chapter &lt;232&gt; Elemental Impurities — Limits;
                General Chapter &lt;233&gt; Elemental Impurities — Procedures.{" "}
                <a href="https://www.usp.org/" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
              </li>
              <li>
                2. EPA Method 6020B: Inductively Coupled Plasma-Mass Spectrometry. US
                Environmental Protection Agency.{" "}
                <a href="https://www.epa.gov/esam/epa-method-6020b-validated-inductively-coupled-plasma-mass-spectrometry" target="_blank" rel="noopener noreferrer" className="underline">EPA.gov</a>
              </li>
              <li>
                3. California OEHHA. Proposition 65 Safe Harbor Levels.{" "}
                <a href="https://oehha.ca.gov/proposition-65/general-info/current-proposition-65-no-significant-risk-levels-nsrls-and-maximum" target="_blank" rel="noopener noreferrer" className="underline">oehha.ca.gov</a>
              </li>
              <li>
                4. ISO/IEC 17025:2017. General requirements for the competence of testing and
                calibration laboratories.{" "}
                <a href="https://www.iso.org/standard/66912.html" target="_blank" rel="noopener noreferrer" className="underline">ISO.org</a>
              </li>
              <li>
                5. Stohs SJ. Safety and efficacy of shilajit (mumie, moomiyo).{" "}
                <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/how-to-read-shilajit-coa" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Up next</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Read a Shilajit COA →</p>
          </Link>
          <Link href="/learn/shilajit-heavy-metals" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit and Heavy Metals: Safety & Testing →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
