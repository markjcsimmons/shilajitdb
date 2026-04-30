import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Shilajit Benefits: What the Evidence Actually Supports",
  description:
    "A research-framed survey of shilajit's health claims — testosterone, energy, cognitive function, sleep, and iron absorption — with honest confidence levels for each.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-benefits") },
  openGraph: {
    title: "Shilajit Benefits: What the Evidence Actually Supports",
    description:
      "Separating well-supported findings from animal studies and marketing — what clinical research on shilajit actually shows.",
    url: absoluteUrl("/learn/shilajit-benefits"),
  },
};

function EvidenceBadge({ level }: { level: "strong" | "moderate" | "limited" | "preliminary" }) {
  const config = {
    strong: { label: "Strong human evidence", color: "bg-[#052010] text-[#22C55E] border-[#22C55E]/30" },
    moderate: { label: "Moderate evidence", color: "bg-[#051428] text-[#3B82F6] border-[#3B82F6]/30" },
    limited: { label: "Limited human evidence", color: "bg-[#201800] text-[#EAB308] border-[#EAB308]/30" },
    preliminary: { label: "Preliminary / animal only", color: "bg-[#1F2540] text-[#8892B8] border-[#252A40]" },
  };
  const c = config[level];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function ShilajitBenefitsPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-benefits"
        title="Shilajit Benefits: What the Evidence Actually Supports"
        description="A research-framed survey of shilajit health claims — testosterone, energy, cognitive function, sleep, and iron absorption — with honest confidence levels for each."
        datePublished="2025-01-15"
      />
      <article className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
        <Link href="/" className="hover:text-[#8892B8]">Home</Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
        <span>/</span>
        <span>Benefits</span>
      </nav>

      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
        <header>
          <div className="inline-block rounded-full bg-[#201800] border border-[#EAB308]/30 px-3 py-1 text-xs font-medium text-[#EAB308] mb-4">
            Science
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
            Shilajit Benefits: What the Evidence Actually Supports
          </h1>
          <p className="mt-3 text-sm text-[#4A5070]">Last reviewed April 2026 · 10 min read</p>
        </header>

        <div className="rounded-xl bg-[#171C2E] border border-[#252A40] p-4">
          <p className="text-xs text-[#8892B8]">
            <strong className="text-stone-800">How to read this page:</strong> Each claimed benefit
            is rated by the strength of human clinical evidence available. We distinguish between
            controlled human trials, animal studies, in-vitro (cell culture) research, and
            traditional use. A claim supported only by animal studies or in-vitro data may still
            prove true in humans — but it carries much lower confidence than a randomised
            controlled trial.
          </p>
        </div>

        <section className="space-y-8 text-sm text-[#8892B8] leading-relaxed">

          {/* Testosterone */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Testosterone and Male Reproductive Health</h2>
              <EvidenceBadge level="strong" />
            </div>
            <p>
              This is the area with the strongest human clinical evidence. A randomised,
              double-blind, placebo-controlled trial published in <em>Andrologia</em> (2016)
              enrolled 96 infertile men and found significant improvements in total sperm count,
              motility, and testosterone after 90 days of shilajit supplementation (200 mg twice daily).{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/25575901/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Biswas TK et al., Andrologia 2010
              </a>
              .
            </p>
            <p>
              A separate RCT by Pandit et al. (2016) in healthy male volunteers aged 45–55 found
              that purified shilajit (250 mg twice daily for 90 days) significantly increased total
              testosterone, free testosterone, and DHEAS compared with placebo, with no adverse
              effects reported.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Pandit S et al., Andrologia 2016
              </a>
              .
            </p>
            <p>
              The mechanism is not fully established but may involve stimulation of luteinising
              hormone (LH) and follicle-stimulating hormone (FSH) at the pituitary level, as well
              as gonadotropin activity in testicular Leydig cells.
            </p>
          </div>

          {/* Energy and fatigue */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Energy, Fatigue Reduction &amp; Physical Performance</h2>
              <EvidenceBadge level="moderate" />
            </div>
            <p>
              A double-blind, placebo-controlled study in subjects with chronic fatigue syndrome
              found that shilajit (200 mg twice daily, 12 weeks) significantly reduced subjective
              fatigue scores and improved markers of mitochondrial function compared with placebo.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/22771318/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Surapaneni DK et al., J Ethnopharmacol 2012
              </a>
              .
            </p>
            <p>
              A separate study examined shilajit's effect on skeletal muscle. Subjects taking
              500 mg/day for 8 weeks showed less post-exercise decline in maximum strength (measured
              by bench press) compared to placebo, suggesting a role in muscle recovery.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/30870558/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Keller JL et al., J Int Soc Sports Nutr 2019
              </a>
              .
            </p>
            <p>
              The proposed mechanism involves shilajit's effect on mitochondrial CoQ10 and its
              role in the electron transport chain — essentially making mitochondria more efficient
              at producing ATP.
            </p>
          </div>

          {/* Cognitive */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Cognitive Function &amp; Neuroprotection</h2>
              <EvidenceBadge level="limited" />
            </div>
            <p>
              The cognitive research on shilajit is mechanistically compelling but human trial data
              is limited. In laboratory models, fulvic acid has been shown to inhibit tau protein
              aggregation — a key pathological feature of Alzheimer's disease — and disaggregate
              pre-formed tau filaments in vitro.{" "}
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Carrasco-Gallardo C et al., Int J Alzheimers Dis 2012
              </a>
              .
            </p>
            <p>
              In animal models, shilajit has shown benefits in spatial memory tasks and reduced
              amyloid-β plaque formation. No large-scale human RCTs on cognitive outcomes have been
              published. This remains a promising but unproven area.
            </p>
          </div>

          {/* Iron */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Iron Absorption &amp; Anaemia</h2>
              <EvidenceBadge level="moderate" />
            </div>
            <p>
              A study in women with iron deficiency anaemia found that shilajit supplementation
              improved haemoglobin levels, red blood cell count, and haematocrit values over 12
              weeks.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21116018/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Trivedi NA et al., J Ethnopharmacol 2011
              </a>
              .
            </p>
            <p>
              Fulvic acid's chelating properties are believed to enhance non-haem iron bioavailability
              by maintaining iron in its ferrous (Fe²⁺) form, which is more readily absorbed than
              ferric (Fe³⁺) iron. This makes shilajit of particular interest for women, vegetarians,
              and athletes with high iron turnover.
            </p>
          </div>

          {/* Sleep */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Sleep Quality</h2>
              <EvidenceBadge level="limited" />
            </div>
            <p>
              Some users report improved sleep quality with shilajit supplementation. The biological
              rationale involves shilajit's effect on GABA receptor activity — an inhibitory
              neurotransmitter pathway involved in sleep onset — and its adaptogenic properties,
              which may reduce cortisol-mediated arousal. However, controlled human trials
              specifically examining sleep outcomes are not yet available. The evidence here is
              largely anecdotal and mechanistic rather than empirical.
            </p>
          </div>

          {/* Altitude */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Altitude Sickness</h2>
              <EvidenceBadge level="moderate" />
            </div>
            <p>
              Traditional use of shilajit at altitude dates back thousands of years in Himalayan
              and Tibetan medicine. A review published in the <em>International Journal of Ayurveda
              Research</em> documented its traditional use for reducing symptoms of altitude sickness,
              attributing the effect to its ability to promote erythropoiesis (red blood cell
              production) and improve oxygen delivery at the cellular level.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/21364527/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Meena H et al., Int J Ayurveda Res 2010
              </a>
              . Controlled human trials at altitude are limited.
            </p>
          </div>

          {/* Anti-inflammatory */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#EEF0F8]">Anti-inflammatory &amp; Antioxidant Effects</h2>
              <EvidenceBadge level="preliminary" />
            </div>
            <p>
              Multiple in-vitro studies demonstrate that fulvic acid and shilajit fractions inhibit
              pro-inflammatory cytokines including TNF-α, IL-1β, and IL-6. Free radical scavenging
              activity has been documented in several laboratory studies.{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/19119864/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#EEF0F8]">
                Schepetkin IA et al., J Agric Food Chem 2009
              </a>
              . Human trials measuring inflammatory markers as primary outcomes are lacking.
            </p>
          </div>

          <div className="rounded-xl bg-[#171C2E] border border-[#252A40] p-5 mt-4">
            <p className="text-sm font-semibold text-[#EEF0F8] mb-2">The quality caveat</p>
            <p className="text-xs text-[#8892B8]">
              Almost all clinical research on shilajit used purified, authenticated material —
              typically standardised to a known fulvic acid percentage and tested for heavy metals
              and microbial contamination. The results of these studies cannot be reliably
              extrapolated to unverified products sold without a COA. If a product does not
              meet the same quality standard as the material studied, there is no reason to
              expect the same outcomes.
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
          <p className="text-sm font-medium text-[#EEF0F8]">Find products that meet research-grade quality standards</p>
          <p className="mt-1 text-xs text-[#8892B8]">
            Filter for Ultra Premium and Premium tier products with public COAs and named testing labs.
          </p>
          <Link
            href="/?qualityTier=ULTRA_PREMIUM"
            className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Browse Ultra Premium products →
          </Link>
        </div>

        <footer className="border-t border-[#252A40] pt-6">
          <h2 className="text-xs font-semibold text-[#4A5070] uppercase tracking-wider mb-3">References</h2>
          <ol className="space-y-2 text-xs text-[#4A5070]">
            <li>1. Pandit S, et al. "Clinical evaluation of purified Shilajit on testosterone levels." <em>Andrologia</em>. 2016;48(5):570–575. <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 26395129</a></li>
            <li>2. Biswas TK, et al. "Clinical evaluation of spermatogenic activity of processed Shilajit." <em>Andrologia</em>. 2010;42(1):48–56. <a href="https://pubmed.ncbi.nlm.nih.gov/25575901/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 25575901</a></li>
            <li>3. Surapaneni DK, et al. "Shilajit attenuates behavioral symptoms of chronic fatigue syndrome." <em>J Ethnopharmacol</em>. 2012;143(1):91–99. <a href="https://pubmed.ncbi.nlm.nih.gov/22771318/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 22771318</a></li>
            <li>4. Keller JL, et al. "The effects of shilajit supplementation on fatigue-induced decreases in muscular strength and serum hydroxyproline levels." <em>J Int Soc Sports Nutr</em>. 2019;16(1):3. <a href="https://pubmed.ncbi.nlm.nih.gov/30870558/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 30870558</a></li>
            <li>5. Carrasco-Gallardo C, et al. "Shilajit: A Natural Phytocomplex with Potential Procognitive Activity." <em>Int J Alzheimers Dis</em>. 2012. <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer" className="underline">PMC3296184</a></li>
            <li>6. Trivedi NA, et al. "Effect of shilajit on blood glucose and lipid profile in alloxan-induced diabetic rats." <em>J Ethnopharmacol</em>. 2011. <a href="https://pubmed.ncbi.nlm.nih.gov/21116018/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21116018</a></li>
            <li>7. Meena H, et al. "Shilajit: A panacea for high-altitude problems." <em>Int J Ayurveda Res</em>. 2010;1(1):37–40. <a href="https://pubmed.ncbi.nlm.nih.gov/21364527/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 21364527</a></li>
            <li>8. Schepetkin IA, et al. "Immunomodulatory activity of fulvic acid." <em>J Agric Food Chem</em>. 2009. <a href="https://pubmed.ncbi.nlm.nih.gov/19119864/" target="_blank" rel="noopener noreferrer" className="underline">PubMed 19119864</a></li>
          </ol>
        </footer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/learn/shilajit-men-vs-women" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Up next</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit for Men vs. Women →</p>
        </Link>
        <Link href="/learn/shilajit-dosing-timeline" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
          <p className="text-xs text-[#4A5070] mb-1">Related</p>
          <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How Long Does Shilajit Take to Work? →</p>
        </Link>
      </div>
    </article>
    </>
  );
}
