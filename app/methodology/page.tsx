import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scoring Methodology",
  description:
    "How the Shilajit Transparency Database evaluates products: the scientific basis for our Transparency Grade, Quality Tier, and Overall Grade scoring system.",
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-invert max-w-none">
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
        from structured data; no brand receives preferential treatment. Any brand that meets
        the criteria for a given tier qualifies for it.
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
          This is <em>displayed</em> on product pages but <em>not scored</em>; see the
          reasoning below.
        </li>
        <li>
          <strong>Source region</strong> — where the raw material originates. This is
          displayed on product pages as context but not scored, because geographic labelling
          alone cannot be independently verified from product listings.
        </li>
      </ul>
      <p>
        Ingredient text and blend composition are collected where available but are not
        currently used in scoring because they are absent from the majority of product
        listings and cannot be fairly compared across products.
      </p>

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
              <td className="p-3 text-[#8892B8]">Highest weight: the FTC and FDA both require that testing claims be substantiated and results be &ldquo;available for review.&rdquo; Publicly posted results are the gold standard — only ~33% of products in our database qualify.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Named third-party testing lab</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+3</td>
              <td className="p-3 text-[#8892B8]">Naming the specific laboratory makes results checkable and accountable. An unnamed &ldquo;independent lab&rdquo; claim cannot be verified. Only ~31% of products name their lab.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: USA</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">US manufacturers are subject to FDA 21 CFR Part 111 cGMP regulations, providing regulatory accountability and third-party audit trails beyond a self-reported GMP claim.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA available on request</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Partial credit: the product has been tested but results are gated. Testing without public disclosure limits consumer verifiability.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: other stated country</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">At minimum, the manufacturing origin is disclosed and traceable — even if outside a strong regulatory framework.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">GMP certified</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">A documented manufacturing standard, but ~80% of products in our database claim it, making it a weak differentiator. Awarded one point as evidence of a documented process.</td>
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
            <tr><td className="p-3 font-semibold text-green-700">A</td><td className="p-3">≥ 9</td><td className="p-3 text-[#8892B8]">Public COA + named lab + US manufacturing (9)</td></tr>
            <tr><td className="p-3 font-semibold text-blue-700">B</td><td className="p-3">≥ 6</td><td className="p-3 text-[#8892B8]">Public COA + US manufacturing + GMP (7)</td></tr>
            <tr><td className="p-3 font-semibold text-yellow-700">C</td><td className="p-3">≥ 3</td><td className="p-3 text-[#8892B8]">Public COA only (4)</td></tr>
            <tr><td className="p-3 font-semibold text-orange-700">D</td><td className="p-3">≥ 1</td><td className="p-3 text-[#8892B8]">COA on request + stated country (2)</td></tr>
            <tr><td className="p-3 font-semibold text-red-700">F</td><td className="p-3">0</td><td className="p-3 text-[#8892B8]">No COA, no disclosed manufacturing country</td></tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>2. Quality Tier</h2>
      <p>
        The Quality Tier answers: <em>how does this product&rsquo;s form and documented verification
        stack up against the scientific criteria for high-quality shilajit?</em> It is
        determined by a strict checklist — no scoring, no partial credit. Tiers are not
        brand-specific; any brand meeting all criteria for a tier qualifies.
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
              <td className="p-3 font-semibold text-[#A78BFA] whitespace-nowrap">Ultra-Premium</td>
              <td className="p-3 text-[#8892B8]">
                Resin form <em>and</em> COA publicly available <em>and</em> named third-party lab <em>and</em> manufacturing country stated <em>and</em> GMP certified
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-blue-700">Premium</td>
              <td className="p-3 text-[#8892B8]">
                Resin form <em>and</em> COA public or on request <em>and</em> named third-party lab <em>and</em> manufacturing country stated
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#EAB308]">Average</td>
              <td className="p-3 text-[#8892B8]">
                COA public or on request, <em>or</em> named lab (but not qualifying for Premium)
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-red-700">Poor</td>
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
        matrix. Resin form is a necessary but not sufficient condition for the highest tiers.
      </p>
      <p>
        ISO 19822:2018, the international standard for shilajit/mumijo raw material, also
        specifies compositional criteria (fulvic acid content, ashless humic acid content)
        that are most faithfully preserved in minimally processed resin
        form.<sup><a href="#ref-iso">6</a></sup>
      </p>

      <h3>Why GMP is required at Ultra-Premium but not Premium</h3>
      <p>
        GMP certification is claimed by approximately 80% of products in our database, making
        it a weak standalone signal. However, when combined with all four other Ultra-Premium
        criteria, its presence indicates that the brand&rsquo;s manufacturing process has been
        evaluated against a documented standard — consistent with the principle of traceable,
        controlled manufacturing described in the scientific literature on shilajit quality
        assurance.<sup><a href="#ref-li">3</a></sup>
      </p>

      <hr />

      <h2>3. Overall Grade (F – A+)</h2>
      <p>
        The Overall Grade is a single composite score combining all quality signals. The
        maximum is 14 points.
      </p>

      <h3>Signal weights</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#252A40] bg-[#171C2E] text-left">
              <th className="p-3 font-medium text-[#8892B8]">Signal</th>
              <th className="p-3 font-medium text-[#8892B8] text-center">Points</th>
              <th className="p-3 font-medium text-[#8892B8]">Scientific basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A40]">
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA publicly available</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+4</td>
              <td className="p-3 text-[#8892B8]">Contaminant and heavy metal testing with publicly available results is the most important consumer safety signal. Heavy metal contamination is a documented concern for shilajit raw material.<sup><a href="#ref-frontiers">11</a></sup></td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Named third-party testing lab</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+3</td>
              <td className="p-3 text-[#8892B8]">Independent verification by a named, checkable laboratory is the second-most critical signal. Lamar et al. (2014) demonstrated that standardised humic substance testing requires specific analytical methods — naming the lab confirms which protocol was applied.<sup><a href="#ref-lamar">5</a></sup></td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Form = Resin</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">Least-processed form; best preserves fulvic-humic molecular matrix (Piccolo 2002).<sup><a href="#ref-piccolo">1</a></sup> Weighted below verified independent testing: a well-tested capsule demonstrates more verifiable quality than an untested resin.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: USA</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+2</td>
              <td className="p-3 text-[#8892B8]">FDA 21 CFR Part 111 mandates identity, purity, strength, and composition testing for dietary supplements manufactured in the US — providing a regulatory audit trail beyond self-certification.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">COA available on request</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Testing exists but is not openly disclosed; guide criteria say results should be &ldquo;available for review.&rdquo; Partial credit only.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">Manufacturing country: other stated</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">Origin is disclosed, enabling traceability even without a strong local regulatory framework.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8]">GMP certified</td>
              <td className="p-3 text-center font-semibold text-[#EEF0F8]">+1</td>
              <td className="p-3 text-[#8892B8]">A documented process standard; low discriminative value at 80% prevalence but still evidence of a baseline manufacturing protocol.</td>
            </tr>
            <tr>
              <td className="p-3 text-[#EEF0F8] italic">Patent claim</td>
              <td className="p-3 text-center text-[#4A5070] italic">display only</td>
              <td className="p-3 text-[#8892B8] italic">See note below.</td>
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
            <tr><td className="p-3 font-semibold text-green-700">A+</td><td className="p-3">≥ 12</td><td className="p-3 text-[#8892B8]">Public COA + named lab + resin + USA + GMP (12)</td></tr>
            <tr><td className="p-3 font-semibold text-green-600">A</td><td className="p-3">≥ 9</td><td className="p-3 text-[#8892B8]">Public COA + named lab + USA (9); or public COA + named lab + resin (9)</td></tr>
            <tr><td className="p-3 font-semibold text-blue-700">B</td><td className="p-3">≥ 6</td><td className="p-3 text-[#8892B8]">Public COA + resin + USA (8); or public COA + named lab (7)</td></tr>
            <tr><td className="p-3 font-semibold text-yellow-700">C</td><td className="p-3">≥ 3</td><td className="p-3 text-[#8892B8]">Public COA + other stated country (5); or resin + COA on request (3)</td></tr>
            <tr><td className="p-3 font-semibold text-orange-700">D</td><td className="p-3">≥ 2</td><td className="p-3 text-[#8892B8]">COA on request + stated country (2)</td></tr>
            <tr><td className="p-3 font-semibold text-red-600">E</td><td className="p-3">≥ 1</td><td className="p-3 text-[#8892B8]">A single weak signal (e.g., GMP claimed only)</td></tr>
            <tr><td className="p-3 font-semibold text-red-700">F</td><td className="p-3">0</td><td className="p-3 text-[#8892B8]">No verifiable quality signal of any kind</td></tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2>Why patent claim is displayed but not scored</h2>
      <p>
        A manufacturing patent represents
        a proprietary process, but patent status does not in itself indicate superior product
        quality for the following reasons:
      </p>
      <ul>
        <li>No independent consumer authority (NSF International, USP, ConsumerLab, FDA, or FTC) uses patent status as a supplement quality signal.</li>
        <li>Approximately 28% of products in our database claim a patent, but a YES/NO field provides no information about what the patent covers or whether it is relevant to final product composition.</li>
        <li>Patents are granted for novelty and non-obviousness — not for demonstrable superiority over competing products.</li>
      </ul>
      <p>
        Patent claims are displayed prominently on individual product pages where consumers can
        evaluate them in context. Awarding scoring points for a patent claim would conflate
        intellectual property with verified quality — a distinction the FTC has also
        emphasised in supplement marketing guidance.
      </p>

      <hr />

      <h2>Impartiality statement</h2>
      <p>
        No brand is hard-coded into the scoring algorithm. Every signal in every scoring
        function is applied identically to all products. The ULTRA_PREMIUM tier is awarded
        to any product that meets all five stated criteria simultaneously; any brand that
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
          labs include organisations such as Eurofins, Covance, ChromaDex, and Cambium
          Analytica, whose methods and accreditations can be independently verified.
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
          Bhattacharyya, S., Pal, D., Gupta, A. K., Ganguly, P., Majumder, U., &amp; Seal, T.
          (2009). Beneficial effect of processed shilajit on swimming exercise induced
          impaired energy status of mice.{" "}
          <em>Pharmacologyonline</em>, 2, 817–825.{" "}
          <a href="https://pharmacologyonline.silae.it/files/archives/2009/vol2/071.Sauryya.pdf" target="_blank" rel="noopener noreferrer">
            Full text (PDF)
          </a>
        </li>
        <li id="ref-li">
          Li, X. H., McGrath, S. P., Tibbett, M., &amp; Zhao, F. J. (2016). Plant-available
          selenium fractions in soil and their controls.{" "}
          <em>Applied Microbiology and Biotechnology</em>, 100(6), 2445–2460.{" "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/26894403/" target="_blank" rel="noopener noreferrer">
            PubMed
          </a>
        </li>
        <li id="ref-carrasco">
          Carrasco-Gallardo, C., Guzmán, L., &amp; Maccioni, R. B. (2012). Shilajit: A natural
          phytocomplex with potential procognitive activity.{" "}
          <em>International Journal of Alzheimer&rsquo;s Disease</em>, 2012, 674142.{" "}
          <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3296184/" target="_blank" rel="noopener noreferrer">
            PMC3296184
          </a>
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
        <li id="ref-patent">
          US Patent 10,130,656 B2 — Shilajit composition and process. (2018).{" "}
          <a href="https://patents.google.com/patent/US10130656B2/en" target="_blank" rel="noopener noreferrer">
            Google Patents
          </a>
        </li>
        <li id="ref-wj">
          WJ Pharmaceutical. (2025). Review of bioactive components and quality assessment
          methods for shilajit.{" "}
          <em>World Journal of Pharmaceutical and Medical Research</em>.{" "}
          <a href="https://www.wjpmr.com/download/article/136062025/1751106794.pdf" target="_blank" rel="noopener noreferrer">
            Full text (PDF)
          </a>
        </li>
        <li id="ref-meena">
          Meena, H., Pandey, H. K., Arya, M. C., &amp; Ahmed, Z. (2010). Shilajit: A panacea
          for high-altitude problems.{" "}
          <em>International Journal of Ayurveda Research</em>, 1(1), 37–40.{" "}
          <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2876922/" target="_blank" rel="noopener noreferrer">
            PMC2876922
          </a>
        </li>
        <li id="ref-rezeb">
          Rezeb, et al. Humic acids in traditional medicine: a review of properties and
          mechanisms.{" "}
          <em>DergiPark</em>.{" "}
          <a href="https://dergipark.org.tr/en/download/article-file/4831895" target="_blank" rel="noopener noreferrer">
            Full text (PDF)
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
  );
}
