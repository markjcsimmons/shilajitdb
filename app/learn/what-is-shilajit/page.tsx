import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Is Shilajit? Formation, Composition & Research",
  description:
    "A science-based overview of shilajit: how it forms over millennia, its key compounds (fulvic acid, DBPs, minerals), and what clinical research actually supports.",
  alternates: { canonical: absoluteUrl("/learn/what-is-shilajit") },
  openGraph: {
    title: "What Is Shilajit? Formation, Composition & Research",
    description:
      "How shilajit forms, what it contains, and what the research says — separated from marketing claims.",
    url: absoluteUrl("/learn/what-is-shilajit"),
  },
};

export default function WhatIsShilajitPage() {
  return (
    <article className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-400">
        <Link href="/" className="hover:text-stone-600">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-stone-600">Learn</Link>
        <span>/</span>
        <span>What Is Shilajit?</span>
      </nav>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-4">
            Foundation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 leading-snug">
            What Is Shilajit? Formation, Composition &amp; What the Research Says
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Last reviewed April 2026 · 8 min read
          </p>
        </header>

        <section className="prose prose-sm prose-stone max-w-none space-y-4 text-slate-700 leading-relaxed">
          <p className="text-base">
            Shilajit is a thick, tar-like exudate that seeps from cracks in mountain rock at high altitude.
            It has been used in Ayurvedic and Central Asian traditional medicine for over 3,000 years —
            and in the past two decades has attracted serious attention from pharmacologists studying
            its bioactive compounds.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">How Shilajit Forms</h2>
          <p>
            Shilajit is not mined like a mineral or harvested like a plant. It is the end product of
            millions of years of geological and biological pressure. Organic material — largely plant
            matter, microbial biomass, and humus — becomes compressed between rock strata in high-altitude
            mountain ranges. Under extreme pressure and temperature, this material undergoes a slow
            humification process that transforms it into a dense, resinous matrix rich in humic
            substances.
          </p>
          <p>
            During warmer months, the resin softens and migrates through fractures in the rock, emerging
            as a dark, semi-solid exudate. This is what is collected, then typically purified before sale.
            Altitude plays a role in composition: deposits above 3,000 metres tend to have higher
            concentrations of bioactive compounds because the overlying organic material is denser
            and less exposed to degradation.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Key Compounds</h2>

          <h3 className="font-semibold text-slate-800 mt-4">Fulvic Acid</h3>
          <p>
            Fulvic acid is the most researched bioactive in shilajit. It is a low-molecular-weight
            humic substance that acts as a natural electrolyte and mineral chelator — meaning it binds
            to minerals and other molecules and assists their transport across cell membranes. This is
            thought to be the mechanism behind many of shilajit's mineral-delivery properties.
            Genuine shilajit typically contains 15–20% fulvic acid by dry weight, though this varies
            significantly by source and purification method.
          </p>
          <p>
            See our full explainer:{" "}
            <Link href="/learn/fulvic-acid-shilajit" className="underline underline-offset-2 text-slate-900">
              What Is Fulvic Acid? The Primary Bioactive in Shilajit
            </Link>
            .
          </p>

          <h3 className="font-semibold text-slate-800 mt-4">Dibenzo-α-Pyrones (DBPs)</h3>
          <p>
            DBPs are a class of molecules unique to shilajit, not found in other humic substances.
            They appear to interact with mitochondrial energy production pathways and have been
            the subject of research into cognitive support. Ghosal et al. first characterized these
            compounds in a series of papers in the 1990s that remain the biochemical foundation
            for much of the subsequent shilajit literature.
          </p>

          <h3 className="font-semibold text-slate-800 mt-4">Humic Acid, Minerals &amp; Trace Elements</h3>
          <p>
            Beyond fulvic acid and DBPs, shilajit contains humic acid (higher molecular weight than
            fulvic acid, less bioavailable), plant-derived amino acids, phenolic compounds, and over
            80 ionic minerals — including iron, magnesium, zinc, copper, and selenium — in their
            ionic form, which is thought to improve absorption compared with standard mineral supplements.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What the Clinical Research Shows</h2>
          <p>
            The honest picture is this: shilajit has a robust body of in-vitro and animal research,
            a smaller body of human clinical trials, and a large volume of brand-funded studies.
            The strongest human evidence is in three areas:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Testosterone and male reproductive health.</strong> A randomised, double-blind
              placebo-controlled trial published in <em>Andrologia</em> (2016) found that 250 mg
              of purified shilajit twice daily for 90 days significantly increased total testosterone,
              free testosterone, and DHEAS in healthy male volunteers aged 45–55.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/26395129/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-slate-900"
              >
                Pandit S et al., Andrologia 2016
              </a>
              .
            </li>
            <li>
              <strong>Fatigue and physical performance.</strong> A double-blind, placebo-controlled
              study found that 200 mg of shilajit twice daily reduced markers of chronic fatigue
              syndrome and improved muscle recovery.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/22771318/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-slate-900"
              >
                Surapaneni DK et al., J Ethnopharmacol 2012
              </a>
              .
            </li>
            <li>
              <strong>Cognitive function.</strong> A systematic review and lab research suggest DBPs
              may inhibit tau protein aggregation relevant to Alzheimer's pathology, though human
              trials are still limited.{" "}
              <a
                href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-slate-900"
              >
                Carrasco-Gallardo C et al., Int J Alzheimers Dis 2012
              </a>
              .
            </li>
          </ul>
          <p>
            A comprehensive safety and efficacy review by Stohs (2014) concluded that purified
            shilajit is generally safe at studied doses, but noted that unpurified or adulterated
            products carry significant risk due to heavy metal content.{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/23876888/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-slate-900"
            >
              Stohs SJ, Phytother Res 2014
            </a>
            .
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">What the Research Does Not Support (Yet)</h2>
          <p>
            Many popular health claims — anti-ageing effects, fertility in women, liver detoxification,
            bone healing — rest on animal studies or traditional use rather than controlled human trials.
            This does not mean they are false, but buyers should weigh confidence levels appropriately.
            Traditional use over millennia is meaningful evidence, particularly for safety, but it is
            not equivalent to a randomised controlled trial for efficacy.
          </p>

          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Quality Depends on Purity and Source</h2>
          <p>
            Raw shilajit can contain heavy metals, mycotoxins, and microbial contamination.
            Authentic, purified shilajit that passes third-party laboratory testing is a different
            product from an untested resin sold on a marketplace. The composition of the final product
            is determined by three variables: the geology of the source deposit, the purification
            method, and whether that purification has been independently verified.
          </p>
          <p>
            This is precisely why a public Certificate of Analysis from a named laboratory is the
            most important thing to look for when buying.
          </p>
        </section>

        {/* CTA to database */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-medium text-slate-900">Use the database</p>
          <p className="mt-1 text-xs text-stone-600">
            Filter for products with public COAs, named testing labs, and verified heavy metal testing.
          </p>
          <Link
            href="/?coaStatus=PUBLIC&thirdPartyTested=true"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse verified products →
          </Link>
        </div>

        {/* Sources */}
        <footer className="border-t border-stone-100 pt-6">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-stone-500">
            <li>
              1. Pandit S, et al. "Clinical evaluation of purified Shilajit on testosterone levels in healthy volunteers."{" "}
              <em>Andrologia</em>. 2016;48(5):570–575.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">
                PubMed 26395129
              </a>
            </li>
            <li>
              2. Surapaneni DK, et al. "Shilajit attenuates behavioral symptoms of chronic fatigue syndrome."{" "}
              <em>J Ethnopharmacol</em>. 2012;143(1):91–99.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/22771318/" target="_blank" rel="noopener noreferrer" className="underline">
                PubMed 22771318
              </a>
            </li>
            <li>
              3. Carrasco-Gallardo C, et al. "Shilajit: A Natural Phytocomplex with Potential Procognitive Activity."{" "}
              <em>Int J Alzheimers Dis</em>. 2012;2012:674142.{" "}
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer" className="underline">
                PMC3296184
              </a>
            </li>
            <li>
              4. Stohs SJ. "Safety and efficacy of shilajit (mumie, moomiyo)."{" "}
              <em>Phytother Res</em>. 2014;28(4):475–479.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/23876888/" target="_blank" rel="noopener noreferrer" className="underline">
                PubMed 23876888
              </a>
            </li>
            <li>
              5. Agarwal SP, et al. "Shilajit: A review."{" "}
              <em>Phytother Res</em>. 2007;21(5):401–405.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/17295385/" target="_blank" rel="noopener noreferrer" className="underline">
                PubMed 17295385
              </a>
            </li>
            <li>
              6. Meena H, et al. "Shilajit: A panacea for high-altitude problems."{" "}
              <em>Int J Ayurveda Res</em>. 2010;1(1):37–40.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21364527/" target="_blank" rel="noopener noreferrer" className="underline">
                PubMed 21364527
              </a>
            </li>
          </ol>
        </footer>
      </div>

      {/* Next articles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/learn/shilajit-sourcing-regions"
          className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-stone-400 mb-1">Up next</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            Where Shilajit Comes From: Mountain Regions Compared →
          </p>
        </Link>
        <Link
          href="/learn/fulvic-acid-shilajit"
          className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-stone-400 mb-1">Related</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            What Is Fulvic Acid? The Primary Bioactive in Shilajit →
          </p>
        </Link>
      </div>
    </article>
  );
}
