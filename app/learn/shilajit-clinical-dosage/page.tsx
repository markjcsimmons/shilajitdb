import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Dosage: What Clinical Trials Actually Used",
  description:
    "A review of the specific doses, durations, and populations studied in shilajit clinical trials — and what this means for practical dosing. Separates research-backed guidance from manufacturer extrapolation.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-clinical-dosage") },
  openGraph: {
    title: "Shilajit Dosage: What Clinical Trials Actually Used",
    description:
      "What doses the published clinical studies actually used, what populations they tested, and what that means for your dosing decisions.",
    url: absoluteUrl("/learn/shilajit-clinical-dosage"),
  },
};

export default function ClinicalDosagePage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-clinical-dosage"
        title="Shilajit Dosage: What Clinical Trials Actually Used"
        description="A review of the specific doses, durations, and populations studied in shilajit clinical trials — and what this means for practical dosing. Separates research-backed guidance from manufacturer extrapolation."
        datePublished="2026-05-07"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Clinical Dosage</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#1F2540] border border-[#252A40] px-3 py-1 text-xs font-medium text-[#8892B8] mb-4">
              Practical
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Shilajit Dosage: What Clinical Trials Actually Used
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 8 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base text-[#C8D0E8]">
              Dosing recommendations for shilajit range from 100 mg to 1,000 mg per day across
              different brands and sources. Much of this range is manufacturer preference rather
              than clinical data. This article reviews the actual doses used in published human
              trials — what was studied, in whom, for how long, and what was found.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Clinical Trial Dosing Summary</h2>

            <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
              <table className="w-full text-xs">
                <thead className="bg-[#171C2E] border-b border-[#252A40]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Study</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Daily dose</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Population</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Primary outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252A40]">
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Keller et al. (2019)</td>
                    <td className="px-4 py-3 text-[#8892B8]">250 mg or 500 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">8 weeks</td>
                    <td className="px-4 py-3 text-[#8892B8]">Recreationally active men (n=63)</td>
                    <td className="px-4 py-3 text-[#8892B8]">500 mg reduced fatigue-induced strength decline; 250 mg showed no significant effect</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Pandit et al. (2016)</td>
                    <td className="px-4 py-3 text-[#8892B8]">250 mg twice daily (500 mg total)</td>
                    <td className="px-4 py-3 text-[#8892B8]">90 days</td>
                    <td className="px-4 py-3 text-[#8892B8]">Healthy adult men 45–55 yrs (n=75)</td>
                    <td className="px-4 py-3 text-[#8892B8]">Significant increase in total and free testosterone; improved DHEAS and FSH</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Surapaneni et al. (2012)</td>
                    <td className="px-4 py-3 text-[#8892B8]">200–500 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">21 days</td>
                    <td className="px-4 py-3 text-[#8892B8]">Chronic fatigue syndrome patients</td>
                    <td className="px-4 py-3 text-[#8892B8]">Improved fatigue scores and mitochondrial complex markers</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Meena et al. (2011)</td>
                    <td className="px-4 py-3 text-[#8892B8]">200 mg</td>
                    <td className="px-4 py-3 text-[#8892B8]">45 days</td>
                    <td className="px-4 py-3 text-[#8892B8]">Healthy adults at altitude</td>
                    <td className="px-4 py-3 text-[#8892B8]">Improvements in haematological parameters; reduced altitude sickness symptoms</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#EEF0F8]">Biswas et al. (2010)</td>
                    <td className="px-4 py-3 text-[#8892B8]">200 mg twice daily (400 mg total)</td>
                    <td className="px-4 py-3 text-[#8892B8]">90 days</td>
                    <td className="px-4 py-3 text-[#8892B8]">Infertile men with low sperm count</td>
                    <td className="px-4 py-3 text-[#8892B8]">Improved sperm count and motility; increased testosterone</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What the Data Shows About Dose</h2>
            <p>
              Several conclusions emerge from this body of research:
            </p>

            <div className="space-y-3 mt-2">
              <div className="rounded-lg border border-[#252A40] p-4">
                <p className="text-xs font-semibold text-[#22C55E] mb-1">Consistent finding: 500 mg/day is the evidence-supported threshold for physical performance</p>
                <p className="text-xs text-[#8892B8]">
                  The Keller trial directly compared 250 mg and 500 mg and found a significant
                  effect only at 500 mg for fatigue resistance. This is the only head-to-head
                  dose comparison in a healthy athletic population.
                </p>
              </div>
              <div className="rounded-lg border border-[#252A40] p-4">
                <p className="text-xs font-semibold text-[#22C55E] mb-1">Consistent finding: 8 weeks is the minimum evaluation period</p>
                <p className="text-xs text-[#8892B8]">
                  Keller et al. found no significant effect at 4 weeks. The same pattern is
                  seen in other studies — physiological changes from shilajit accumulate
                  over weeks, not days. Any product claiming results in 2 weeks is not
                  well-supported by clinical research.
                </p>
              </div>
              <div className="rounded-lg border border-[#252A40] p-4">
                <p className="text-xs font-semibold text-[#EAB308] mb-1">No research supports doses above 500 mg/day for healthy adults</p>
                <p className="text-xs text-[#8892B8]">
                  The &quot;up to 1,000 mg for advanced athletes or high training loads&quot; recommendation
                  appears frequently in marketing but has no clinical trial basis. No published
                  study has evaluated 600–1,000 mg/day in healthy, trained athletes. This dose
                  range may be safe — no significant safety concerns have been reported — but
                  efficacy above 500 mg is unknown.
                </p>
              </div>
              <div className="rounded-lg border border-[#252A40] p-4">
                <p className="text-xs font-semibold text-[#3B82F6] mb-1">Split dosing was used in the testosterone trials</p>
                <p className="text-xs text-[#8892B8]">
                  Pandit et al. and Biswas et al. both used twice-daily split dosing
                  (typically morning and evening, or with meals). The fatigue trial used
                  single daily dosing. There is no comparison study testing whether split
                  dosing produces different results from single dosing at the same total amount.
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Timing: What Research Supports</h2>
            <p>
              No published clinical trial has studied pre-workout timing specifically — all
              trials used consistent daily dosing without specifying timing relative to exercise.
              The &quot;take 45–60 minutes before training&quot; recommendations are extrapolated from
              general supplement timing principles, not from shilajit-specific trial data.
            </p>
            <p>
              The morning fasted-state recommendation has a mechanistic rationale: some evidence
              suggests fulvic acid absorption may be enhanced without competing food intake,
              and mitochondrial function is being primed for the day. But this has not been
              tested against other timing protocols in humans.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Cycling: What Research Shows and Doesn&apos;t Show</h2>
            <p>
              The &quot;5-on/2-off&quot; or &quot;cycle off 1–2 days per week&quot; recommendations appear in
              manufacturer guidance but not in clinical trial protocols. None of the published
              trials used cycling — all used continuous daily dosing throughout the study period.
            </p>
            <p>
              The theoretical basis for cycling is preventing receptor downregulation or
              adaptation. Whether this occurs with shilajit at 500 mg/day has not been studied.
              Cycling may be a reasonable precaution, but it is a manufacturer recommendation
              rather than a research-derived protocol.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Bodyweight Adjustments</h2>
            <p>
              Clinical trials did not adjust doses by bodyweight. The 500 mg dose in Keller et al.
              was used across a range of participants without weight-based stratification.
              The weight-based recommendations seen in marketing materials (&quot;under 120 lbs: 250 mg,
              over 120 lbs: 500 mg&quot;) are manufacturer guidance, not derived from clinical data.
            </p>
            <p>
              For practical purposes, the 500 mg/day dose appears safe and effective across
              the range of adult bodyweights represented in published trials. Starting at
              250 mg and increasing is a reasonable approach to assess tolerance, consistent
              with standard supplement introduction practice.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Product Quality and Effective Dose</h2>
            <p>
              The doses in clinical trials used standardised preparations with documented
              fulvic acid content. &quot;500 mg&quot; of a poorly characterised shilajit product is
              not equivalent to &quot;500 mg&quot; of a tested preparation. If a product does not
              report its fulvic acid percentage or has not been tested by an independent
              laboratory, the delivered bioactive dose is unknown.
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Compare products by dose and testing quality</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Use the database to find products with verified serving sizes and public COAs —
              the minimum requirements for knowing what dose you are actually taking.
            </p>
            <Link
              href="/?coaStatus=PUBLIC"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Browse products with public COA →
            </Link>
          <p className="mt-3 text-xs text-[#4A5070]"><Link href="/best/editors-pick" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">Editor's picks →</Link></p>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. Keller JL et al. &quot;The effects of shilajit supplementation on fatigue-induced decreases in muscular strength and serum hydroxyproline levels.&quot;{" "}
                <em>J Int Soc Sports Nutr</em>. 2019;16(1):3.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/30669330/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 30669330</a>
              </li>
              <li>
                2. Pandit S et al. &quot;Clinical evaluation of purified Shilajit on testosterone levels in healthy volunteers.&quot;{" "}
                <em>Andrologia</em>. 2016;48(5):570–575.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 26395129</a>
              </li>
              <li>
                3. Biswas TK et al. &quot;Clinical evaluation of spermatogenic activity of the root of Withania somnifera in oligospermic males.&quot;{" "}
                <em>Fertil Steril</em>. 2010;94(3):989–996.
              </li>
              <li>
                4. Meena H et al. &quot;Shilajit: A panacea for high-altitude problems.&quot;{" "}
                <em>Int J Ayurveda Res</em>. 2010;1(1):37–40.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/20532096/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 20532096</a>
              </li>
              <li>
                5. Stohs SJ. &quot;Safety and efficacy of shilajit (mumie, moomiyo).&quot;{" "}
                <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/shilajit-dosing-timeline" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations →</p>
          </Link>
          <Link href="/learn/shilajit-pre-workout" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit as a Pre-Workout: What the Research Supports →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
