import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "How to Spot Fake or Adulterated Shilajit",
  description:
    "Visual and physical tests, what laboratory analysis reveals, and why a public COA from a named lab is still the most reliable verification method.",
  alternates: { canonical: absoluteUrl("/learn/fake-shilajit-how-to-spot") },
  openGraph: {
    title: "How to Spot Fake or Adulterated Shilajit",
    description:
      "Every practical test for authenticity — from the solubility check to third-party COA verification.",
    url: absoluteUrl("/learn/fake-shilajit-how-to-spot"),
  },
};

export default function FakeShilajitPage() {
  return (
    <>
      <ArticleSchema
        slug="fake-shilajit-how-to-spot"
        title="How to Spot Fake or Adulterated Shilajit"
        description="Visual and physical tests, what laboratory analysis reveals, and why a public COA from a named lab is still the most reliable verification method."
        datePublished="2025-01-15"
      />
      <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
        <Link href="/" className="hover:text-[#8892B8]">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
        <span>/</span>
        <span>Spot Fake Shilajit</span>
      </nav>

      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-[#200505] border border-[#EF4444]/30 px-3 py-1 text-xs font-medium text-[#EF4444] mb-4">
            Safety
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
            How to Spot Fake or Adulterated Shilajit
          </h1>
          <p className="mt-3 text-sm text-[#4A5070]">Last reviewed April 2026 · 7 min read</p>
          <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
        </header>

        <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
          <p className="text-base">
            The shilajit market has a significant adulteration problem. Because raw shilajit commands
            a high price, some suppliers dilute genuine material with cheap fillers — humic acid
            powder, plant extracts, peat, soil, or inert binders — and sell it as pure shilajit.
            Others sell products with no meaningful shilajit content at all. Knowing how to evaluate
            a product before and after purchase is one of the most useful things a buyer can learn.
          </p>

          <div className="rounded-lg bg-[#201800] border border-[#EAB308]/30 p-4">
            <p className="text-xs font-semibold text-[#EAB308] mb-1">Important caveat</p>
            <p className="text-xs text-[#EAB308]">
              Physical tests can help identify obvious fakes but cannot definitively verify authentic
              shilajit or detect all forms of adulteration. A <Link href="/learn/how-to-read-shilajit-coa" className="text-[#EAB308] underline underline-offset-2 hover:text-white transition-colors">COA from a named, accredited laboratory</Link>
              is the only reliable verification method. Use physical tests as a sanity check, not a
              substitute for documentation.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Physical Tests for Resin</h2>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">The solubility test</h3>
          <p>
            Authentic shilajit resin dissolves completely and quickly in warm water (not hot —
            around 40°C / 100°F), producing a dark golden-brown to reddish-brown liquid without
            sediment. It should not leave an oily residue, foam excessively, or leave undissolved
            clumps. If a resin dissolves in cold water immediately without warming, it may be a
            water-soluble powder compressed into a resin-like block. If it leaves gritty sediment,
            it may contain inorganic fillers.
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Temperature sensitivity</h3>
          <p>
            Genuine shilajit resin is solid and brittle at cool room temperatures (below 20°C) and
            becomes soft and pliable when warmed by hand. If a resin product stays soft and sticky
            at room temperature regardless of conditions, this can indicate the presence of waxes,
            glycerine, or other softeners added to simulate the correct texture. Very waxy or
            petroleum-like feel is a red flag.
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Smell and taste</h3>
          <p>
            Authentic shilajit has a distinctive earthy, slightly bituminous smell — similar to
            fertile soil or aged peat, but not petroleum or chemical. Some describe it as smelling
            faintly of tar, damp earth, or dried herbs. The taste is similarly earthy, mineral,
            slightly bitter, and astringent. Products that smell strongly of chemicals, have no
            smell at all, or taste primarily of sugar or artificial flavouring should be questioned.
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">The flame test (limited use)</h3>
          <p>
            Applying a small amount of shilajit resin to a flame: genuine resin will not catch fire
            and will bubble slightly, producing a small amount of smoke. This is a limited test —
            it is easy to pass with many non-shilajit materials — but obvious flammability or
            melting like wax suggests adulteration with organic fillers.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Red Flags in the Product and Listing</h2>

          <div className="rounded-xl border border-[#252A40] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#171C2E] border-b border-[#252A40]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Signal</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">What it suggests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A40]">
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Very low price (under $20 for 20g+)</td>
                  <td className="px-4 py-3 text-[#8892B8]">Likely diluted; authentic purified resin costs more to produce</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Fulvic acid claim of 50%+</td>
                  <td className="px-4 py-3 text-[#8892B8]">Unachievable from genuine resin; indicates isolated fulvic acid or false labelling</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">No laboratory or COA mentioned</td>
                  <td className="px-4 py-3 text-[#8892B8]">No independent verification of any claim</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">COA from an unverifiable "lab"</td>
                  <td className="px-4 py-3 text-[#8892B8]">The lab may not exist or be accredited; check A2LA or ANAB directories</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Bright gold or orange colour when dissolved</td>
                  <td className="px-4 py-3 text-[#8892B8]">Authentic shilajit produces dark golden-brown, not bright colours</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Capsules with no stated mg of shilajit content</td>
                  <td className="px-4 py-3 text-[#8892B8]">Impossible to evaluate dose; label is non-informative</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">"Himalayan" claim with no origin documentation</td>
                  <td className="px-4 py-3 text-[#8892B8]">Origin claims are unverifiable without third-party testing</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Laboratory Testing Reveals</h2>
          <p>
            Physical tests cannot detect all adulteration. For example, a product that has been
            blended with genuine shilajit and cheap humic acid powder may pass the solubility test
            while delivering a fraction of the fulvic acid and mineral content claimed. The only
            way to catch this is laboratory analysis.
          </p>
          <p>
            Key things a COA reveals that physical tests cannot:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Actual fulvic acid %</strong> — Is it the 15–20% expected from genuine shilajit, or lower?</li>
            <li><strong>Heavy metals panel</strong> — Are lead, arsenic, mercury, cadmium within safe limits?</li>
            <li><strong>Microbial count</strong> — Is there bacterial or fungal contamination?</li>
            <li><strong>Moisture and ash content</strong> — Indicators of dilution or excessive inorganic content</li>
          </ul>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Marketplace and Retail Risks</h2>
          <p>
            Third-party marketplaces (Amazon, eBay, Walmart Marketplace) have a well-documented
            problem with counterfeit and adulterated supplements. Products listed under a legitimate
            brand's name can be fulfilled by a third-party seller with different inventory. If
            buying online, purchase directly from the brand's own website or from a verified retail
            partner where authenticity can be confirmed.
          </p>
          <p>
            ConsumerLab.com has conducted independent testing of shilajit products purchased
            through US retail channels and found issues including incorrect labelling and
            insufficient active ingredient content in some tested products.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Our Database Helps</h2>
          <p>
            The Shilajit Transparency Database records COA status, testing lab identity, and
            heavy metals testing evidence for each product we review. Products with public COAs
            from named laboratories provide the strongest authenticity assurance. Filter by these
            criteria to find the most verifiable products on the market.
          </p>
        </section>

        <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
          <p className="text-sm font-medium text-[#EEF0F8]">Find verified products</p>
          <p className="mt-1 text-xs text-[#8892B8]">
            Filter for products with a named testing lab and public COA — the two most important authenticity signals.
          </p>
          <Link
            href="/?thirdPartyTested=true&coaStatus=PUBLIC"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse named-lab, public-COA products →
          </Link>
          <p className="mt-3 text-xs text-[#4A5070]"><Link href="/best/best-third-party-tested" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">Best third-party tested →</Link></p>
        </div>

        <footer className="border-t border-[#252A40] pt-6">
          <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-[#8892B8]">
            <li>
              1. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
              <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
            </li>
            <li>
              2. ConsumerLab.com. Shilajit Supplements Review (subscription required).{" "}
              <a href="https://www.consumerlab.com" target="_blank" rel="nofollow noopener noreferrer" className="underline">ConsumerLab.com</a>
            </li>
            <li>
              3. Wilson E, et al. "Review on shilajit used in traditional Indian medicine."{" "}
              <em>J Ethnopharmacol</em>. 2011;136(1):1–9.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21530631/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21530631</a>
            </li>
            <li>
              4. FDA. Dietary Supplement Adulteration and Labeling Violations.{" "}
              <a href="https://www.fda.gov/food/dietary-supplements/dietary-supplement-products-ingredients" target="_blank" rel="noopener noreferrer" className="underline">FDA.gov</a>
            </li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/shilajit-heavy-metals" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Related</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit and Heavy Metals →</p>
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
