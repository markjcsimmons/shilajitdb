import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations",
  description:
    "Standard doses, how to take resin vs. capsules, what to expect in week 1 vs. month 3, cycling considerations, and why product quality affects results.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-dosing-timeline") },
  openGraph: {
    title: "How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations",
    description:
      "A practical guide to shilajit dosing, onset timeline, and setting realistic expectations — based on clinical trial protocols.",
    url: absoluteUrl("/learn/shilajit-dosing-timeline"),
  },
};

export default function DosingTimelinePage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-stone-400">
        <Link href="/" className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-stone-600">Learn</Link>
        <span>/</span>
        <span>Dosing & Timeline</span>
      </nav>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 mb-4">
            Practical
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 leading-snug">
            How Long Does Shilajit Take to Work? Dosing, Timeline &amp; Expectations
          </h1>
          <p className="mt-3 text-sm text-stone-500">Last reviewed April 2026 · 7 min read</p>
        </header>

        <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="text-base">
            The most common questions from new shilajit users are about timing: how much should I
            take, how do I take it, and when will I notice a difference? The clinical trial literature
            gives us a reasonable starting point — though individual responses vary considerably,
            and the quality of the product you are using matters as much as the dose.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Disclaimer</p>
            <p className="text-xs text-amber-700">
              This page summarises information from published research for educational purposes only.
              It is not medical advice. Consult a qualified healthcare professional before starting
              any new supplement, particularly if you have an existing health condition or take medication.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What Dose Was Used in Research</h2>
          <p>
            Across the published clinical trials, doses have ranged from 200 mg to 500 mg per day,
            typically split into one or two doses. The most referenced protocols are:
          </p>

          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Study</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Dose</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Outcome measured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="px-4 py-3 text-stone-600">Pandit et al. 2016</td>
                  <td className="px-4 py-3 font-medium text-slate-800">250 mg × 2/day</td>
                  <td className="px-4 py-3 text-stone-600">90 days</td>
                  <td className="px-4 py-3 text-stone-600">Testosterone, DHEAS</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-stone-600">Surapaneni et al. 2012</td>
                  <td className="px-4 py-3 font-medium text-slate-800">200 mg × 2/day</td>
                  <td className="px-4 py-3 text-stone-600">12 weeks</td>
                  <td className="px-4 py-3 text-stone-600">Fatigue, mitochondrial markers</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-stone-600">Keller et al. 2019</td>
                  <td className="px-4 py-3 font-medium text-slate-800">500 mg/day</td>
                  <td className="px-4 py-3 text-stone-600">8 weeks</td>
                  <td className="px-4 py-3 text-stone-600">Muscle strength, recovery</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-stone-600">Biswas et al. 2010</td>
                  <td className="px-4 py-3 font-medium text-slate-800">100 mg × 2/day</td>
                  <td className="px-4 py-3 text-stone-600">90 days</td>
                  <td className="px-4 py-3 text-stone-600">Sperm count and motility</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            The most common practical starting dose is <strong>300–500 mg per day</strong> of
            purified shilajit. This is consistent with the doses showing effects in human trials
            and with Ayurvedic traditional guidance. Doses significantly above 500 mg/day have
            not been shown to produce greater benefit in clinical settings and are not recommended
            without medical guidance.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">How to Take Resin</h2>
          <p>
            Resin is the most potent and least processed form of shilajit. Taking it correctly
            makes a difference:
          </p>
          <ol className="list-decimal pl-5 space-y-3 mt-2">
            <li>
              <strong>Measure a pea-sized portion</strong> — approximately 300–400 mg. Most high-quality
              resins come with a small measuring spoon. If yours does not, a standard matchhead
              is roughly 300 mg.
            </li>
            <li>
              <strong>Dissolve in warm (not hot) liquid</strong> — water, herbal tea, or milk at
              around 40–50°C. Shilajit dissolves quickly in warm liquid but can take a minute
              to fully incorporate. Stir gently. Do not use boiling water, which may degrade
              heat-sensitive compounds.
            </li>
            <li>
              <strong>Take on an empty stomach</strong> — traditionally recommended in the morning,
              before breakfast. Some studies used fasted-state dosing. That said, if gastrointestinal
              sensitivity occurs, taking with a light meal is reasonable.
            </li>
            <li>
              <strong>Consistency matters more than timing</strong> — daily use over weeks is more
              important than the specific time of day.
            </li>
          </ol>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">How to Take Capsules</h2>
          <p>
            Capsules are simpler: take as directed on the label, with water, ideally in the morning.
            Check that the label states the amount of shilajit per capsule in milligrams. If it only
            states a proprietary blend weight, the effective shilajit dose is unknown.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What to Expect and When</h2>

          <div className="space-y-4 mt-2">
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Week 1–2: Adjustment phase</p>
              <p className="text-xs text-stone-600">
                Most users report no dramatic change in the first two weeks. Some notice mild
                effects on energy or sleep quality. A small number experience mild digestive
                adjustment — loose stools or nausea — which typically resolves. If GI symptoms
                persist, reduce the dose and re-titrate upward.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Week 3–6: Initial effects</p>
              <p className="text-xs text-stone-600">
                This is when most users first report subjective improvements in energy, mental
                clarity, or recovery from exercise. The mitochondrial support effects that are
                best documented in research typically begin to manifest in this window. Hormonal
                effects (testosterone) require longer.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Week 8–12: Documented outcome window</p>
              <p className="text-xs text-stone-600">
                The majority of clinical studies that measured significant effects used 8–12 week
                (60–90 day) protocols. Testosterone changes (Pandit et al.), sperm quality
                improvement (Biswas et al.), and fatigue reduction (Surapaneni et al.) were all
                assessed at this interval. This is the minimum duration to evaluate whether shilajit
                is producing a meaningful effect for you.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Beyond 3 months</p>
              <p className="text-xs text-stone-600">
                Long-term use data beyond 90 days is limited in formal trials. Traditional Ayurvedic
                usage involves continuous use with periodic breaks (cycling). A common practical
                approach is 8–12 weeks on, followed by a 2–4 week break. There is no clinical
                evidence of harm from continuous use at recommended doses, but this is an area
                with insufficient long-term safety data.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Why Product Quality Changes the Timeline</h2>
          <p>
            If you use a product with low fulvic acid content, poor purification, or significant
            fillers, you may not experience the effects described in research — because the product
            does not meet the same quality standard as the material studied. This is one of the
            most common reasons people report "shilajit didn't work for me."
          </p>
          <p>
            The clinical trials used authenticated, purified shilajit standardised to known
            concentrations. An unverified product sold without a COA is not the same product,
            regardless of what the label says.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Interactions and Contraindications</h2>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Iron supplements:</strong> Shilajit increases iron absorption. If you are
              taking iron supplements, discuss with your doctor — you may not need the same dose.
            </li>
            <li>
              <strong>Haemochromatosis (hereditary iron overload):</strong> Avoid shilajit — the
              enhanced iron absorption could worsen the condition.
            </li>
            <li>
              <strong>Diabetes medication:</strong> Some animal studies suggest shilajit may
              affect blood glucose regulation. If you are on diabetes medication, monitor blood
              sugar and consult your physician.
            </li>
            <li>
              <strong>Pregnancy and breastfeeding:</strong> No safety data available. Not recommended.
            </li>
            <li>
              <strong>Autoimmune conditions:</strong> Shilajit has immunomodulatory properties.
              If you have an autoimmune condition or take immunosuppressants, consult a physician.
            </li>
          </ul>
        </section>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-medium text-slate-900">Start with a verified product</p>
          <p className="mt-1 text-xs text-stone-600">
            The protocol only works with authentic, quality-verified shilajit. Use our database to
            find products with public COAs from named testing laboratories.
          </p>
          <Link
            href="/?coaStatus=PUBLIC&thirdPartyTested=true"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse verified products →
          </Link>
        </div>

        <footer className="border-t border-stone-100 pt-6">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-stone-500">
            <li>1. Pandit S, et al. "Clinical evaluation of purified Shilajit on testosterone levels." <em>Andrologia</em>. 2016;48(5):570–575. <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 26395129</a></li>
            <li>2. Surapaneni DK, et al. "Shilajit attenuates behavioral symptoms of chronic fatigue syndrome." <em>J Ethnopharmacol</em>. 2012;143(1):91–99. <a href="https://pubmed.ncbi.nlm.nih.gov/22771318/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 22771318</a></li>
            <li>3. Keller JL, et al. "The effects of shilajit supplementation on fatigue-induced decreases in muscular strength." <em>J Int Soc Sports Nutr</em>. 2019;16(1):3. <a href="https://pubmed.ncbi.nlm.nih.gov/30870558/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 30870558</a></li>
            <li>4. Biswas TK, et al. "Clinical evaluation of spermatogenic activity of processed Shilajit." <em>Andrologia</em>. 2010;42(1):48–56. <a href="https://pubmed.ncbi.nlm.nih.gov/25575901/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 25575901</a></li>
            <li>5. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)." <em>Phytother Res</em>. 2014;28(4):475–479. <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a></li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/shilajit-benefits" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Related</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">Shilajit Benefits: Full Evidence Review →</p>
        </Link>
        <Link href="/learn/shilajit-forms-compared" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Related</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">Resin vs. Capsules vs. Powder: Which Form? →</p>
        </Link>
      </div>
    </article>
  );
}
