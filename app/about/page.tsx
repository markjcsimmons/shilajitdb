import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why we built an independent grading database for shilajit — the market problem, what matters for quality, and how products are scored.",
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Why this database exists</h1>

      <p>
        The shilajit market has a transparency problem. Hundreds of products are sold under
        the same label with no unified quality standard, no regulatory oversight specific to
        this category, and little consistency in what that label actually contains. Products
        bearing identical claims can differ substantially in form, purity, testing, and
        biological relevance.
      </p>
      <p>
        For consumers trying to make an informed choice, this creates a difficult
        signal-to-noise problem. Price is not a reliable proxy for quality. Marketing
        language &mdash; &ldquo;Himalayan&rdquo;, &ldquo;pure&rdquo;,
        &ldquo;authentic&rdquo; &mdash; is largely unverifiable. And the most meaningful
        quality signals &mdash; independent lab testing, manufacturing transparency, country
        of origin &mdash; are rarely surfaced clearly.
      </p>

      <hr />

      <h2>Why quality varies so much</h2>

      <p>
        The economics of the supplement industry make low-quality shilajit easy to sell.
        Finished products &mdash; already powdered, encapsulated, or blended &mdash; can be
        sourced cheaply through global supply chains and private-labeled without meaningful
        involvement in sourcing, testing, or manufacturing. When brands don&rsquo;t control
        their own formulation, they are limited to whatever documentation their upstream
        suppliers provide, which is often incomplete or unverifiable.
      </p>
      <p>
        Shilajit is also genuinely complex. Its biological activity depends on preserving
        the natural fulvic&ndash;humic matrix formed over centuries in high-altitude mountain
        environments. That molecular structure is sensitive to heat, drying, and processing.
        Products in resin form &mdash; the least processed &mdash; are more likely to
        preserve it. Products in powder, tablet, or gummy form involve processing steps that
        can fragment that structure and reduce bioavailability. Yet convenient formats
        dominate the market, not necessarily effective ones.
      </p>
      <p>
        The result is a category that resembles a Wild West rather than a standardised
        supplement category &mdash; one where two products with identical labels can differ
        substantially in composition, safety, and biological relevance.
      </p>

      <hr />

      <h2>What actually matters</h2>

      <p>
        Independent researchers point to the same set of objective quality signals when
        evaluating shilajit:
      </p>
      <ul>
        <li>
          <strong>Certificate of Analysis (COA)</strong> &mdash; finished-batch testing for
          heavy metals, microbial contamination, and fulvic/humic acid content, conducted by
          an independent laboratory. A COA on raw material only, or one that cannot be
          verified, provides much weaker assurance.
        </li>
        <li>
          <strong>Named testing lab</strong> &mdash; the specific laboratory should be
          identifiable and verifiable, not a vague &ldquo;third-party tested&rdquo; claim
          with no attribution.
        </li>
        <li>
          <strong>Product form</strong> &mdash; resin is the least processed and most
          bioavailable form; powders and capsules involve processing trade-offs; tablets and
          gummies are furthest removed from the natural state.
        </li>
        <li>
          <strong>Manufacturing transparency</strong> &mdash; where and how the product is
          made, including whether the facility operates under Good Manufacturing Practice
          (GMP) standards.
        </li>
        <li>
          <strong>Country of manufacture</strong> &mdash; manufacturing in countries with
          stronger regulatory frameworks provides additional accountability and traceability.
        </li>
      </ul>
      <p>
        No single signal tells the whole story. A product can have a public COA but still
        be a heavily processed powder. A resin product may lack any testing documentation.
        The combination of signals taken together gives a clearer picture.
      </p>

      <hr />

      <h2>What this database does</h2>

      <p>
        The Shilajit Transparency Database scores every product using a consistent,
        deterministic methodology applied exclusively to publicly verifiable signals. No
        brand receives preferential treatment. Every product receives three independent
        scores:
      </p>
      <ul>
        <li>
          <strong>Transparency Grade (A&ndash;F)</strong> &mdash; how openly a brand
          documents its product, based on COA availability, lab disclosure, and sourcing
          claims.
        </li>
        <li>
          <strong>Quality Tier (Poor &rarr; Ultra Premium)</strong> &mdash; based on product
          form, third-party testing, manufacturing standards, and country of origin.
        </li>
        <li>
          <strong>Overall Grade (F &rarr; A+)</strong> &mdash; a composite score combining
          both dimensions.
        </li>
      </ul>
      <p>
        The goal is not to tell consumers what to buy. It is to surface the information
        that brands should be making easy to find &mdash; and to make clear which brands
        are and aren&rsquo;t doing that.
      </p>
      <p>
        <Link href="/methodology">See the full scoring methodology &rarr;</Link>
      </p>

      <hr />

      <h2>Contact</h2>
      <p>
        For corrections, data submissions, or press enquiries:{" "}
        <a href="mailto:hello@shilajitdb.com">hello@shilajitdb.com</a>
      </p>
    </article>
  );
}
