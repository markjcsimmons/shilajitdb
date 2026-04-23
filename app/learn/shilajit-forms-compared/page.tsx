import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shilajit Resin vs. Capsules vs. Powder vs. Gummies: Which Form Is Best?",
  description:
    "Processing tradeoffs, bioavailability differences, and adulteration risk across shilajit product formats — with guidance on how to evaluate each.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-forms-compared") },
  openGraph: {
    title: "Shilajit Resin vs. Capsules vs. Powder vs. Gummies: Which Form Is Best?",
    description:
      "A neutral comparison of every shilajit format: what you gain, what you lose, and what to look for in a COA for each.",
    url: absoluteUrl("/learn/shilajit-forms-compared"),
  },
};

export default function FormsComparedPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-stone-400">
        <Link href="/" className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-stone-600">Learn</Link>
        <span>/</span>
        <span>Forms Compared</span>
      </nav>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 mb-4">
            Buying Guide
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 leading-snug">
            Resin vs. Capsules vs. Powder vs. Gummies: Which Shilajit Form Is Best?
          </h1>
          <p className="mt-3 text-sm text-stone-500">Last reviewed April 2026 · 7 min read</p>
        </header>

        <section className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="text-base">
            Shilajit is sold in four main forms: resin, capsules, powder, and gummies. Each involves
            a different level of processing, carries different authenticity risks, and suits
            different buyers. The "best" form depends on your priorities — but the differences
            between them are large enough to be worth understanding before you buy.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Resin — Least Processed, Hardest to Fake</h2>
          <p>
            Resin is the closest thing to shilajit in its natural state after purification. It is
            a thick, dark, tar-like substance that dissolves in warm water or can be taken directly
            under the tongue. Because it undergoes minimal additional processing after purification,
            the full matrix of fulvic acid, humic acid, DBPs, and ionic minerals is preserved.
          </p>
          <p>
            Resin is also the hardest form to adulterate without it being detectable. Creating a
            convincing fake resin requires significant effort; adding fillers changes the texture,
            solubility, and smell in ways that are physically apparent. This is why resin is
            generally considered the reference format — and why a COA for a resin product tells
            you the most about the underlying material.
          </p>
          <p>
            The main drawbacks: it requires measuring a small dose (typically a pea-sized portion,
            around 300–500 mg), has a strong and distinctive earthy taste, and is less convenient
            for travel than capsules.
          </p>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mt-2">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Best for</p>
            <p className="text-xs text-emerald-700">
              Buyers who prioritise authenticity, full-spectrum composition, and who are willing
              to measure doses. The gold standard for comparing products on price per gram.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Capsules — Convenient, but Check What's Inside</h2>
          <p>
            Capsules contain dried, powdered shilajit extract encased in a gelatine or plant-based
            shell. The convenience is obvious — a fixed dose, no measuring, no taste. The tradeoff
            is that you can't see or assess what's inside, and the powdering process creates more
            opportunity for adulteration or dilution with fillers.
          </p>
          <p>
            The critical question with any capsule product is: what is the shilajit content per
            capsule (in mg), what is the standardised fulvic acid percentage, and what does the
            COA show for that final product? A capsule claiming 500 mg of "shilajit extract"
            is meaningless without knowing the extraction ratio and fulvic acid content.
          </p>
          <p>
            Capsules made from genuine, high-quality resin that has been dried and encapsulated
            can be as effective as loose resin. The form itself is not the problem — it is the
            lack of transparency around the capsule contents that creates risk.
          </p>

          <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 mt-2">
            <p className="text-xs font-semibold text-sky-700 mb-1">Best for</p>
            <p className="text-xs text-sky-700">
              Buyers who value consistency and convenience. Look for capsules with a stated
              fulvic acid % and a public COA that covers the final encapsulated product.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Powder — High Adulteration Risk</h2>
          <p>
            Powdered shilajit is the most processed and the easiest to adulterate. Adding cheap
            fillers — humic acid powder, plant extracts, peat, or inert bulking agents — to a
            small amount of genuine shilajit extract is straightforward and difficult to detect
            without laboratory analysis. Powder is also hygroscopic (absorbs moisture), which
            can affect stability if not properly packaged.
          </p>
          <p>
            This does not mean all powder products are adulterated — but it does mean that powder
            products carry a higher burden of proof. A COA showing fulvic acid percentage, heavy
            metals results, and microbial testing from a named independent laboratory is more
            important for powder than for any other form.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mt-2">
            <p className="text-xs font-semibold text-amber-700 mb-1">Best for</p>
            <p className="text-xs text-amber-700">
              Adding to smoothies or drinks. Only buy from brands with a public COA that includes
              a fulvic acid panel. Treat any powder product without a COA as unverifiable.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Gummies — Entertainment, Not Medicine</h2>
          <p>
            Gummies are the furthest from authentic shilajit. The shilajit content per gummy is
            typically low (often 50–200 mg), it is usually a processed extract rather than
            full-spectrum resin, and the gummy matrix — sugar, gelatin, flavourings, colourings —
            dilutes the product significantly. Some gummies use shilajit extract standardised to
            a specific fulvic acid percentage; many do not.
          </p>
          <p>
            The appeal is taste and approachability, particularly for buyers new to shilajit who
            find the taste of resin off-putting. But gummies are the form least likely to deliver
            the mineral matrix and fulvic acid concentrations present in clinical research on shilajit.
            They are also the form most likely to contain artificial additives.
          </p>

          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 mt-2">
            <p className="text-xs font-semibold text-rose-700 mb-1">Best for</p>
            <p className="text-xs text-rose-700">
              Beginners who want to try shilajit without the taste. Understand that gummies likely
              deliver a lower effective dose than resin or capsules at equivalent label quantities.
              Check whether the shilajit content is standardised to a fulvic acid percentage.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Form Comparison at a Glance</h2>

          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Form</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Processing</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Adulteration risk</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Convenience</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700">Value for money</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Resin</td>
                  <td className="px-4 py-3 text-stone-600">Minimal</td>
                  <td className="px-4 py-3 text-emerald-700 font-medium">Low</td>
                  <td className="px-4 py-3 text-stone-600">Medium</td>
                  <td className="px-4 py-3 text-stone-600">High (price per g)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Capsules</td>
                  <td className="px-4 py-3 text-stone-600">Moderate</td>
                  <td className="px-4 py-3 text-amber-700 font-medium">Medium</td>
                  <td className="px-4 py-3 text-stone-600">High</td>
                  <td className="px-4 py-3 text-stone-600">Medium</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Powder</td>
                  <td className="px-4 py-3 text-stone-600">High</td>
                  <td className="px-4 py-3 text-rose-700 font-medium">High</td>
                  <td className="px-4 py-3 text-stone-600">Medium</td>
                  <td className="px-4 py-3 text-stone-600">Variable</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Gummies</td>
                  <td className="px-4 py-3 text-stone-600">Very high</td>
                  <td className="px-4 py-3 text-rose-700 font-medium">High</td>
                  <td className="px-4 py-3 text-stone-600">Very high</td>
                  <td className="px-4 py-3 text-stone-600">Low (per mg shilajit)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What About Liquid Drops?</h2>
          <p>
            Some products offer liquid shilajit — typically a fulvic acid solution or a shilajit
            extract dissolved in water or alcohol. These can be legitimate but are difficult to
            evaluate without a COA showing the shilajit content and fulvic acid concentration per
            serving. Liquid forms are also susceptible to degradation if not properly stabilised.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">The Bottom Line</h2>
          <p>
            Form matters less than quality verification. A well-documented capsule product with a
            public COA from a named laboratory is a better choice than an unverified resin from an
            unknown source. That said, resin remains the reference form — lowest adulteration risk,
            most complete mineral matrix, and the easiest to evaluate on a price-per-gram basis.
          </p>
          <p>
            Whatever form you choose, the same question applies: does this brand publish a COA from
            a named, accredited laboratory that tests the final product for fulvic acid and heavy metals?
          </p>
        </section>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-medium text-slate-900">Filter by product form</p>
          <p className="mt-1 text-xs text-stone-600">
            Browse resin, capsule, powder, and gummy products in the database — with COA status visible for each.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link href="/?form=RESIN" className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors">Resin</Link>
            <Link href="/?form=CAPSULE" className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors">Capsules</Link>
            <Link href="/?form=POWDER" className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors">Powder</Link>
            <Link href="/?form=GUMMY" className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors">Gummies</Link>
          </div>
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
              2. Agarwal SP, et al. "Shilajit: A review."{" "}
              <em>Phytother Res</em>. 2007;21(5):401–405.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 17295385</a>
            </li>
            <li>
              3. Wilson E, et al. "Review on shilajit used in traditional Indian medicine."{" "}
              <em>J Ethnopharmacol</em>. 2011;136(1):1–9.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21530631/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21530631</a>
            </li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/fulvic-acid-shilajit" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Up next</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">What Is Fulvic Acid? →</p>
        </Link>
        <Link href="/learn/fake-shilajit-how-to-spot" className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all">
          <p className="text-xs text-stone-400 mb-1">Related</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">How to Spot Fake or Adulterated Shilajit →</p>
        </Link>
      </div>
    </article>
  );
}
