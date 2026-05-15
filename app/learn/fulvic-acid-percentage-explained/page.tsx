import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results",
  description:
    "What the fulvic acid percentage on a shilajit COA actually measures, what ranges are credible, and how to tell whether a brand's claim reflects the finished product or just the raw extract.",
  alternates: { canonical: absoluteUrl("/learn/fulvic-acid-percentage-explained") },
  openGraph: {
    title: "Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results",
    description:
      "How to interpret the fulvic acid number on a shilajit Certificate of Analysis — and why some percentages are misleading.",
    url: absoluteUrl("/learn/fulvic-acid-percentage-explained"),
  },
};

export default function FulvicAcidPercentagePage() {
  return (
    <>
      <ArticleSchema
        slug="fulvic-acid-percentage-explained"
        title="Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results"
        description="What the fulvic acid percentage on a shilajit COA actually measures, what ranges are credible, and how to tell whether a brand's claim reflects the finished product or just the raw extract."
        datePublished="2026-05-07"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Fulvic Acid Percentage</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#051428] border border-[#3B82F6]/30 px-3 py-1 text-xs font-medium text-[#3B82F6] mb-4">
              Science
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 7 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base text-[#C8D0E8]">
              Many shilajit brands advertise a fulvic acid percentage as a quality signal. The number
              appears on marketing pages, product labels, and sometimes on a Certificate of Analysis.
              What it actually tells you — and whether it is comparable across products — depends
              entirely on how and what was measured.
            </p>
            <p>
              This guide explains what the fulvic acid percentage means technically, how laboratories
              measure it, what ranges are credible for different product forms, and the single most
              important question to ask when evaluating any fulvic acid claim.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Fulvic Acid Percentage Measures</h2>
            <p>
              Fulvic acid is not a single compound — it is a heterogeneous fraction of humic
              substances defined by its solubility at all pH values. When a laboratory measures
              fulvic acid content, it is measuring the total mass of this fraction as a proportion
              of the sample weight.
            </p>
            <p>
              The measurement is expressed as a percentage of dry weight or of the finished product
              weight, depending on the protocol. A resin product that reports &quot;60% fulvic acid&quot;
              and a capsule product that reports &quot;20% fulvic acid&quot; are not straightforwardly
              comparable — the numbers reflect different things about different products.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Laboratories Measure It</h2>
            <p>
              There is no single standardised method for measuring fulvic acid in shilajit, which
              is one reason published percentages vary widely. The most common approaches are:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#C8D0E8]">Alkaline extraction followed by acidification</strong> — the sample is dissolved in
                alkali, then acidified. Humic acid precipitates; what remains soluble is counted
                as the fulvic fraction. This is a separation-based method, not a precise
                molecular assay.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Colorimetric methods</strong> — light absorbance is measured at a wavelength
                that correlates with humic substance concentration. Faster and cheaper than
                separation, but more variable between labs.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">HPLC or LC-MS</strong> — used by more sophisticated laboratories to identify
                specific molecular species within the fulvic fraction. More precise but less
                common in routine supplement testing.
              </li>
            </ul>
            <p>
              Because methods differ, a percentage reported by one laboratory is not directly
              comparable to a percentage from a different laboratory using a different protocol.
              This is rarely disclosed on product marketing.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Most Important Question: Raw Extract or Finished Product?</h2>
            <p>
              This is the distinction that matters most in practice. A fulvic acid percentage can
              be measured at two very different points in the manufacturing process:
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">What was tested</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">What the number means</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Relevance to you</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Raw or concentrated extract</td>
                    <td className="px-4 py-3 text-[#8892B8]">Fulvic acid % of the intermediate ingredient before formulation</td>
                    <td className="px-4 py-3 text-[#8892B8]">Not useful — does not reflect what is in the product you consume</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Finished product (resin, capsule, powder)</td>
                    <td className="px-4 py-3 text-[#8892B8]">Fulvic acid % of the product as sold, per gram</td>
                    <td className="px-4 py-3 text-[#8892B8]">Directly relevant — this is the dose you receive per serving</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              A brand can legitimately claim &quot;50% fulvic acid extract&quot; while providing you with
              a capsule that delivers only 5–8% fulvic acid by weight once the extract has been
              blended with excipients, fillers, or other ingredients. The extract number is not
              wrong — it just does not describe what you are actually consuming.
            </p>

            <div className="rounded-lg bg-[#200505] border border-[#EF4444]/30 p-4 mt-2">
              <p className="text-xs font-semibold text-[#EF4444] mb-1">Red flag</p>
              <p className="text-xs text-[#EF4444]">
                A COA that shows fulvic acid percentage for an &quot;extract&quot; or &quot;raw material&quot; rather
                than for the finished product batch. The COA should reference the same SKU you are
                purchasing, with a batch number that matches the lot on the label.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Percentages Are Credible by Form</h2>
            <p>
              Because shilajit resin is the least diluted form and capsules or powders introduce
              additional ingredients, the expected fulvic acid percentage varies by form factor.
              The ranges below are based on published analytical data for commercial shilajit products
              and are intended as rough orientation, not absolute standards.
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Form</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Plausible finished-product range</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Resin</td>
                    <td className="px-4 py-3 text-[#8892B8]">15–60%</td>
                    <td className="px-4 py-3 text-[#8892B8]">Wide range reflects genuine variation between source regions and purification methods</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Powder / standardised extract</td>
                    <td className="px-4 py-3 text-[#8892B8]">20–50%</td>
                    <td className="px-4 py-3 text-[#8892B8]">Concentrated form; percentage on the extract, not the capsule fill weight</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Capsule (finished product)</td>
                    <td className="px-4 py-3 text-[#8892B8]">5–20%</td>
                    <td className="px-4 py-3 text-[#8892B8]">Diluted by excipients; relevant number is mg per capsule, not %</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Gummy</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt; 5%</td>
                    <td className="px-4 py-3 text-[#8892B8]">Heavily diluted; most meaningful metric is mg of shilajit extract per serving</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              A resin claiming 80%+ fulvic acid warrants scepticism — authenticated shilajit
              contains other humic fractions, minerals, and organic compounds, and extremely high
              percentages may indicate adulteration or a non-standard measurement method. Similarly,
              a capsule product advertising a high fulvic acid percentage is likely describing
              the extract, not the capsule.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How to Find the Fulvic Acid Number on a COA</h2>
            <p>
              On a well-constructed shilajit COA, fulvic acid appears under a section variously
              labelled &quot;Composition,&quot; &quot;Active Constituents,&quot; or &quot;Phytochemical Analysis.&quot;
              Look for the following:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>The analyte is labelled &quot;Fulvic Acid,&quot; &quot;Fulvic Acid Fraction,&quot; or &quot;Total Fulvic Acids&quot;</li>
              <li>A numeric result is given (e.g., 42.3%) rather than just &quot;present&quot; or &quot;pass&quot;</li>
              <li>The result references the finished product or the specific batch being certified</li>
              <li>The method used is disclosed (e.g., &quot;alkaline extraction / spectrophotometric&quot;)</li>
            </ul>
            <p>
              If the COA only shows heavy metals and microbial results but no compositional analysis,
              the brand has not published fulvic acid data — regardless of what the marketing page
              claims.
            </p>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ What good looks like</p>
              <p className="text-xs text-[#22C55E]">
                A COA from a named, accredited laboratory that shows a numeric fulvic acid
                percentage alongside the batch number of the finished product, a disclosure of
                the analytical method used, and a corresponding heavy metals panel — all in
                the same document, dated within the past 12–24 months.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Why Fulvic Acid Percentage Is Not the Only Bioactivity Signal</h2>
            <p>
              It is tempting to treat fulvic acid percentage as a simple quality score — higher
              is better. The relationship is more complicated. The bioactivity of fulvic acid
              depends on the molecular weight distribution of the fraction, not just its
              total concentration. Low-molecular-weight fulvic fractions are believed to
              cross cell membranes more readily; high-molecular-weight fractions may have
              different properties.
            </p>
            <p>
              Standard commercial testing does not typically resolve these sub-fractions. Two products
              with identical fulvic acid percentages may differ meaningfully in their actual
              biological activity depending on the molecular composition of their fulvic fractions.
              This is an area where the research literature is still developing, and consumer-facing
              COAs rarely go to this level of detail.
            </p>
            <p>
              For practical purchasing decisions, a public COA with a numeric finished-product
              fulvic acid percentage remains the best available proxy — with the caveats above
              in mind.
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Browse products with published fulvic acid data</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Filter the database by COA status to find products with publicly available
              Certificates of Analysis where fulvic acid content can be independently verified.
            </p>
            <Link
              href="/?coaStatus=PUBLIC"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Browse products with public COA →
            </Link>
          <p className="mt-3 text-xs text-[#4A5070]"><Link href="/best/best-tested" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">Best tested shilajit →</Link></p>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. Schepetkin IA et al. &quot;Biomedical potential of humic substances.&quot;{" "}
                <em>Mini Rev Med Chem</em>. 2003;3(3):189–208.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/12570840/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 12570840</a>
              </li>
              <li>
                2. Agarwal SP et al. &quot;Shilajit: A review.&quot;{" "}
                <em>Phytotherapy Research</em>. 2007;21(5):401–405.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 17295385</a>
              </li>
              <li>
                3. Winkler J, Ghosh S. &quot;Therapeutic potential of fulvic acid in chronic inflammatory diseases and diabetes.&quot;{" "}
                <em>J Diabetes Res</em>. 2018;2018:5391014.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/30319016/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 30319016</a>
              </li>
              <li>
                4. Jouquet P et al. &quot;Characterisation of humic acids and fulvic acids extracted from compost.&quot;{" "}
                <em>Bioresour Technol</em>. 2008;99(13):5766–5774.
              </li>
              <li>
                5. US Pharmacopeia. Dietary Supplements — Identity and Purity standards. USP &lt;565&gt;.{" "}
                <a href="https://www.usp.org/" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/fulvic-acid-shilajit" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">What Is Fulvic Acid? The Primary Bioactive in Shilajit →</p>
          </Link>
          <Link href="/learn/how-to-read-shilajit-coa" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Read a Shilajit COA →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
