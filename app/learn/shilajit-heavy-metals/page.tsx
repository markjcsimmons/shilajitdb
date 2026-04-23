import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shilajit and Heavy Metals: Safety, Testing & Acceptable Levels",
  description:
    "Which heavy metals appear in shilajit, what safe limits look like, how to read a heavy metals panel on a COA, and why some products fail testing.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-heavy-metals") },
  openGraph: {
    title: "Shilajit and Heavy Metals: Safety, Testing & Acceptable Levels",
    description:
      "The most important safety question when buying shilajit — and how to get a clear answer before you buy.",
    url: absoluteUrl("/learn/shilajit-heavy-metals"),
  },
};

export default function HeavyMetalsPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-stone-400">
        <Link href="/" className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-stone-600">Learn</Link>
        <span>/</span>
        <span>Heavy Metals</span>
      </nav>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 mb-4">
            Safety
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 leading-snug">
            Shilajit and Heavy Metals: Safety, Testing &amp; Acceptable Levels
          </h1>
          <p className="mt-3 text-sm text-stone-500">Last reviewed April 2026 · 8 min read</p>
        </header>

        <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="text-base">
            Heavy metal contamination is the most important safety concern in the shilajit market.
            Because shilajit is a geological exudate that forms over millennia in direct contact with
            rock and soil, it naturally accumulates whatever metals are present in its surrounding
            substrate. Without proper purification and independent testing, consuming shilajit
            can expose you to meaningful levels of lead, arsenic, mercury, and cadmium.
          </p>
          <p>
            This is not a fringe risk. The FDA has issued warnings about specific shilajit products
            found to contain elevated heavy metal levels, and independent testing by consumer
            organisations has found non-trivial lead concentrations in products sold on major
            retail platforms. The solution is straightforward: buy from brands that publish
            a third-party COA with a complete heavy metals panel.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Why Shilajit Contains Heavy Metals</h2>
          <p>
            Shilajit forms over millions of years as organic matter is compressed between rock strata.
            The geological substrate — the specific types of rock, soil composition, and mineral
            deposits in the surrounding environment — directly determines the mineral profile
            of the resulting resin. In high-altitude regions with certain geological profiles,
            this includes toxic heavy metals alongside the beneficial minerals.
          </p>
          <p>
            The Himalayas, Altai range, and other shilajit-producing regions all have varying
            baseline levels of lead, arsenic, and mercury in their geology. This is normal and
            expected. What matters is whether the purification process has reduced these to
            safe levels — and whether that reduction has been verified by laboratory analysis.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">The Four Heavy Metals to Test For</h2>

          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Metal</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">USP limit (per day)</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">CA Prop 65 limit</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Health concern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Lead (Pb)</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 10 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 0.5 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">Neurotoxic; no safe level for children; accumulates in bone</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Arsenic (As)</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 15 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 10 µg/day (inorganic)</td>
                  <td className="px-4 py-3 text-stone-600">Carcinogenic (inorganic form); affects skin, lungs, bladder</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Mercury (Hg)</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 15 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 0.3 µg/day (methylmercury)</td>
                  <td className="px-4 py-3 text-stone-600">Nephrotoxic and neurotoxic; methylmercury crosses blood-brain barrier</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Cadmium (Cd)</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 5 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">&lt; 4.1 µg/day</td>
                  <td className="px-4 py-3 text-stone-600">Accumulates in kidneys; biological half-life of 10–30 years</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500">
            California Prop 65 applies the strictest limits in the US. Products sold in California
            must comply; products sold only online in other states may not. USP &lt;232&gt; is the
            general pharmaceutical standard. Limits are for oral supplements at recommended daily doses.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Purification: The Difference Between Safe and Unsafe</h2>
          <p>
            Traditional Ayurvedic purification of shilajit — called <em>shodhana</em> — involves
            dissolving raw resin in water, filtering it through cloth, and evaporating it over low
            heat repeatedly. Modern commercial purification extends this with filtration, chelation
            processes, and UV treatment. When done properly, these methods can reduce heavy metal
            concentrations to well below regulatory limits.
          </p>
          <p>
            The problem is that "purified" on a label is an unverifiable claim without a COA.
            Some products labelled as purified have failed independent heavy metal testing. The only
            way to know whether purification has worked is to see the lab results for the final product.
          </p>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mt-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">✓ What good looks like</p>
            <p className="text-xs text-emerald-700">
              A COA from a named, ISO-accredited laboratory showing lead, arsenic, mercury, and
              cadmium all below USP &lt;232&gt; limits — tested on the final product batch, dated
              within the past 12–24 months, and publicly available without needing to contact the brand.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">FDA Warnings and Real-World Failures</h2>
          <p>
            The FDA has issued multiple warnings about heavy metal contamination in dietary supplements.
            While these have not been exclusively about shilajit, the supplement category as a whole
            is less regulated than pharmaceuticals, and enforcement typically happens after harm
            rather than before sale.
          </p>
          <p>
            Consumer Lab and similar independent testing organisations have found that a meaningful
            proportion of shilajit products sold in the US do not meet the heavy metal limits they
            claim or do not publish any testing data at all. Products without a publicly accessible
            COA have no independent verification of their safety claims.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What "Claimed" vs. "Confirmed" Testing Means in Our Database</h2>
          <p>
            In the Shilajit Transparency Database, we distinguish between two levels of heavy
            metals testing evidence:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Confirmed</strong> — The product has a public COA that includes a heavy metals
              panel with results below regulatory limits. We can read the specific numbers.
            </li>
            <li>
              <strong>Claimed</strong> — The brand states that heavy metal testing has been conducted,
              but the COA either is not public or does not include a detailed metals panel.
              The claim cannot be independently verified.
            </li>
          </ul>
          <p>
            From a safety standpoint, only "Confirmed" provides meaningful assurance.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Special Considerations: Pregnancy and Children</h2>
          <p>
            Regulatory limits for heavy metals are generally set for healthy adults. The FDA and WHO
            advise that there is no safe level of lead exposure for children. Pregnant women are
            advised to be particularly cautious, as lead passes the placental barrier and accumulates
            in foetal tissue. People in these groups should consult a physician before using any
            shilajit product, even one with clean COA results.
          </p>
        </section>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-medium text-slate-900">Filter for heavy-metals-tested products</p>
          <p className="mt-1 text-xs text-stone-600">
            Use our database to find products where heavy metal testing is confirmed or claimed — and
            read the actual COA where it is publicly available.
          </p>
          <Link
            href="/?heavyMetalsTested=true"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse heavy-metals-tested products →
          </Link>
        </div>

        <footer className="border-t border-stone-100 pt-6">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-stone-500">
            <li>
              1. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
              <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
            </li>
            <li>
              2. US Pharmacopeia. Elemental Impurities — Limits, General Chapter &lt;232&gt;.{" "}
              <a href="https://www.usp.org/" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
            </li>
            <li>
              3. California OEHHA. Proposition 65 Safe Harbor Levels for Lead, Arsenic, Mercury, Cadmium.{" "}
              <a href="https://oehha.ca.gov/proposition-65" target="_blank" rel="noopener noreferrer" className="underline">oehha.ca.gov</a>
            </li>
            <li>
              4. WHO. Permissible limits of heavy metals in soil and irrigation water.{" "}
              <a href="https://www.who.int/publications/i/item/9241545240" target="_blank" rel="noopener noreferrer" className="underline">WHO.int</a>
            </li>
            <li>
              5. FDA. Dietary Supplement Facility Registration and Adverse Event Reporting.{" "}
              <a href="https://www.fda.gov/food/dietary-supplements" target="_blank" rel="noopener noreferrer" className="underline">FDA.gov</a>
            </li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/fake-shilajit-how-to-spot" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Up next</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">How to Spot Fake or Adulterated Shilajit →</p>
        </Link>
        <Link href="/learn/how-to-read-shilajit-coa" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Related</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">How to Read a Shilajit COA →</p>
        </Link>
      </div>
    </article>
  );
}
