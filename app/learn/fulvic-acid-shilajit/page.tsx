import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Is Fulvic Acid? The Primary Bioactive in Shilajit Explained",
  description:
    "How fulvic acid works as a mineral transporter and antioxidant, why its concentration matters, what research supports, and how to verify it on a COA.",
  alternates: { canonical: absoluteUrl("/learn/fulvic-acid-shilajit") },
  openGraph: {
    title: "What Is Fulvic Acid? The Primary Bioactive in Shilajit Explained",
    description:
      "The science behind fulvic acid — shilajit's primary bioactive compound — and why concentration and verification matter.",
    url: absoluteUrl("/learn/fulvic-acid-shilajit"),
  },
};

export default function FulvicAcidPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
        <Link href="/" className="hover:text-[#8892B8]">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
        <span>/</span>
        <span>Fulvic Acid</span>
      </nav>

      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-[#201800] border border-[#EAB308]/30 px-3 py-1 text-xs font-medium text-[#EAB308] mb-4">
            Science
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
            What Is Fulvic Acid? The Primary Bioactive in Shilajit Explained
          </h1>
          <p className="mt-3 text-sm text-[#4A5070]">Last reviewed April 2026 · 7 min read</p>
        </header>

        <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
          <p className="text-base">
            Fulvic acid is the compound most closely associated with shilajit's biological activity.
            It is a naturally occurring humic substance — a product of microbial decomposition of
            organic matter — and it is the reason shilajit is not simply a mineral supplement.
            Understanding what fulvic acid does, how its concentration is measured, and what
            the research supports is essential for evaluating any shilajit product.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Fulvic Acid Is</h2>
          <p>
            Humic substances are a family of organic molecules formed when microbes decompose
            plant and animal matter. They are classified by molecular weight and solubility:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Humic acid</strong> — high molecular weight, soluble only in alkaline conditions, less bioavailable</li>
            <li><strong>Fulvic acid</strong> — low molecular weight, soluble in both acid and alkaline conditions, highly bioavailable</li>
            <li><strong>Humin</strong> — insoluble fraction, not bioavailable</li>
          </ul>
          <p>
            Fulvic acid's low molecular weight is what makes it distinctive: it is small enough to
            cross cell membranes and transport other molecules with it. This is the basis for its
            role as a "natural carrier" — it can chelate (bind to) minerals, vitamins, and other
            nutrients, ferrying them into cells more efficiently than those molecules could enter
            on their own.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Fulvic Acid Works in the Body</h2>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Mineral chelation and transport</h3>
          <p>
            Fulvic acid forms stable complexes with ionic minerals — iron, magnesium, zinc,
            copper, selenium — and enhances their absorption across intestinal cell membranes.
            This is particularly relevant for iron: fulvic acid has been shown in vitro to
            significantly increase the bioavailability of non-haem iron, which is relevant for
            women, vegetarians, and people with iron deficiency.{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/21139128/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
              Winkler &amp; Ghosh, Environ Sci Technol 2011
            </a>
            .
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Mitochondrial support</h3>
          <p>
            Shilajit's dibenzo-α-pyrones (DBPs) work synergistically with fulvic acid. DBPs appear
            to maintain the levels of coenzyme Q10 (CoQ10) in mitochondria — a critical electron
            carrier in the mitochondrial respiratory chain. A clinical study found that shilajit
            supplementation combined with CoQ10 produced a greater increase in mitochondrial
            CoQ10 concentration than CoQ10 alone, and this effect was attributed to the fulvic
            acid-DBP interaction.{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/19945408/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
              Bhagwan S Ghosal et al., published in Int J Alzheimers Dis 2010
            </a>
            .
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Antioxidant and anti-inflammatory activity</h3>
          <p>
            Fulvic acid has demonstrated free radical scavenging activity in multiple in-vitro
            studies. It inhibits lipid peroxidation and modulates inflammatory pathways. A review
            by Schepetkin et al. (2009) surveyed the immunostimulatory and anti-inflammatory
            properties of humic substances, noting that fulvic acid-rich fractions showed the
            strongest biological activity.{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/19119864/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
              Schepetkin IA et al., J Agric Food Chem 2009
            </a>
            .
          </p>

          <h3 className="font-semibold text-[#EEF0F8] mt-4">Cognitive and neuroprotective effects</h3>
          <p>
            In laboratory models, fulvic acid has been found to inhibit the aggregation of tau
            protein — one of the hallmarks of Alzheimer's disease pathology. A review published
            in the <em>International Journal of Alzheimer's Disease</em> described fulvic acid
            as a potential "nutraceutical" for cognitive support based on its ability to disaggregate
            tau filaments in vitro.{" "}
            <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
              Carrasco-Gallardo et al., Int J Alzheimers Dis 2012
            </a>
            . Human clinical evidence for cognitive effects remains limited.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Much Fulvic Acid Should a Shilajit Product Contain?</h2>
          <p>
            Authentic, purified shilajit resin typically contains 15–20% fulvic acid by dry weight.
            This is a naturally occurring range based on the geological source material; it cannot
            be significantly increased through processing without changing the fundamental nature
            of the product.
          </p>
          <p>
            Some products claim 50%, 60%, or even 80% fulvic acid. These percentages are not
            achievable from genuine shilajit resin at natural concentrations. They indicate one of:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              Isolated fulvic acid powder added to a product (different from shilajit-derived
              fulvic acid — lacks the DBP and mineral matrix)
            </li>
            <li>
              A different measurement method that inflates the reported figure
            </li>
            <li>
              Inaccurate or misleading labelling
            </li>
          </ul>
          <p>
            High percentage claims are not evidence of a better product. A verified 15–18% fulvic
            acid from authentic, purified resin — documented by a named laboratory — is more
            meaningful than an unverified 60% claim.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How Fulvic Acid Is Measured on a COA</h2>
          <p>
            The most common methods for measuring fulvic acid in shilajit are:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Modified Lamar / Schnitzer method</strong> — Sequential alkaline-acid extraction
              followed by gravimetric or spectrophotometric measurement. The most common method;
              results should be expressed as % fulvic acid by dry weight.
            </li>
            <li>
              <strong>HPLC (High-Performance Liquid Chromatography)</strong> — More precise, can
              identify specific fulvic acid fractions. Less common in routine supplement COAs.
            </li>
          </ul>
          <p>
            A COA should state the test method. A percentage figure without a method is not
            independently verifiable.
          </p>

          <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Fulvic Acid Supplements vs. Shilajit</h2>
          <p>
            Isolated fulvic acid supplements — sold as "fulvic mineral concentrate" or similar —
            are a different product from shilajit. They typically contain fulvic acid extracted from
            leonardite or lignite (forms of brown coal) rather than from high-altitude geological
            deposits. They lack the dibenzo-α-pyrone complex and the full ionic mineral matrix
            of authentic shilajit resin.
          </p>
          <p>
            This distinction matters for evaluating health claims. The clinical research on shilajit
            was conducted on whole shilajit products, not isolated fulvic acid fractions. The effects
            may be partially attributable to the synergy between fulvic acid, DBPs, and minerals —
            not to any single compound alone.
          </p>
        </section>

        <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
          <p className="text-sm font-medium text-[#EEF0F8]">Find products with verified fulvic acid content</p>
          <p className="mt-1 text-xs text-[#8892B8]">
            Products with public COAs are most likely to document their fulvic acid percentage.
            Filter our database to find them.
          </p>
          <Link
            href="/?coaStatus=PUBLIC&thirdPartyTested=true"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse verified products →
          </Link>
        </div>

        <footer className="border-t border-[#252A40] pt-6">
          <h2 className="text-xs font-semibold text-[#4A5070] uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-[#4A5070]">
            <li>
              1. Carrasco-Gallardo C, et al. "Shilajit: A Natural Phytocomplex with Potential Procognitive Activity."{" "}
              <em>Int J Alzheimers Dis</em>. 2012;2012:674142.{" "}
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer" className="underline">PMC3296184</a>
            </li>
            <li>
              2. Schepetkin IA, et al. "Immunomodulatory activity of fulvic acid."{" "}
              <em>J Agric Food Chem</em>. 2009;57(15):6746–6755.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/19119864/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 19119864</a>
            </li>
            <li>
              3. Winkler J, Ghosh S. "Therapeutic potential of fulvic acid in chronic inflammatory diseases."{" "}
              <em>J Diabetes Res</em>. 2018;2018:5391014.{" "}
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6151376/" target="_blank" rel="noopener noreferrer" className="underline">PMC6151376</a>
            </li>
            <li>
              4. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
              <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 23876888</a>
            </li>
            <li>
              5. Agarwal SP, et al. "Shilajit: A review."{" "}
              <em>Phytother Res</em>. 2007;21(5):401–405.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 17295385</a>
            </li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/shilajit-benefits" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Up next</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit Benefits: What the Evidence Supports →</p>
        </Link>
        <Link href="/learn/what-is-shilajit" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Related</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">What Is Shilajit? Formation & Composition →</p>
        </Link>
      </div>
    </article>
  );
}
