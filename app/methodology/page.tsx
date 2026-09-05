import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scoring Methodology",
  description:
    "How the Shilajit Transparency Database evaluates products: the scientific basis for our Transparency Grade, Quality Tier, and Overall Grade scoring system.",
  alternates: { canonical: absoluteUrl("/methodology") },
  openGraph: {
    title: "Scoring Methodology — Shilajit Transparency Database",
    description:
      "How we grade shilajit products: Transparency Grade (A–F), Quality Tier (Poor → Ultra Premium), and Overall Grade (F → A+).",
    url: absoluteUrl("/methodology"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Scoring Methodology — Shilajit Transparency Database",
    description: "How we grade shilajit products: Transparency Grade, Quality Tier, and Overall Grade explained.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does ShilajitDB grade products?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each product receives three independent scores: a Transparency Grade (A–F) based on COA availability, lab disclosure, and manufacturing claims; a Quality Tier (Poor → Ultra Premium) based on a strict checklist of six criteria; and an Overall Grade (F → A+) using a weighted 14-point score combining all quality signals.",
      },
    },
    {
      "@type": "Question",
      name: "What is an Ultra Premium shilajit product?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ultra Premium requires all six signals simultaneously: resin form, publicly available COA, named third-party testing lab, stated manufacturing country, GMP certification, and a patented manufacturing process.",
      },
    },
    {
      "@type": "Question",
      name: "What does a Public COA mean for shilajit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Public COA means a Certificate of Analysis is publicly available as a downloadable or directly linkable document from the brand. This is the gold standard for supplement transparency and earns the highest transparency score.",
      },
    },
    {
      "@type": "Question",
      name: "Why does shilajit form matter for grading?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Resin is the least-processed form of shilajit, best preserving the fulvic-humic mineral matrix. It earns the highest form score (+4 points). Capsules, powders, and gummies involve additional processing that can affect composition.",
      },
    },
    {
      "@type": "Question",
      name: "Does ShilajitDB accept payment from brands, or use affiliate links?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ShilajitDB does not accept payment for reviews, ranking placement, or grade changes, and no brand is hard-coded into the scoring algorithm — every product is scored by the same formula based on COA status, named-lab credibility, heavy metal test results, and manufacturing transparency. Separately, some outbound purchase links on the site are affiliate links, and ShilajitDB may earn a commission on qualifying purchases at no additional cost to the buyer. Affiliate relationships play no role in how a product is scored. See our affiliate disclosure page for details of which links this applies to.",
      },
    },
  ],
};

export default function MethodologyPage() {
  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
    <article className="prose prose-invert max-w-3xl">
      <h1>Scoring Methodology</h1>
      <p>
        This database grades shilajit products using objective, publicly verifiable signals.
        We do not make medical claims, and we do not assess efficacy. Our goal is to give
        consumers a clear, impartial picture of how transparently a brand documents its product
        — and how that documentation stacks up against established quality criteria in the
        scientific literature.
      </p>
      <p>
        Every product receives three independent scores: a <strong>Transparency Grade</strong>{" "}
        (A–F), a <strong>Quality Tier</strong> (Poor → Ultra-Premium), and an{" "}
        <strong>Overall Grade</strong> (F → A+). These scores are computed deterministically
        from structured data; no brand receives preferential treatment.
      </p>
      <p>
        Separately, some outbound purchase links on this site are affiliate links, and
        ShilajitDB may earn a commission on qualifying purchases at no additional cost to
        you. Affiliate relationships play no role in how a product is scored — see our{" "}
        <Link href="/disclosure">affiliate disclosure</Link> for details of which links this
        applies to.
      </p>

      <hr />

      <h2>What we measure — and what we don&rsquo;t</h2>
      <p>We only score signals we can verify from public sources:</p>
      <ul>
        <li>
          <strong>COA status</strong> — whether a Certificate of Analysis is publicly available,
          available on request, or not disclosed.
        </li>
        <li>
          <strong>Named third-party testing lab</strong> — whether the brand discloses the
          specific independent laboratory that issued the COA.
        </li>
        <li>
          <strong>Manufacturing country claim</strong> — whether the brand states where the
          product is manufactured (USA carries additional regulatory weight; any stated country
          receives partial credit for transparency).
        </li>
        <li>
          <strong>GMP certification</strong> — whether the brand claims cGMP compliance.
        </li>
        <li>
          <strong>Product form</strong> — whether the product is a minimally processed resin
          versus a capsule, powder, tablet, or blend.
        </li>
        <li>
          <strong>Patent claim</strong> — whether the brand holds a manufacturing patent.
          Patents are scored as a quality signal and required for Ultra-Premium tier.
        </li>
        <li>
          <strong>Source region</strong> — where the raw material originates. Displayed on
          product pages as context but not scored, because geographic labelling alone cannot
          be independently verified from product listings.
        </li>
      </ul>

      <hr />

      <h2>1. Transparency Grade (A–F)</h2>
      <p>
        The Transparency Grade answers: <em>how openly has this brand documented its product&rsquo;s
        safety and origin?</em> The maximum score is 11 points.
      </p>

      <h3>Signal weights</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Signal</th>
              <th className="p-3 font-medium text-[#8892B8] text-center">Points</th>
              <th className="p-3 font-medium text-[#8892B8]">Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA publicly available</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+4</td>
              <td className="p-3 text-[#8892B8]">Highest weight: publicly posted testing results are the gold standard for consumer safety. Only ~33% of products in our database qualify.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA embedded on page</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">COA visible on product page as an image — not independently downloadable or auditable, but visible to consumers.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Named third-party testing lab</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+3</td>
              <td className="p-3 text-[#8892B8]">Naming the specific laboratory makes results checkable and accountable. An unnamed &ldquo;independent lab&rdquo; claim cannot be verified. Only ~31% of products name their lab.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: USA</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">US manufacturers are subject to FDA 21 CFR Part 111 cGMP regulations, providing regulatory accountability beyond a self-reported GMP claim.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA available on request</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">The product has been tested but results are gated. Testing without public disclosure limits consumer verifiability.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: other stated</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">At minimum, the manufacturing origin is disclosed and traceable.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">GMP certified</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">A documented manufacturing standard, but ~80% of products claim it, making it a weak differentiator.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Grade thresholds (max 11 points)</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Grade</th>
              <th className="p-3 font-medium text-[#8892B8]">Score required</th>
              <th className="p-3 font-medium text-[#8892B8]">Example profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr><td className="p-3 font-semibold text-green-400">A</td><td className="p-3">≥ 9</td><td className="p-3 text-[#8892B8]">Public COA + named lab + US manufacturing (4+3+2 = 9)</td></tr>
            <tr><td className="p-3 font-semibold text-blue-400">B</td><td className="p-3">≥ 6</td><td className="p-3 text-[#8892B8]">Public COA + named lab + GMP (4+3+1 = 8)</td></tr>
            <tr><td className="p-3 font-semibold text-yellow-400">C</td><td className="p-3">≥ 3</td><td className="p-3 text-[#8892B8]">Public COA only (4)</td></tr>
            <tr><td className="p-3 font-semibold text-orange-400">D</td><td className="p-3">≥ 1</td><td className="p-3 text-[#8892B8]">COA on request + stated country (2)</td></tr>
            <tr><td className="p-3 font-semibold text-red-400">F</td><td className="p-3">0</td><td className="p-3 text-[#8892B8]">No COA, no disclosed manufacturing country</td></tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>2. Quality Tier</h2>
      <p>
        The Quality Tier answers: <em>does this product meet the verifiable criteria for
        high-quality shilajit?</em> It is determined by a strict checklist — no scoring,
        no partial credit. Any brand meeting all criteria for a tier qualifies.
      </p>

      <h3>Tier criteria</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Tier</th>
              <th className="p-3 font-medium text-[#8892B8]">All of the following must be true</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr>
              <td className="p-3 font-semibold text-[#22C55E] whitespace-nowrap">Ultra-Premium</td>
              <td className="p-3 text-[#8892B8]">
                Resin form <em>and</em> COA publicly available <em>and</em> named third-party lab <em>and</em> manufacturing country stated <em>and</em> GMP certified <em>and</em> patent claim
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#3B82F6]">Premium</td>
              <td className="p-3 text-[#8892B8]">
                COA publicly available <em>and</em> named third-party lab (any form qualifies)
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#EAB308]">Average</td>
              <td className="p-3 text-[#8892B8]">
                Some testing transparency present (COA of any type, or named lab) — but does not meet Premium criteria
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#EF4444]">Poor</td>
              <td className="p-3 text-[#8892B8]">
                No COA of any kind, and no named third-party lab
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Why resin form matters</h3>
      <p>
        Shilajit in its natural resin form requires minimal processing and, according to
        Piccolo (2002), best preserves the humic substance molecular matrix — the complex
        of fulvic acids, humic acids, and trace minerals that characterises authentic
        shilajit.<sup><a href="#ref-piccolo">1</a></sup> Capsules, powders, tablets, and
        liquid extracts undergo additional processing steps that can alter or dilute this
        matrix. Resin form is required for Ultra-Premium but not Premium, since a well-tested
        product of any form demonstrates meaningful transparency.
      </p>

      <hr />

      <h2>3. Overall Grade (F – A+)</h2>
      <p>
        The Overall Grade is a single composite score combining all quality signals. The
        maximum is 14 points. Physical quality signals (resin form, USA manufacturing, patent)
        are weighted equally with documentation signals (COA, named lab) to reflect that
        verifiable manufacturing quality matters as much as testing transparency.
      </p>

      <h3>Signal weights</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Signal</th>
              <th className="p-3 font-medium text-[#8892B8] text-center">Points</th>
              <th className="p-3 font-medium text-[#8892B8]">Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr>
              <td className="p-3 text-[#EEF0F8]">Form = Resin</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+4</td>
              <td className="p-3 text-[#8892B8]">Least-processed form; best preserves fulvic-humic molecular matrix (Piccolo 2002).<sup><a href="#ref-piccolo">1</a></sup> ISO 19822:2018 compositional criteria are most faithfully preserved in minimally processed resin.<sup><a href="#ref-iso">6</a></sup></td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: USA</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+3</td>
              <td className="p-3 text-[#8892B8]">FDA 21 CFR Part 111 mandates identity, purity, strength, and composition testing for dietary supplements manufactured in the US — providing a regulatory audit trail beyond self-certification.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Patent claim</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">A proprietary manufacturing patent signals a differentiated, documented process. Patents are granted only after review by a patent authority and represent a verifiable IP claim.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA publicly available</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">Publicly posted testing results are independently verifiable by consumers. Heavy metal contamination is a documented concern for shilajit raw material.<sup><a href="#ref-frontiers">11</a></sup></td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Named third-party testing lab</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">Independent verification by a named, checkable laboratory. Naming the lab confirms which analytical protocol was applied and makes results accountable.<sup><a href="#ref-lamar">5</a></sup></td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA embedded on page</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Visible on product page but not independently downloadable. Partial credit: consumer can see results but cannot independently audit the document.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA available on request</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Testing exists but is not openly disclosed. Partial credit only.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: other stated</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Origin is disclosed, enabling traceability even without a strong local regulatory framework.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">GMP certified</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">A documented process standard; low discriminative value at ~80% prevalence but still evidence of a baseline manufacturing protocol.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Grade thresholds (max 14 points)</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Grade</th>
              <th className="p-3 font-medium text-[#8892B8]">Score required</th>
              <th className="p-3 font-medium text-[#8892B8]">Example profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr><td className="p-3 font-semibold text-green-400">A+</td><td className="p-3">≥ 13</td><td className="p-3 text-[#8892B8]">Resin + USA + patent + public COA + named lab + GMP (4+3+2+2+2+1 = 14)</td></tr>
            <tr><td className="p-3 font-semibold text-green-300">A</td><td className="p-3">≥ 10</td><td className="p-3 text-[#8892B8]">Resin + USA + public COA + named lab + GMP (4+3+2+2+1 = 12); or non-resin with patent + USA + public COA + named lab (0+3+2+2+2 = 9... rounded up at 10)</td></tr>
            <tr><td className="p-3 font-semibold text-blue-400">B</td><td className="p-3">≥ 7</td><td className="p-3 text-[#8892B8]">Resin + public COA + named lab (4+2+2 = 8); or non-resin + USA + public COA + named lab (0+3+2+2 = 7)</td></tr>
            <tr><td className="p-3 font-semibold text-yellow-400">C</td><td className="p-3">≥ 4</td><td className="p-3 text-[#8892B8]">Public COA + other country (2+1 = 3... at least 4 needed, e.g. add GMP)</td></tr>
            <tr><td className="p-3 font-semibold text-orange-400">D</td><td className="p-3">≥ 2</td><td className="p-3 text-[#8892B8]">COA on request + stated country (1+1 = 2)</td></tr>
            <tr><td className="p-3 font-semibold text-red-300">E</td><td className="p-3">≥ 1</td><td className="p-3 text-[#8892B8]">A single weak signal (e.g. GMP claimed only)</td></tr>
            <tr><td className="p-3 font-semibold text-red-400">F</td><td className="p-3">0</td><td className="p-3 text-[#8892B8]">No verifiable quality signal of any kind</td></tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>Impartiality statement</h2>
      <p>
        No brand is hard-coded into the scoring algorithm. Every signal in every scoring
        function is applied identically to all products. The Ultra-Premium tier is awarded
        to any product that meets all six stated criteria simultaneously; any brand that
        publishes the necessary documentation qualifies.
      </p>
      <p>
        We update data as brands publish new documentation. If you believe a product&rsquo;s
        data is outdated, use the &ldquo;Report an update&rdquo; link on the product page.
      </p>

      <hr />

      <h2>Definitions</h2>
      <dl>
        <dt>Certificate of Analysis (COA)</dt>
        <dd>
          A document issued by a laboratory reporting the results of testing performed on a
          specific product lot. COAs for shilajit products typically cover heavy metals
          (lead, arsenic, cadmium, mercury), microbial contamination, and may include
          fulvic acid or humic acid content.
        </dd>
        <dt>Manufactured in vs sourced from vs packaged in</dt>
        <dd>
          <em>Manufactured in</em> — where the product is processed into its final form.{" "}
          <em>Sourced from</em> — where raw shilajit resin originates (geological source
          region). <em>Packaged in</em> — where filling and labelling occur (may differ
          from manufacturing). We score manufacturing country only, as sourcing and
          packaging country are more difficult to verify.
        </dd>
        <dt>cGMP / GMP certified</dt>
        <dd>
          Current Good Manufacturing Practice regulations (US: FDA 21 CFR Part 111)
          establish minimum standards for manufacturing, packaging, labelling, and storing
          dietary supplements. GMP certification typically involves third-party audit by
          an NSF, NPA, or similar body.
        </dd>
        <dt>Third-party testing lab</dt>
        <dd>
          A laboratory independent of the brand that performs and issues the COA. Named
          labs include organisations such as Eurofins, Cambium Analytica, Matrix Sciences,
          and Envirolab, whose methods and accreditations can be independently verified.
        </dd>
      </dl>

      <hr />

      <h2>References</h2>
      <ol>
        <li id="ref-piccolo">
          Piccolo, A. (2002). The supramolecular structure of humic substances: a novel
          understanding of humus chemistry and implications in soil science.{" "}
          <em>Advances in Agronomy</em>, 75, 57–134.{" "}
          <a href="https://www.researchgate.net/publication/222526145" target="_blank" rel="noopener noreferrer">
            ResearchGate
          </a>
        </li>
        <li id="ref-bhattacharyya">
          Bhattacharyya, S., et al. (2009). Beneficial effect of processed shilajit on
          swimming exercise induced impaired energy status of mice.{" "}
          <em>Pharmacologyonline</em>, 2, 817–825.
        </li>
        <li id="ref-lamar">
          Lamar, R. T., et al. (2014). Determination of humic substances content in agricultural
          and horticultural products.{" "}
          <em>Journal of AOAC International</em>, 97(3), 721–730.{" "}
          <a href="https://demstedpprodaue12.blob.core.windows.net/mesac-public/resources/files/5940953/ENV13090.pdf" target="_blank" rel="noopener noreferrer">
            Full text (PDF)
          </a>
        </li>
        <li id="ref-iso">
          International Organization for Standardization. (2018).{" "}
          <em>ISO 19822:2018 — Shilajit/Mumijo raw material — Requirements.</em>{" "}
          <a href="https://www.iso.org/standard/66271.html" target="_blank" rel="noopener noreferrer">
            ISO 19822:2018
          </a>
        </li>
        <li id="ref-frontiers">
          Stohs, S. J., &amp; Bagchi, D. (2020). Safety and efficacy of shilajit (mumie,
          moomiyo). <em>Frontiers in Pharmacology</em>, 11, 1–10.{" "}
          <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7041307/" target="_blank" rel="noopener noreferrer">
            PMC7041307
          </a>
        </li>
      </ol>
    </article>
    </>
  );
}
