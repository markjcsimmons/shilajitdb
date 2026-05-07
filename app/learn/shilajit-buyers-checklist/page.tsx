import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { ArticleSchema } from "@/components/article-schema";

export const metadata: Metadata = {
  title: "The Shilajit Buyer's Checklist: 9 Things to Verify Before You Buy",
  description:
    "Nine verifiable criteria for evaluating any shilajit product — mapped to the grading methodology used in the ShilajitDB database. Each criterion is explained with what to look for and what to watch out for.",
  alternates: { canonical: absoluteUrl("/learn/shilajit-buyers-checklist") },
  openGraph: {
    title: "The Shilajit Buyer's Checklist: 9 Things to Verify Before You Buy",
    description:
      "Nine verifiable checks to run on any shilajit product before purchase — the same criteria used to grade every product in the ShilajitDB database.",
    url: absoluteUrl("/learn/shilajit-buyers-checklist"),
  },
};

export default function BuyersChecklistPage() {
  return (
    <>
      <ArticleSchema
        slug="shilajit-buyers-checklist"
        title="The Shilajit Buyer's Checklist: 9 Things to Verify Before You Buy"
        description="Nine verifiable criteria for evaluating any shilajit product — mapped to the grading methodology used in the ShilajitDB database. Each criterion is explained with what to look for and what to watch out for."
        datePublished="2026-05-07"
      />
      <article className="space-y-6 max-w-3xl">
        <nav className="flex items-center gap-2 text-xs text-[#4A5070]">
          <Link href="/" className="hover:text-[#8892B8]">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-[#8892B8]">Learn</Link>
          <span>/</span>
          <span>Buyer&apos;s Checklist</span>
        </nav>

        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6 md:p-8 space-y-8">
          <header>
            <div className="inline-block rounded-full bg-[#160F28] border border-[#A78BFA]/30 px-3 py-1 text-xs font-medium text-[#A78BFA] mb-4">
              Buying Guide
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EEF0F8] leading-snug">
              The Shilajit Buyer&apos;s Checklist: 9 Things to Verify Before You Buy
            </h1>
            <p className="mt-3 text-sm text-[#4A5070]">Last reviewed May 2026 · 9 min read</p>
          </header>

          <section className="space-y-4 text-sm text-[#8892B8] leading-relaxed">
            <p className="text-base text-[#C8D0E8]">
              The shilajit market has almost no mandatory pre-market testing requirements in the
              United States. Brands can make broad claims with minimal accountability unless
              they have voluntarily sought third-party verification. This checklist covers the
              nine verifiable signals that separate genuinely transparent products from those
              relying on marketing copy alone — the same criteria used to grade every product
              in this database.
            </p>

            <div className="space-y-4 mt-6">

              {/* Item 1 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">1</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">A public Certificate of Analysis exists — and you can access it without contacting the brand</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  A COA is the foundational document. Without one, every other quality claim is
                  unverifiable. The distinction between &quot;publicly available&quot; and
                  &quot;available on request&quot; matters: if you have to email the brand to get it,
                  it is not truly public, and most consumers never see it.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ COA linked directly from product page or scannable QR on label</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ &quot;COA available on request&quot; or no mention of testing</p>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">2</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">The testing laboratory is named and independent</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  &quot;Third-party tested&quot; is one of the most abused phrases in the supplement
                  industry. In-house labs, unlicensed contractors, and summary certificates
                  covering multiple products all technically qualify. A COA is credible when
                  the laboratory is named and you can independently verify its existence and
                  accreditation status.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ Named lab (e.g. Eurofins, NSF, A2LA member) with ISO 17025 accreditation</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ &quot;Independent third-party laboratory&quot; with no name given</p>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">3</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">Heavy metals are tested with numeric results — not just a pass/fail stamp</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  Lead, arsenic, mercury, and cadmium should all be tested individually with
                  actual concentration values. A &quot;PASS&quot; stamp tells you the product met
                  some threshold — but you cannot verify which threshold was used or by how
                  much it passed. The specific numbers matter.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ Pb: &lt;0.5 ppm, As: &lt;1.5 ppm, Hg: &lt;0.3 ppm, Cd: &lt;0.3 ppm (or similar numeric results)</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ &quot;Heavy metals: PASS&quot; with no numeric values</p>
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">4</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">Fulvic acid percentage is reported on the finished product</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  Fulvic acid content is the primary active compound claim in shilajit. A
                  percentage is only meaningful if it refers to the finished product as sold —
                  not the raw extract used to make it. Capsule products in particular should
                  report the percentage per capsule or the mg per serving, not just the extract
                  concentration.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ Fulvic acid: 42.3% (of finished product batch #XXXXX)</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ &quot;Made with 50% fulvic acid extract&quot; — this is the extract, not the product</p>
                  </div>
                </div>
              </div>

              {/* Item 5 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">5</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">The COA references the finished product batch, not just the raw material</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  A COA for the raw shilajit extract tells you about the ingredient before
                  formulation. The product you are buying may have been diluted with fillers,
                  mixed with other ingredients, or changed in other ways since that extract
                  was tested. The COA should reference a specific batch number that you can
                  match to the lot number on your product.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ COA batch number matches lot number on product label</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ Single generic COA used across all batches, no batch number</p>
                  </div>
                </div>
              </div>

              {/* Item 6 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">6</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">Manufacturing country is publicly stated</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  US manufacturing is subject to FDA 21 CFR Part 111 GMP requirements. This
                  does not guarantee quality, but it establishes a regulatory framework with
                  inspection authority. Brands that do not disclose their manufacturing country
                  have no accountability to any known regulatory standard.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ &quot;Manufactured in the USA&quot; clearly stated on label and website</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ No manufacturing country disclosed anywhere</p>
                  </div>
                </div>
              </div>

              {/* Item 7 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">7</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">GMP certification is verifiable, not just claimed</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  &quot;GMP certified&quot; can mean an FDA-registered facility with documented
                  manufacturing controls, or it can mean the brand put a badge on their
                  website. Look for certification from a recognised body (NSF, UL, SGS, or
                  similar) rather than self-declaration.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ NSF GMP Registered, UL certified, or FDA-inspected facility with certificate number</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ &quot;GMP Certified&quot; badge with no certifying body named</p>
                  </div>
                </div>
              </div>

              {/* Item 8 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">8</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">The form factor matches your use case</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  Resin is the least processed form and the one used in most clinical studies.
                  Capsules and powders involve additional processing steps that may affect
                  bioactive composition; gummies introduce the most additives and the most
                  dilution. This does not mean capsules are ineffective, but it does mean
                  the standard of testing evidence should be higher for more processed forms.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ Resin with documented processing; or capsule with full COA covering the finished product</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ Gummy product with only an extract-level COA</p>
                  </div>
                </div>
              </div>

              {/* Item 9 */}
              <div className="rounded-lg border border-[#252A40] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-[#3D7AFF]/20 border border-[#3D7AFF]/30 flex items-center justify-center text-sm font-bold text-[#6E9FFF]">9</div>
                  <div>
                    <p className="text-sm font-semibold text-[#EEF0F8]">The COA is recent — dated within the past 24 months</p>
                  </div>
                </div>
                <p className="text-xs text-[#8892B8] leading-relaxed mb-3">
                  A COA from five years ago tells you about a batch from five years ago —
                  not about what is in the product currently being sold. Suppliers change,
                  formulations change, and contamination risk is batch-specific.
                  A brand that updates its COA regularly is demonstrating ongoing commitment
                  to testing. A brand whose public COA is undated or years old is not.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-[#052010] border border-[#22C55E]/20 p-2">
                    <p className="text-xs text-[#22C55E]">✓ COA dated within the past 12–24 months with a verifiable batch reference</p>
                  </div>
                  <div className="rounded bg-[#200505] border border-[#EF4444]/20 p-2">
                    <p className="text-xs text-[#EF4444]">✗ Undated COA, or COA more than 3 years old</p>
                  </div>
                </div>
              </div>

            </div>

            <h2 className="text-lg font-semibold text-[#EEF0F8] mt-6 mb-2">How This Maps to Our Grading</h2>
            <p>
              These nine criteria directly correspond to the signals we assess for every
              product in the ShilajitDB database. No product in our database earns a top grade
              without meeting criteria 1, 2, and 3 at minimum. Criteria 4–9 further differentiate
              products within the upper tiers.
            </p>
            <p>
              Of the 189+ products reviewed in the database, fewer than 30% meet all of criteria
              1–3. The checklist is not a high bar — it is the minimum for meaningful transparency.
            </p>
          </section>

          <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-5">
            <p className="text-sm font-medium text-[#EEF0F8]">Run this checklist on any product in the database</p>
            <p className="mt-1 text-xs text-[#8892B8]">
              Every product is assessed against these criteria. Filter by COA status and quality
              tier to find products that meet the full checklist.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/?coaStatus=PUBLIC&qualityTier=ULTRA_PREMIUM"
                className="inline-block rounded-lg bg-[#3D7AFF] px-4 py-2 text-xs font-medium text-white hover:bg-[#6E9FFF] transition-colors"
              >
                Best-tested products →
              </Link>
              <Link
                href="/methodology"
                className="inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Read our full methodology →
              </Link>
            </div>
          </div>

          <footer className="border-t border-[#252A40] pt-6">
            <h2 className="text-xs font-semibold text-[#4A5070] uppercase tracking-wider mb-3">References</h2>
            <ol className="space-y-2 text-xs text-[#4A5070]">
              <li>
                1. FDA. Dietary Supplement Labeling Guide. Chapter IV: Nutrition Labeling.{" "}
                <a href="https://www.fda.gov/food/dietary-supplements-guidance-documents-regulatory-information/dietary-supplement-labeling-guide" target="_blank" rel="noopener noreferrer" className="underline">FDA.gov</a>
              </li>
              <li>
                2. US Pharmacopeia. Dietary Supplements — General Chapter &lt;2750&gt; Manufacturing Practices for Dietary Supplements.{" "}
                <a href="https://www.usp.org/" target="_blank" rel="noopener noreferrer" className="underline">USP.org</a>
              </li>
              <li>
                3. NSF International. How the Dietary Supplement Certification Program Works.{" "}
                <a href="https://www.nsf.org/consumer-resources/articles/dietary-supplement-certification" target="_blank" rel="noopener noreferrer" className="underline">NSF.org</a>
              </li>
              <li>
                4. ISO. ISO/IEC 17025:2017 General requirements for the competence of testing and calibration laboratories.{" "}
                <a href="https://www.iso.org/standard/66912.html" target="_blank" rel="noopener noreferrer" className="underline">ISO.org</a>
              </li>
            </ol>
          </footer>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/learn/how-to-read-shilajit-coa" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">How to Read a Shilajit COA →</p>
          </Link>
          <Link href="/learn/shilajit-heavy-metals" className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:border-[#313760] hover:bg-[#171C2E] transition-all">
            <p className="text-xs text-[#4A5070] mb-1">Related</p>
            <p className="text-sm font-semibold text-[#EEF0F8] group-hover:text-[#8892B8]">Shilajit and Heavy Metals: Safety, Testing & Acceptable Levels →</p>
          </Link>
        </div>
      </article>
    </>
  );
}
