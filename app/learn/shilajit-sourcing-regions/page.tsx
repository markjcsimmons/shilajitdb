import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Where Shilajit Comes From: Mountain Regions Compared",
  description:
    "Himalayan shilajit is famous, but Altai, Caucasus, and other mountain ranges also produce high-quality deposits. Learn what actually determines shilajit quality.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-sourcing-regions") },
  openGraph: {
    title: "Where Shilajit Comes From: Mountain Regions Compared",
    description:
      "Why no single mountain range has a monopoly on quality shilajit — and what actually matters when evaluating source claims.",
    url: absoluteUrl("/learn/shilajit-sourcing-regions"),
  },
};

export default function SourcingRegionsPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
        <Link href="/" className="hover:text-[#8892B8]">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
        <span>/</span>
        <span>Sourcing Regions</span>
      </nav>

      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-[#041828] border border-[#38BDF8]/30 px-3 py-1 text-xs font-medium text-[#38BDF8] mb-4">
            Sourcing
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
            Where Shilajit Comes From: Mountain Regions Compared
          </h1>
          <p className="mt-3 text-sm text-[#4A5070]">
            Last reviewed April 2026 · 7 min read
          </p>
        </header>

        <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
          <p className="text-base">
            Walk down the supplements aisle and almost every shilajit product claims Himalayan origin.
            The marketing is understandable — the Himalayas carry mystique and altitude. But the claim
            that Himalayan shilajit is inherently superior to material sourced from other mountain
            ranges is not supported by the biochemical evidence. What matters is geology, altitude,
            purification, and verification — not a brand name attached to a mountain range.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Actually Determines Quality</h2>
          <p>
            Shilajit quality is shaped by four variables:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Altitude.</strong> Deposits above 3,000 metres form under greater pressure,
              with denser organic stratification and less surface weathering. Higher altitude is
              generally associated with higher fulvic acid concentration — but this is a function
              of geology, not of which range the mountain belongs to.
            </li>
            <li>
              <strong>Mineral substrate.</strong> The local rock chemistry — shale, limestone, granite,
              metamorphic rock — shapes the ionic mineral profile of the deposit. Different ranges
              have different geological histories, producing different mineral fingerprints, each
              with its own nutritional profile.
            </li>
            <li>
              <strong>Purification method.</strong> Raw shilajit is not safe to consume. It requires
              removal of heavy metals, mycotoxins, microbial contamination, and inorganic debris.
              The purification process matters at least as much as the source deposit.
            </li>
            <li>
              <strong>Third-party verification.</strong> A brand can claim any origin. Independent
              laboratory testing of the final product — not the raw exudate — is the only way to
              verify what is actually in the product you are buying.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Major Sourcing Regions</h2>

          <div className="rounded-xl border border-[#252A40] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#171C2E] border-b border-[#252A40]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Region</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Altitude</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A40]">
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Himalayas (India, Nepal, Bhutan, Tibet)</td>
                  <td className="px-4 py-3 text-[#8892B8]">3,000–5,000 m+</td>
                  <td className="px-4 py-3 text-[#8892B8]">
                    Most commercially available source. High fulvic acid potential; large variation
                    in quality due to widespread unregulated harvesting. "Himalayan" is often a
                    marketing label rather than a verified origin claim.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Altai Mountains (Russia, Kazakhstan, Mongolia)</td>
                  <td className="px-4 py-3 text-[#8892B8]">2,000–4,000 m</td>
                  <td className="px-4 py-3 text-[#8892B8]">
                    Known in Russian literature as <em>mumiyo</em> or <em>mumie</em>. Extensively
                    studied in Soviet-era research for recovery and performance. Different mineral
                    profile from Himalayan; documented use by Soviet Olympic programmes in the 1970s–80s.
                    Deposits tend to be more regulated under Russian collection standards.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Caucasus Mountains (Georgia, Azerbaijan, Armenia)</td>
                  <td className="px-4 py-3 text-[#8892B8]">1,500–3,500 m</td>
                  <td className="px-4 py-3 text-[#8892B8]">
                    Used in traditional Georgian and Armenian medicine. Lower average altitude but
                    different geological substrate produces a distinct mineral signature. Less
                    well-known in Western markets but referenced in Caucasian ethnobotanical literature.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Hindu Kush / Karakoram (Pakistan, Afghanistan)</td>
                  <td className="px-4 py-3 text-[#8892B8]">3,500–5,000 m</td>
                  <td className="px-4 py-3 text-[#8892B8]">
                    Geologically continuous with the Himalayas. Deposits here are sometimes sold
                    under the "Himalayan" label by Pakistani exporters, making origin claims
                    particularly difficult to verify from the consumer end.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Andes (Peru, Bolivia, Chile)</td>
                  <td className="px-4 py-3 text-[#8892B8]">3,000–5,000 m</td>
                  <td className="px-4 py-3 text-[#8892B8]">
                    Known locally as <em>salajeet</em> or <em>momia</em>. Emerging in Western markets.
                    High-altitude sourcing with comparable geological conditions but a very different
                    mineral substrate from the Asian ranges — different trace element ratios.
                    Less peer-reviewed research available specifically for Andean deposits.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Case for Multi-Region Sourcing</h2>
          <p>
            Several researchers have argued that blending material from multiple mountain ranges may
            produce a broader mineral profile than single-origin sourcing — the rationale being that
            different geological substrates contribute different ionic mineral fingerprints that
            complement each other. This is analogous to the argument for dietary diversity rather
            than relying on a single food for nutritional completeness.
          </p>
          <p>
            Whether this blending claim is supported by controlled bioavailability data is an open
            question. What it does underscore is that a single-origin claim — particularly one as
            broad and unverifiable as "Himalayan" — should not function as a proxy for quality.
            A product sourced from the Altai range with a public COA from a named laboratory is,
            by any verifiable metric, a better choice than a product claiming premium Himalayan
            origin with no testing documentation.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The "Himalayan Best" Problem</h2>
          <p>
            The dominance of Himalayan branding has created a market dynamic where the word
            "Himalayan" functions as a quality signal even when no quality verification supports it.
            Some products sourced from the Altai or Caucasus have stronger laboratory documentation
            than products claiming Himalayan origin. The origin claim and the quality are two
            separate things.
          </p>
          <p>
            The practical advice: treat origin claims as marketing context, not quality verification.
            Look for a COA from a named third-party laboratory that tests the final product — not
            the raw exudate from the source location.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Soviet Research: The Altai Legacy</h2>
          <p>
            Much of the early systematic research on shilajit was conducted in the Soviet Union
            under the name <em>mumiyo</em>, focusing on Altai-sourced material. This research —
            conducted through the 1960s to 1980s — investigated applications in bone fracture
            healing, physical performance recovery, and altitude sickness. While much of this work
            appeared in Russian-language publications not widely indexed in Western databases,
            some has been cited in later English-language reviews and forms part of the ethnobotanical
            record.{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/17295385/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-[#EEF0F8]"
            >
              Agarwal et al. (Phytother Res 2007)
            </a>{" "}
            provide a useful survey of this literature.
          </p>
        </section>

        {/* CTA */}
        <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
          <p className="text-sm font-medium text-[#EEF0F8]">Filter by manufacturing country claim</p>
          <p className="mt-1 text-xs text-[#8892B8]">
            The database records each brand's stated manufacturing country. You can filter and compare
            what testing documentation exists regardless of origin claim.
          </p>
          <Link
            href="/?coaStatus=PUBLIC"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse products with public COAs →
          </Link>
        </div>

        <footer className="border-t border-[#252A40] pt-6">
          <h2 className="text-xs font-semibold text-[#4A5070] uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-[#4A5070]">
            <li>
              1. Agarwal SP, et al. "Shilajit: A review."{" "}
              <em>Phytother Res</em>. 2007;21(5):401–405.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 17295385</a>
            </li>
            <li>
              2. Meena H, et al. "Shilajit: A panacea for high-altitude problems."{" "}
              <em>Int J Ayurveda Res</em>. 2010;1(1):37–40.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21364527/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21364527</a>
            </li>
            <li>
              3. Wilson E, Rajamanickam GV, et al. "Review on shilajit used in traditional Indian medicine."{" "}
              <em>J Ethnopharmacol</em>. 2011;136(1):1–9.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21530631/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21530631</a>
            </li>
            <li>
              4. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
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
        <Link href="/learn/fake-shilajit-how-to-spot" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Related</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Spot Fake or Adulterated Shilajit →</p>
        </Link>
      </div>
    </article>
  );
}
