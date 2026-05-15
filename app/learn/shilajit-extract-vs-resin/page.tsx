import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Extract vs Raw Resin: Are You Getting What You Think?",
  description:
    "The difference between shilajit resin and standardised extract, why fulvic acid percentages on extracts are misleading, and what to look for in a capsule COA.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-extract-vs-resin") },
  openGraph: {
    title: "Shilajit Extract vs Raw Resin: Are You Getting What You Think?",
    description:
      "How brands use extract percentages deceptively on shilajit labels — and the dilution math that reveals what you are actually paying for.",
    url: absoluteUrl("/learn/shilajit-extract-vs-resin"),
  },
};

export default function ShilajitExtractVsResinPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-extract-vs-resin"
        title="Shilajit Extract vs Raw Resin: Are You Getting What You Think?"
        description="The difference between shilajit resin and standardised extract, why fulvic acid percentages on extracts are misleading, and what to look for in a capsule COA."
        datePublished="2026-05-14"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Extract vs Resin</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#0A1628] border border-[#3D7AFF]/30 px-3 py-1 text-xs font-medium text-[#6E9FFF] mb-4">
              Buying guide
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Shilajit Extract vs Raw Resin: Are You Getting What You Think?
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 9 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base">
              The shilajit market is split between two fundamentally different product types:
              purified resin and standardised extract. They are sold in the same supplement
              category, often at similar prices, and the labels rarely make the distinction
              clear. Understanding the difference matters because it affects what you are
              actually consuming, how to interpret fulvic acid percentage claims, and how
              to read a COA for capsule products.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Raw Shilajit and the Purification Process</h2>
            <p>
              Raw shilajit is the semi-solid black resin collected from rock faces in high-altitude
              mountain ranges. In its unprocessed form, it contains the full spectrum of fulvic
              acids, humic acids, dibenzo-alpha-pyrones, minerals, and other bioactive compounds
              — but also microorganisms, sediment, and potentially elevated levels of heavy metals
              from the surrounding geology.
            </p>
            <p>
              Purification removes the contaminants while preserving the active matrix. The
              traditional Ayurvedic process (called <em>shodhana</em>) involves dissolving raw
              resin in water, filtering through cloth, and evaporating at low heat repeatedly.
              Modern commercial purification adds filtration membranes, UV treatment, and
              controlled evaporation. The result is a purified, concentrated resin — typically
              jet-black, sticky, soluble in warm water — that preserves the original molecular
              composition of shilajit in its most intact form.
            </p>
            <p>
              This purified resin is what reputable brands sell in jars. A COA for a purified
              resin reports the fulvic acid content of the finished product as-sold.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Shilajit Extract Is and How It Is Made</h2>
            <p>
              Standardised extract is a different category. Starting from raw or partially
              processed shilajit, manufacturers use solvent extraction (aqueous, ethanolic, or
              hydroethanolic) to selectively concentrate specific compounds — typically fulvic
              acids. The concentrated extract is then spray-dried or freeze-dried into a powder
              that can be encapsulated or compressed into tablets.
            </p>
            <p>
              The resulting extract powder is described as &quot;standardised to X% fulvic acid.&quot;
              Common claims range from 10% to 85% fulvic acid by weight. This means the extract
              powder — before it is put into a capsule — has been processed to contain that
              percentage of fulvic acid.
            </p>
            <p>
              The problem begins when this percentage is communicated to consumers on product
              labels.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Dilution Math: Why Extract Percentages Are Misleading</h2>
            <p>
              Consider a brand selling capsules described as &quot;Shilajit 50% Fulvic Acid.&quot; The
              claim sounds impressive — 50% fulvic acid is much higher than the typical 15–20%
              found in authentic purified resin. But the 50% figure refers to the extract
              powder, not the finished capsule.
            </p>
            <p>
              If each capsule weighs 500 mg total, and the brand uses 200 mg of extract
              powder per capsule (with the remaining 300 mg being excipients, fillers, or
              other ingredients), then:
            </p>
            <div className="rounded-xl border border-[#252A40] overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Component</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Total capsule weight</td>
                    <td className="px-4 py-3 text-[#8892B8]">500 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">What the label states</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Extract powder per capsule</td>
                    <td className="px-4 py-3 text-[#8892B8]">200 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">Often unlisted — buried in supplement facts</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Extract standardisation</td>
                    <td className="px-4 py-3 text-[#8892B8]">50% fulvic acid</td>
                    <td className="px-4 py-3 text-[#8892B8]">The highlighted marketing claim</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Actual fulvic acid per capsule</td>
                    <td className="px-4 py-3 text-[#8892B8]">100 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">200 mg × 50% = 100 mg</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Effective fulvic acid %</td>
                    <td className="px-4 py-3 text-[#8892B8]">20%</td>
                    <td className="px-4 py-3 text-[#8892B8]">100 mg ÷ 500 mg = 20% of finished capsule</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The marketed &quot;50% fulvic acid&quot; becomes approximately 20% of the finished
              product — which is in the same range as many purified resins. The high percentage
              claim was technically accurate for the raw extract ingredient but not for the
              product the consumer is actually buying.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The &quot;Same as Resin&quot; Marketing Claim</h2>
            <p>
              Some extract-based brands claim that their product is &quot;equivalent to&quot; or
              &quot;as effective as&quot; purified resin. This claim is rarely supported by clinical
              evidence comparing the specific products. Extract processes are selective by
              design — they concentrate certain fractions (typically fulvic acids) while
              removing others (humic acids, dibenzo-alpha-pyrones, minor minerals). Whether
              this selective concentration preserves, improves, or diminishes bioactivity
              relative to whole resin is an open question that has not been resolved in the
              peer-reviewed literature.
            </p>
            <p>
              The most-cited shilajit clinical trials — including the Pandit et al. 2016
              testosterone study and the Bhattacharyya et al. 2009 exercise study — used
              standardised shilajit preparations, but the specific processing method and
              fulvic acid content vary between studies. None of these trials compared extract
              head-to-head against whole resin under controlled conditions.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Why Resin COAs Are More Trustworthy for Fulvic Acid</h2>
            <p>
              When a resin product publishes a COA that includes fulvic acid content, that
              measurement reflects what is in the jar the consumer buys. There is no
              intervening dilution step — the COA result and the product composition are
              directly comparable.
            </p>
            <p>
              When an extract product publishes a COA for fulvic acid, there are two possible
              scenarios: the COA covers the raw extract ingredient (useful for the manufacturer,
              not directly for the consumer), or the COA covers the finished capsule after
              dilution (the only figure that matters for the consumer). Always check whether a
              capsule COA specifies it was conducted on the <em>finished product</em> — the
              filled and sealed capsule — rather than on the bulk extract ingredient.
            </p>

            <div className="rounded-lg bg-[#200505] border border-[#EF4444]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#EF4444] mb-1">⚠ Watch out for</p>
              <p className="text-xs text-[#EF4444]">
                COAs for extract-based shilajit capsules that do not state whether testing
                was conducted on the finished capsule or the bulk ingredient. A COA for a
                &quot;50% fulvic acid shilajit extract&quot; may have been conducted on the raw powder
                before encapsulation — in which case it tells you nothing about the fulvic acid
                content of the finished capsule.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What to Look for in a Capsule COA</h2>
            <p>
              If you are buying shilajit capsules, the following elements make a COA credible
              and informative:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#EEF0F8]">Sample description:</strong> Should state &quot;finished
                capsule,&quot; &quot;filled capsule,&quot; or the product name as sold — not just
                &quot;shilajit extract&quot; or &quot;shilajit powder.&quot;
              </li>
              <li>
                <strong className="text-[#EEF0F8]">Shilajit content per capsule:</strong> The supplement
                facts panel should state the mg of shilajit (or shilajit extract) per
                serving, not just a total capsule weight.
              </li>
              <li>
                <strong className="text-[#EEF0F8]">Fulvic acid measurement method:</strong> Titration-based
                fulvic acid measurements (the most common) can differ significantly from
                HPLC-based measurements. A credible COA states the method.
              </li>
              <li>
                <strong className="text-[#EEF0F8]">Heavy metals on finished product:</strong> Not just on the
                raw extract — the finished capsule should be tested because excipients and
                processing aids can introduce or concentrate contaminants.
              </li>
            </ul>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ What good looks like</p>
              <p className="text-xs text-[#22C55E]">
                A capsule product where the supplement facts panel clearly states &quot;Shilajit
                resin extract (standardised to X% fulvic acid) — 500 mg per serving,&quot; and
                the COA is for the finished, filled capsule, tested by a named ISO 17025-
                accredited laboratory, showing both heavy metal results and fulvic acid content
                with the measurement method specified. Ideally with a lot number and expiry date
                linking the COA to a specific production batch.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Bottom Line</h2>
            <p>
              Neither form is inherently fraudulent. Many well-tested, safe shilajit products
              use extract in capsule form, and extract production can produce a consistent,
              shelf-stable product. The issue is not extract versus resin as a matter of
              principle — it is transparency about what the consumer is actually getting.
            </p>
            <p>
              In the ShilajitDB scoring system, resin products receive the highest form score
              (+4 points) because the resin form preserves the broadest molecular profile and
              requires the least processing. But capsule products can still achieve high grades
              when their documentation is thorough and their COAs cover the finished product
              with numeric results from named, accredited laboratories.
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Browse the best-documented capsule products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Filter the database for capsule-form shilajit with public COAs from named
              laboratories — the highest transparency standard for encapsulated products.
            </p>
            <Link
              href="/best/best-capsules"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              View best capsule products →
            </Link>
          <p className="mt-3 text-xs text-[#4A5070]"><Link href="/best/best-resin" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">Best shilajit resin →</Link></p>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. Pandit S, et al. Clinical evaluation of purified shilajit on testosterone
                levels in healthy volunteers. <em>Andrologia</em>. 2016;48(5):570–575.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 26395129</a>
              </li>
              <li>
                2. Carrasco-Gallardo C, et al. Shilajit: a natural phytocomplex with potential
                procognitive activity. <em>Int J Alzheimers Dis</em>. 2012;2012:674142.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/22482077/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 22482077</a>
              </li>
              <li>
                3. Stohs SJ. Safety and efficacy of shilajit (mumie, moomiyo).{" "}
                <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
              </li>
              <li>
                4. ISO 19822:2018. Shilajit/Mumijo raw material — Requirements.{" "}
                <a href="https://www.iso.org/standard/66271.html" target="_blank" rel="noopener noreferrer" className="underline">ISO.org</a>
              </li>
              <li>
                5. Bhattacharyya S, et al. Beneficial effect of processed shilajit on swimming
                exercise induced impaired energy status of mice.{" "}
                <em>Pharmacologyonline</em>. 2009;2:817–825.
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/shilajit-forms-compared" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Up next</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit Forms Compared: Resin, Capsule, Powder →</p>
          </Link>
          <Link href="/learn/fulvic-acid-percentage-explained" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Fulvic Acid Percentage Explained →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
