import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Processing Methods: How Extraction Affects What's in the Jar",
  description:
    "How heat vs. low-temperature extraction, solvent vs. solvent-free processing, and purification depth affect the bioactive compounds in shilajit — and what a COA can and cannot verify about a brand's claims.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-extraction-methods") },
  openGraph: {
    title: "Shilajit Processing Methods: How Extraction Affects What's in the Jar",
    description:
      "What happens to shilajit's active compounds during different processing methods — and how to evaluate processing claims with and without lab data.",
    url: absoluteUrl("/learn/shilajit-extraction-methods"),
  },
};

export default function ExtractionMethodsPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-extraction-methods"
        title="Shilajit Processing Methods: How Extraction Affects What's in the Jar"
        description="How heat vs. low-temperature extraction, solvent vs. solvent-free processing, and purification depth affect the bioactive compounds in shilajit — and what a COA can and cannot verify about a brand's claims."
        datePublished="2026-05-07"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Extraction Methods</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#041828] border border-[#38BDF8]/30 px-3 py-1 text-xs font-medium text-[#38BDF8] mb-4">
              Sourcing
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Shilajit Processing Methods: How Extraction Affects What&apos;s in the Jar
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 8 min read</p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base text-[#C8D0E8]">
              How shilajit is processed after collection determines how much of its bioactive
              content survives to reach the final product. Temperature, solvents, filtration
              stages, and drying methods all leave measurable traces — or absences — in the
              finished resin, powder, or capsule. Understanding these differences helps you
              evaluate a brand&apos;s processing claims and know what a COA can realistically confirm.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Why Processing Matters for Bioactive Preservation</h2>
            <p>
              Raw shilajit as collected from rock formations is not safe to consume directly —
              it contains microbial contaminants, heavy metals, and organic debris that require
              removal. The challenge is that the same processing steps that eliminate contaminants
              can also degrade the compounds responsible for shilajit&apos;s reported effects.
            </p>
            <p>
              The primary compounds at risk are:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#C8D0E8]">Low-molecular-weight fulvic acid fractions</strong> — thermally
                sensitive; research on humic substances shows significant structural changes
                above approximately 300°C, with some fragmentation beginning at lower temperatures
                in aqueous solution.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Dibenzo-α-pyrones (DBPs) and their chromoproteins</strong> — the
                oxygenated heterocyclic compounds unique to shilajit; solvent exposure and
                excessive heat can alter their structure.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Trace mineral complexes</strong> — ionic mineral forms chelated to
                organic acids; harsh chemical processing can break these chelate bonds,
                potentially reducing bioavailability.
              </li>
            </ul>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Heat-Based vs. Low-Temperature Processing</h2>
            <p>
              The most significant processing variable is temperature. Traditional preparation of
              shilajit involved repeated dissolution in water and sun evaporation — a low-heat
              method by necessity. Modern commercial processing has moved toward industrial
              drying and concentration, which often involves higher temperatures.
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Method</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Typical temperature</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Tradeoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Spray drying</td>
                    <td className="px-4 py-3 text-[#8892B8]">150–200°C inlet, ~80°C outlet</td>
                    <td className="px-4 py-3 text-[#8892B8]">Fast and cheap; elevated outlet temperature risks degrading heat-sensitive fractions</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Vacuum evaporation</td>
                    <td className="px-4 py-3 text-[#8892B8]">40–60°C under reduced pressure</td>
                    <td className="px-4 py-3 text-[#8892B8]">Lower temperature; slower and more expensive; better compound preservation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Low-temperature / cold processing</td>
                    <td className="px-4 py-3 text-[#8892B8]">&lt;48°C throughout</td>
                    <td className="px-4 py-3 text-[#8892B8]">Maximises bioactive preservation; most expensive; requires controlled environment</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Sun evaporation (traditional)</td>
                    <td className="px-4 py-3 text-[#8892B8]">Ambient to ~55°C</td>
                    <td className="px-4 py-3 text-[#8892B8]">Weather-dependent; inconsistent batch quality; UV exposure can cause photo-oxidation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              The research most often cited in this context relates to thermal degradation of
              humic substances generally, not shilajit specifically — most shilajit-focused
              studies use already-processed material and do not isolate the processing variable.
              This means that &quot;low-temperature extraction preserves bioactives&quot; is a
              scientifically reasonable claim, but the specific thresholds and degradation
              rates for shilajit&apos;s active fractions have not been comprehensively studied under
              controlled commercial conditions.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Solvent vs. Solvent-Free Processing</h2>
            <p>
              Some industrial processing uses organic solvents (ethanol, methanol, or others)
              to aid extraction or purification. Solvent-based methods can increase yield and
              selectively isolate certain fractions, but introduce additional steps to remove
              solvent residue from the final product.
            </p>
            <p>
              Regulatory standards for solvent residues in dietary supplements are set by the
              FDA under 21 CFR Part 111. However, a standard shilajit COA does not typically
              test for solvent residues unless a brand specifically requests this panel.
              If a brand claims solvent-free processing, this claim is generally unverifiable
              from the COA alone unless residual solvent testing is included.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Purification: Heavy Metal Removal</h2>
            <p>
              Because shilajit naturally accumulates heavy metals from its geological substrate,
              purification is not optional — it is a safety requirement. Commercial purification
              methods include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#C8D0E8]">Physical filtration</strong> — progressively finer filters (down to
                sub-micron levels in some protocols) to remove particulate matter and some
                microbial content.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Selective chelation</strong> — chemical agents that bind specific
                heavy metals for removal. The challenge is selectivity: some chelating agents
                may also bind beneficial trace minerals.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Ion exchange</strong> — resin-based separation that can selectively
                remove ionic forms of certain metals.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">UV / ozone treatment</strong> — used for microbial decontamination;
                UV can also cause photo-degradation of some organic compounds at high doses.
              </li>
            </ul>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What a COA Can and Cannot Tell You About Processing</h2>
            <p>
              A Certificate of Analysis measures outcomes, not methods. It tells you what is in
              the finished product — not how it got there. This creates a fundamental limitation
              when evaluating processing claims:
            </p>

            <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Claim</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Can a COA verify it?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Heavy metals below safety limits</td>
                    <td className="px-4 py-3 text-[#22C55E]">✓ Yes — directly measured</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Fulvic acid content</td>
                    <td className="px-4 py-3 text-[#22C55E]">✓ Yes — if the COA includes compositional analysis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">No microbial contamination</td>
                    <td className="px-4 py-3 text-[#22C55E]">✓ Yes — if microbial panel is included</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Low-temperature processing was used</td>
                    <td className="px-4 py-3 text-[#EF4444]">✗ No — method is not measurable from output alone</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Solvent-free processing</td>
                    <td className="px-4 py-3 text-[#EF4444]">✗ No — unless residual solvent panel is included</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">No PAH (polycyclic aromatic hydrocarbons)</td>
                    <td className="px-4 py-3 text-[#EEF0F8]">⚠ Only if PAH panel is specifically included</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              This does not mean processing claims are meaningless — brands with patented
              processing methods, GMP manufacturing in regulated facilities, and transparent
              documentation have more accountability than those without. But the COA remains
              the primary verifiable document, and what it measures is the product outcome,
              not the process.
            </p>

            <div className="rounded-lg bg-[#052010] border border-[#22C55E]/30 p-4 mt-4">
              <p className="text-xs font-semibold text-[#22C55E] mb-1">✓ The practical standard</p>
              <p className="text-xs text-[#22C55E]">
                A public COA showing heavy metals below USP limits, a numeric fulvic acid
                percentage on the finished product, and a clean microbial panel from a named
                independent laboratory. Processing method claims go beyond what any COA can
                confirm — weight them accordingly.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Evaluating Processing Claims Without a Full Process Audit</h2>
            <p>
              For most buyers, a full manufacturing audit is not possible. The proxies available are:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#C8D0E8]">Published patents</strong> — a granted patent for a specific processing
                method establishes that the claimed method has been documented under legal obligation.
                Not proof it is used consistently at commercial scale, but a stronger claim than
                marketing copy alone.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">GMP certification</strong> — NSF, USP, or FDA-registered facilities operate
                under documented manufacturing controls that include temperature and process
                monitoring. GMP does not validate the specific process, but it establishes
                an auditable system.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">Batch-specific COAs</strong> — products with per-batch COAs rather than
                generic &quot;we are tested&quot; statements demonstrate consistent testing of actual
                production runs.
              </li>
              <li>
                <strong className="text-[#C8D0E8]">US or EU manufacturing</strong> — domestic manufacturing in regulated
                jurisdictions is subject to FDA inspection; offshore manufacturing without
                equivalent regulatory oversight carries higher process uncertainty.
              </li>
            </ul>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Filter for GMP-certified, US-manufactured products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Use the database to find products made in the United States under GMP-certified
              manufacturing — the most verifiable proxy for process quality.
            </p>
            <Link
              href="/?qualityTier=ULTRA_PREMIUM"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Browse top-rated products →
            </Link>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. Stevenson FJ. <em>Humus Chemistry: Genesis, Composition, Reactions</em>. 2nd ed. Wiley, 1994.
              </li>
              <li>
                2. Sirohi S et al. &quot;Thermal stability of humic acids studied by differential scanning calorimetry.&quot;{" "}
                <em>J Thermal Anal Calorim</em>. 2013;111(1):521–527.
              </li>
              <li>
                3. Stohs SJ. &quot;Safety and efficacy of shilajit (mumie, moomiyo).&quot;{" "}
                <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
              </li>
              <li>
                4. FDA. Current Good Manufacturing Practice in Manufacturing, Packaging, Labeling, or Holding Operations for Dietary Supplements. 21 CFR Part 111.{" "}
                <a href="https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-111" target="_blank" rel="noopener noreferrer" className="underline">eCFR.gov</a>
              </li>
              <li>
                5. Agarwal SP et al. &quot;Shilajit: A review.&quot;{" "}
                <em>Phytotherapy Research</em>. 2007;21(5):401–405.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 17295385</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/shilajit-sourcing-regions" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Where Shilajit Comes From: Mountain Regions Compared →</p>
          </Link>
          <Link href="/learn/shilajit-buyers-checklist" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Up next</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">The Shilajit Buyer&apos;s Checklist: 9 Things to Verify Before You Buy →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
