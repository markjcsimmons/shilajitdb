import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "How to Read a Shilajit COA (Certificate of Analysis)",
  description:
    "A practical buyer's guide to interpreting a shilajit Certificate of Analysis: what panels matter, what to verify, and red flags that reveal a fake or insufficient COA.",
  alternates: { canonical: absoluteUrl("/learn/how-to-read-shilajit-coa") },
  openGraph: {
    title: "How to Read a Shilajit COA (Certificate of Analysis)",
    description:
      "What panels matter on a COA, how to verify it's real, and what red flags to look for — from the team behind the Shilajit Transparency Database.",
    url: absoluteUrl("/learn/how-to-read-shilajit-coa"),
  },
};

export default function HowToReadCOAPage() {
  return (
    <>
      <ArticleSchema
        slug="how-to-read-shilajit-coa"
        title="How to Read a Shilajit COA (Certificate of Analysis)"
        description="A practical guide to interpreting a shilajit Certificate of Analysis: what panels matter, what to verify, and red flags that reveal a fake or insufficient COA."
        datePublished="2025-01-15"
      />
      <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
        <Link href="/" className="hover:text-[#8892B8]">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
        <span>/</span>
        <span>How to Read a COA</span>
      </nav>

      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-[#160F28] border border-[#A78BFA]/30 px-3 py-1 text-xs font-medium text-[#A78BFA] mb-4">
            Buying Guide
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
            How to Read a Shilajit Certificate of Analysis
          </h1>
          <p className="mt-3 text-sm text-[#4A5070]">
            Last reviewed April 2026 · 9 min read
          </p>
        </header>

        <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
          <p className="text-base">
            A Certificate of Analysis (COA) is the single most important document you can request
            from a shilajit brand. It is a laboratory report that tells you what is actually in the
            product — not what the label claims. But not all COAs are equal, and some brands produce
            documents that look official while providing little meaningful information. This guide
            walks through every section of a COA and what it should contain.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Step 1: Identify the Laboratory</h2>
          <p>
            The first thing to check is who ran the tests. A credible COA comes from an accredited
            third-party laboratory — not from the brand's own facility or a laboratory the brand owns.
            Look for:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>ISO/IEC 17025 accreditation.</strong> This is the international standard for
              testing laboratories. An accredited lab can be verified through the relevant national
              accreditation body (e.g. A2LA or ANAB in the US, UKAS in the UK).
            </li>
            <li>
              <strong>Named laboratory with a verifiable address.</strong> Labs like Eurofins,
              NSF International, Intertek, or USP-verified facilities are large, well-known operations.
              Smaller regional labs are also valid if they are accredited — but the lab should be
              searchable and verifiable online.
            </li>
            <li>
              <strong>A unique report or sample ID.</strong> Legitimate COAs have a report number
              that can (in theory) be verified by contacting the lab. A generic template with no
              ID is a red flag.
            </li>
          </ul>

          <div className="rounded-lg bg-[#200505] border border-[#EF4444]/30 p-4 mt-4">
            <p className="text-xs font-semibold text-[#EF4444] mb-1">🚩 Red flag</p>
            <p className="text-xs text-[#EF4444]">
              The laboratory name is vague ("Independent Lab Services"), has no address, or is
              not searchable online. This is a common feature of fabricated COAs.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Step 2: Check the Sample Date</h2>
          <p>
            COAs have a shelf life in terms of relevance. A document from 2018 tells you very
            little about what is in a product you are buying in 2025 — formulations, suppliers,
            and purification processes can all change. Look for:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>A test date within the past 12–24 months for ongoing products</li>
            <li>The product name or lot number on the COA matching what you are purchasing</li>
          </ul>
          <p>
            Some brands test a single batch when they launch and never retest. This is inadequate
            for quality assurance.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Step 3: Find the Fulvic Acid Panel</h2>
          <p>
            Fulvic acid is the primary bioactive in shilajit. Its percentage by dry weight is the
            most meaningful compositional data point on a COA. What to look for:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Fulvic acid %:</strong> Authentic purified shilajit typically measures
              between 15% and 20% fulvic acid by dry weight. Very high claims (50%+) should be
              treated with scepticism — these may reflect a different measurement method or
              adulteration with isolated fulvic acid powder rather than genuine shilajit resin.
            </li>
            <li>
              <strong>Test method:</strong> Fulvic acid is measured using modified Lamar or
              Schnitzer methods, or HPLC. The method should be stated on the COA.
            </li>
          </ul>

          <div className="rounded-lg bg-[#201800] border border-[#EAB308]/30 p-4 mt-4">
            <p className="text-xs font-semibold text-[#EAB308] mb-1">⚠ Note on fulvic acid percentages</p>
            <p className="text-xs text-[#EAB308]">
              Some products label themselves as "50% fulvic acid" — this typically refers to
              isolated fulvic acid powder added to a product, not a naturally occurring concentration
              in shilajit resin. High-percentage claims are not necessarily better; they are
              almost always different products.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Step 4: Find the Heavy Metals Panel</h2>
          <p>
            This is the most important safety section. Shilajit naturally accumulates heavy metals
            from its geological environment. Proper purification removes them; improper or absent
            purification leaves them. A complete heavy metals panel should test for:
          </p>

          <div className="rounded-xl border border-[#252A40] overflow-hidden mt-2">
            <table className="w-full text-xs">
              <thead className="bg-[#171C2E] border-b border-[#252A40]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Metal</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Safe limit (USP)</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#8892B8]">Why it matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A40]">
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Lead (Pb)</td>
                  <td className="px-4 py-3 text-[#8892B8]">&lt; 10 µg/day</td>
                  <td className="px-4 py-3 text-[#8892B8]">Neurotoxic; strict California Prop 65 limit of 0.5 µg/day</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Mercury (Hg)</td>
                  <td className="px-4 py-3 text-[#8892B8]">&lt; 15 µg/day</td>
                  <td className="px-4 py-3 text-[#8892B8]">Nephrotoxic; particularly dangerous in inorganic form</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Arsenic (As)</td>
                  <td className="px-4 py-3 text-[#8892B8]">&lt; 15 µg/day</td>
                  <td className="px-4 py-3 text-[#8892B8]">Inorganic arsenic is carcinogenic; organic forms less so</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#EEF0F8]">Cadmium (Cd)</td>
                  <td className="px-4 py-3 text-[#8892B8]">&lt; 5 µg/day</td>
                  <td className="px-4 py-3 text-[#8892B8]">Accumulates in kidneys; long half-life</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#4A5070] mt-1">
            Limits vary by jurisdiction. California Prop 65 sets the strictest US thresholds for
            lead and cadmium. The WHO and USP guidelines differ. A COA should state which limits
            the results are compared against.
          </p>
          <p>
            See our full guide:{" "}
            <Link href="/learn/shilajit-heavy-metals" className="underline underline-offset-2 text-[#EEF0F8]">
              Shilajit and Heavy Metals: Safety, Testing &amp; Acceptable Levels
            </Link>
            .
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Step 5: Microbial Testing</h2>
          <p>
            A complete COA will also include microbial testing results. This is important because
            raw shilajit is collected from open-air rock surfaces and can contain bacterial and
            fungal contamination. Look for results for:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Total aerobic microbial count (TAMC)</li>
            <li>Total yeast and mould count (TYMC)</li>
            <li>Pathogens: E. coli, Salmonella spp., Staphylococcus aureus</li>
          </ul>
          <p>
            Results should be below USP or equivalent limits. Absence of microbial panels suggests
            the product has not been fully tested.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Types of COA and What They Mean</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Public COA (downloadable PDF directly linked).</strong> The gold standard.
              The brand is confident enough in results to make them freely available. You can
              download, read, and verify the laboratory details.
            </li>
            <li>
              <strong>Page-embedded COA (image on a product page).</strong> Better than nothing,
              but an image cannot be verified against the lab and can be easily edited. Lower
              confidence than a downloadable document.
            </li>
            <li>
              <strong>COA available on request.</strong> The brand claims testing exists but does
              not publish it. Some legitimate companies operate this way; others use it to avoid
              scrutiny. Always request it.
            </li>
            <li>
              <strong>No COA.</strong> The brand provides no testing documentation. This is a
              significant red flag for any ingestible supplement, particularly one with known
              heavy metal risks.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Verifying a COA</h2>
          <p>
            If you want to go further than reading a COA, you can attempt to verify it:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>Search the laboratory name and confirm it has a real website and physical address</li>
            <li>Check the lab's accreditation on the relevant national body's directory (e.g. <a href="https://www.a2la.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">A2LA.org</a>)</li>
            <li>Email the lab with the report number and ask them to confirm it is genuine</li>
          </ol>
          <p>
            Very few buyers do this — which is why it is a meaningful differentiator when a lab
            is well-known enough that verification is easy.
          </p>
        </section>

        {/* CTA */}
        <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
          <p className="text-sm font-medium text-[#EEF0F8]">Filter by COA status in our database</p>
          <p className="mt-1 text-xs text-[#8892B8]">
            We record whether each product has a public, embeded, on-request, or no COA — and
            link to the document where one exists.
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
              1. US Pharmacopeia. Heavy Metals Limits — General Chapter &lt;232&gt; Elemental Impurities — Limits.{" "}
              <a href="https://www.usp.org/sites/default/files/usp/document/our-work/chemical-medicines/key-issues/232-Presentation.pdf" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
            </li>
            <li>
              2. California OEHHA. Proposition 65 Safe Harbor Levels.{" "}
              <a href="https://oehha.ca.gov/proposition-65/general-info/current-proposition-65-no-significant-risk-levels-nsrls-and-maximum" target="_blank" rel="noopener noreferrer" className="underline">oehha.ca.gov</a>
            </li>
            <li>
              3. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
              <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
            </li>
            <li>
              4. ISO/IEC 17025:2017. General requirements for the competence of testing and calibration laboratories.{" "}
              <a href="https://www.iso.org/standard/66912.html" target="_blank" rel="noopener noreferrer" className="underline">ISO.org</a>
            </li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/shilajit-heavy-metals" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Up next</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit and Heavy Metals: Safety & Testing →</p>
        </Link>
        <Link href="/learn/fake-shilajit-how-to-spot" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Related</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Spot Fake or Adulterated Shilajit →</p>
        </Link>
      </div>
    </article>
    </>
  );
}
