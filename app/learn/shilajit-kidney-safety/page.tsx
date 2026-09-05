import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "Is Shilajit Safe for Your Kidneys? Risk, Research & Who Should Avoid It",
  description:
    "Is shilajit bad for your kidneys? The real risk isn't the compound itself — it's heavy metal contamination in unpurified product. Here's what the research actually shows.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-kidney-safety") },
  openGraph: {
    title: "Is Shilajit Safe for Your Kidneys? Risk, Research & Who Should Avoid It",
    description:
      "The real kidney risk with shilajit isn't the compound itself — it's contamination in unpurified product. What the research shows and who should be cautious.",
    url: absoluteUrl("/learn/shilajit-kidney-safety"),
  },
};

export default function ShilajitKidneySafetyPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-kidney-safety"
        title="Is Shilajit Safe for Your Kidneys? Risk, Research & Who Should Avoid It"
        description="Is shilajit bad for your kidneys? The real risk isn't the compound itself — it's heavy metal contamination in unpurified product. Here's what the research actually shows."
        datePublished="2026-09-05"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Kidney Safety</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#200505] border border-[#EF4444]/30 px-3 py-1 text-xs font-medium text-[#EF4444] mb-4">
              Safety
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              Is Shilajit Safe for Your Kidneys?
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed September 2026 · 10 min read</p>
            <p className="mt-1.5 text-xs text-[#4A5070]"><Link href="/shilajit-comparison" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">Browse all graded products →</Link></p>
          </header>

          <section className="prose prose-sm prose-invert max-w-none space-y-4 text-[#8892B8] leading-relaxed">
            <p className="text-base">
              "Is shilajit bad for your kidneys?" is one of the most common questions people ask
              before buying, and it deserves a direct answer rather than a vague reassurance. Short
              version: there are two very different risks hiding inside that one question, and
              conflating them is where most of the confusion online comes from. One is about what
              shilajit's own compounds do to kidney function. The other is about what else might be
              in the jar. The second risk is the one with actual documented harm behind it — and
              it has nothing to do with shilajit itself being toxic.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What Your Kidneys Actually Do With Shilajit</h2>
            <p>
              Shilajit's primary bioactive compounds — fulvic acid and related humic substances,
              plus a mineral load of trace elements — are water-soluble and cleared through the
              kidneys like most other water-soluble supplement compounds. That clearance process
              is exactly why "does shilajit stress the kidneys" is a reasonable question to ask,
              not just a hypothetical one.
            </p>
            <p>
              The best available evidence on this specific question comes from animal research
              rather than human trials. A 2025 study in rats induced kidney injury with a
              chemotherapy drug (5-fluorouracil) and then tested whether shilajit could protect
              against the damage. Shilajit co-administration reduced oxidative stress markers and
              improved kidney tissue health compared to the untreated injury group.{" "}
              <a
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12258796/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-[#EEF0F8]"
              >
                Ezer M et al., Iran J Basic Med Sci 2025
              </a>
              . That's a genuinely useful data point, but it's worth being precise about what it
              does and doesn't show: it demonstrates shilajit didn't add to kidney injury in a
              short-term rodent injury model — and even showed a protective, antioxidant effect
              in that specific context — not that it's proven safe for long-term use in humans
              with pre-existing kidney disease. Animal-model protection against a drug-induced
              injury and human safety in chronic kidney disease are different questions.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">What the Human Research Shows</h2>
            <p>
              No published clinical trial has tested shilajit specifically for kidney safety as
              its primary endpoint — there's no study measuring creatinine or eGFR before and
              after shilajit use in people with kidney disease. What does exist is a set of
              90-day human trials that included routine safety bloodwork as part of their
              protocol, in populations without diagnosed kidney disease:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                A randomized, placebo-controlled trial gave 96 healthy men aged 45–55 purified
                shilajit (250 mg twice daily) for 90 days and reported no adverse effects over
                the study period.{" "}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/26395129/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-[#EEF0F8]"
                >
                  Pandit S et al., Andrologia 2016
                </a>
                .
              </li>
              <li>
                A separate 90-day trial in men with low sperm counts, using processed shilajit
                (100 mg twice daily), monitored biochemical safety parameters alongside the main
                fertility outcomes and reported no safety concerns.{" "}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/20078516/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-[#EEF0F8]"
                >
                  Biswas TK et al., Andrologia 2010
                </a>
                .
              </li>
            </ul>
            <p>
              A broader safety review of the shilajit literature concluded that processed shilajit,
              across the dose range studied in published trials (roughly 100–2,000 mg/day), has
              not produced significant liver, kidney, or blood toxicity signals.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/23876888/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-[#EEF0F8]"
              >
                Stohs SJ, Phytother Res 2014
              </a>
              . That's reassuring for healthy adults at studied doses — but "no dedicated renal
              safety trial was run, and no adverse signals turned up as a side effect of studying
              something else" is a meaningfully weaker claim than "proven safe for the kidneys,"
              and it says nothing about people who already have reduced kidney function.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">The Real Risk: Contamination, Not the Compound Itself</h2>
            <p>
              The kidney risk with actual documented harm behind it isn't fulvic acid or shilajit's
              other humic compounds — it's heavy metal contamination in unpurified or poorly
              purified product. Shilajit forms in direct contact with rock and soil over centuries,
              and it absorbs whatever is in that substrate, including lead, arsenic, mercury, and
              cadmium in some source regions. Cadmium in particular accumulates specifically in
              kidney tissue, with a biological half-life measured in decades.
            </p>
            <p>
              This is the same contamination risk covered in detail in{" "}
              <Link href="/learn/shilajit-heavy-metals" className="underline underline-offset-2 text-[#EEF0F8]">
                Shilajit and Heavy Metals: Safety, Testing &amp; Acceptable Levels
              </Link>
              , including the specific regulatory limits for each metal and what a clean COA
              actually needs to show. The practical point for kidney safety specifically: a product
              with a public, third-party COA showing all four heavy metals below USP &lt;232&gt;
              limits has addressed the documented risk. A product without one is an unknown, and
              "shilajit is generally safe" doesn't apply to unverified product the same way it
              applies to tested product.
            </p>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Who Should Be Cautious or Avoid Shilajit</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#EEF0F8]">Chronic kidney disease (stages 3–5), dialysis,
                or kidney transplant recipients.</strong> Reduced clearance capacity combined with
                shilajit's mineral load is a combination worth discussing with a nephrologist
                before use — not because of a documented harm signal, but because no trial has
                studied this population and the theoretical risk profile is unfavorable.
              </li>
              <li>
                <strong className="text-[#EEF0F8]">History of kidney stones.</strong> Shilajit's
                mineral content means staying well-hydrated matters more than usual, to reduce any
                theoretical risk of mineral concentration in the urinary tract.
              </li>
              <li>
                <strong className="text-[#EEF0F8]">Pregnancy and breastfeeding.</strong> No safety
                data exists for either the kidneys specifically or shilajit generally in this
                population — see the fuller contraindications list in{" "}
                <Link href="/learn/shilajit-dosing-timeline" className="underline underline-offset-2 text-[#EEF0F8]">
                  our dosing and timeline guide
                </Link>
                .
              </li>
              <li>
                <strong className="text-[#EEF0F8]">Anyone taking medications cleared by the
                kidneys.</strong> No specific shilajit-drug interaction affecting renal clearance
                has been documented, but the absence of dedicated interaction studies means this
                is worth a conversation with a physician or pharmacist rather than an assumption.
              </li>
            </ul>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">Quick Answers</h2>
            <p>
              <strong className="text-[#EEF0F8]">Does shilajit cause kidney stones?</strong> No
              trial has linked shilajit to kidney stone formation. Its mineral content is a
              theoretical consideration for people already prone to stones, not a documented cause.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">Can I take shilajit if I have kidney
              disease?</strong> Talk to a nephrologist first. No trial has tested shilajit in
              people with chronic kidney disease, so there's no dose or safety data specific to
              that population to rely on.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">Does shilajit affect creatinine or eGFR
              levels?</strong> No published trial has measured this directly. The 90-day human
              trials that exist reported no adverse events overall, but none used kidney function
              as a primary or dedicated outcome.
            </p>
            <p>
              <strong className="text-[#EEF0F8]">Is the kidney risk from shilajit itself or from
              contamination?</strong> Based on the available evidence, contamination. Heavy metals
              in unpurified product are the documented risk; a public, third-party COA is how you
              rule it out —{" "}
              <Link href="/learn/how-to-read-shilajit-coa" className="underline underline-offset-2 text-[#EEF0F8]">
                here's how to read one
              </Link>
              .
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Filter for heavy-metals-tested products</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Use our database to find products where heavy metal testing is confirmed with public,
              numeric COA results — the single biggest lever on kidney-related risk.
            </p>
            <Link
              href="/?heavyMetalsTested=true"
              className="mt-3 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
            >
              Browse heavy-metals-tested products →
            </Link>
            <p className="mt-3 text-xs text-[#4A5070]"><Link href="/best/best-third-party-tested" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">Best third-party tested →</Link></p>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#6E7A9A] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#8892B8]">
              <li>
                1. Ezer M, et al. "Investigation of the molecular and cellular effects of Shilajit
                on 5-fluorouracil (5-FU)-induced nephrotoxicity in rats."{" "}
                <em>Iran J Basic Med Sci</em>. 2025;28(5):565–574.{" "}
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12258796/" target="_blank" rel="noopener noreferrer" className="underline">
                  PMC12258796
                </a>
              </li>
              <li>
                2. Pandit S, et al. "Clinical evaluation of purified Shilajit on testosterone
                levels in healthy volunteers." <em>Andrologia</em>. 2016;48(5):570–575.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/26395129/" target="_blank" rel="noopener noreferrer" className="underline">
                  PubMed 26395129
                </a>
              </li>
              <li>
                3. Biswas TK, et al. "Clinical evaluation of spermatogenic activity of processed
                Shilajit in oligospermia." <em>Andrologia</em>. 2010;42(1):48–56.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/20078516/" target="_blank" rel="noopener noreferrer" className="underline">
                  PubMed 20078516
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
                5. US Pharmacopeia. Elemental Impurities — Limits, General Chapter &lt;232&gt;.{" "}
                <a href="https://www.usp.org/" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/shilajit-heavy-metals" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Up next</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit and Heavy Metals: Safety, Testing &amp; Acceptable Levels →</p>
          </Link>
          <Link href="/learn/shilajit-dosing-timeline" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How Long Does Shilajit Take to Work? Dosing, Timeline &amp; Expectations →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
