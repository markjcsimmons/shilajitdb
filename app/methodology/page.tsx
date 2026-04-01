import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Shilajit Transparency Database evaluates COA availability, manufacturing claim clarity, ingredients disclosure, and evidence policy.",
  alternates: { canonical: absoluteUrl("/methodology") },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Certificate of Analysis (COA)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Certificate of Analysis (COA) is a lab report issued by a third-party testing facility that documents the composition and purity of a product. In this database we track whether a COA is publicly available, available on request, or not disclosed.",
      },
    },
    {
      "@type": "Question",
      name: "What does Ultra Premium mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ultra Premium is the highest tier in our rubric. To qualify, a product must be a pure shilajit resin with a publicly available COA, a stated country of manufacture, shilajit-only ingredients (no blends), and at least three verified evidence items on file. It is a brand-agnostic, objective standard.",
      },
    },
    {
      "@type": "Question",
      name: "How often is data verified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each product record shows a 'last verified' date indicating when the evidence was most recently confirmed. Our automated pipeline re-checks known evidence URLs on a regular schedule. If you spot an outdated claim, use the 'Report an update' link on any product page.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Transparency Grade and Quality Tier?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Transparency Grade (A–F) measures how openly a brand discloses verifiable information: COA availability, manufacturing country, ingredient details, and evidence count. The Quality Tier (Ultra Premium, Premium, Average, Poor) combines transparency signals with product-type signals (form, purity) to reflect overall product quality indicators.",
      },
    },
    {
      "@type": "Question",
      name: "Does this database make medical claims or recommend products?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. This database does not make medical claims and does not attempt to determine efficacy. It grades products solely on objective transparency and quality signals derived from publicly available or verifiable information.",
      },
    },
  ],
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1>Methodology</h1>
      <p>
        This database grades products using objective, evidence-backed signals. We do not
        make medical claims, and we do not attempt to determine efficacy.
      </p>

      <h2>Manufactured in vs sourced from vs packaged in</h2>
      <ul>
        <li>
          <strong>Manufactured in</strong>: where the product is processed/produced into its
          final form.
        </li>
        <li>
          <strong>Sourced from</strong>: where raw inputs may originate (not the same as
          manufacturing).
        </li>
        <li>
          <strong>Packaged in</strong>: where filling/labeling occurs, which may be different
          from manufacturing.
        </li>
      </ul>

      <h2>COA basics</h2>
      <p>
        A Certificate of Analysis (COA) is a lab report that can provide details about
        testing. In this database we track whether a COA is publicly available, available
        upon request, or not disclosed.
      </p>

      <h2>Transparency Grade (A–F)</h2>
      <p>
        The Transparency Grade is calculated from a checklist of disclosures and evidence,
        including COA availability, clarity of manufacturing claims, ingredient disclosure,
        and presence of multiple evidence items.
      </p>

      <h2>Quality Tier</h2>
      <p>
        The Quality Tier is rules-based and derived from transparency plus additional
        defensible signals (e.g., form and whether the product appears to be a simple
        shilajit product vs a blend). All criteria are brand-agnostic — any product meeting
        the threshold qualifies.
      </p>

      <h3>Tier criteria at a glance</h3>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="border border-slate-200 px-3 py-2 font-medium text-slate-700">Criterion</th>
              <th className="border border-slate-200 px-3 py-2 font-medium text-amber-700">Ultra Premium</th>
              <th className="border border-slate-200 px-3 py-2 font-medium text-sky-700">Premium</th>
              <th className="border border-slate-200 px-3 py-2 font-medium text-amber-900">Average</th>
              <th className="border border-slate-200 px-3 py-2 font-medium text-rose-700">Poor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Resin form", "✓", "✓", "—", "—"],
              ["COA available", "Public only", "Public or on-request", "—", "—"],
              ["Country of manufacture stated", "✓", "✓", "—", "—"],
              ["Shilajit-only ingredients", "✓", "✓", "—", "—"],
              ["Evidence items on file", "≥ 3", "≥ 2 or DSLD label", "Some", "Minimal"],
            ].map(([criterion, up, prem, avg, poor]) => (
              <tr key={criterion} className="even:bg-slate-50">
                <td className="border border-slate-200 px-3 py-2 text-slate-700">{criterion}</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-amber-800">{up}</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-sky-700">{prem}</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-slate-500">{avg}</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-slate-500">{poor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-600">
        See{" "}
        <Link href="/tier/ultra-premium" className="underline underline-offset-4">
          Ultra Premium products
        </Link>{" "}
        or{" "}
        <Link href="/best-shilajit" className="underline underline-offset-4">
          best-rated products
        </Link>{" "}
        for the current list.
      </p>

      <h2>Evidence policy</h2>
      <p>
        We show sources and a &ldquo;last verified&rdquo; date. If you see an outdated claim,
        please use the &ldquo;Report an update&rdquo; link on the product page.
      </p>

      <h2>What we don&rsquo;t measure</h2>
      <ul>
        <li>
          <strong>Efficacy</strong>: We do not evaluate whether any product works or produces
          health benefits.
        </li>
        <li>
          <strong>Taste or texture</strong>: Subjective sensory qualities are out of scope.
        </li>
        <li>
          <strong>Price or value</strong>: We track listed prices for reference but do not score
          on cost.
        </li>
        <li>
          <strong>Claims not publicly verifiable</strong>: If a brand makes a claim that cannot
          be corroborated with a public source or lab report, we do not count it.
        </li>
      </ul>

      <h2>Frequently asked questions</h2>

      <h3>What is a Certificate of Analysis (COA)?</h3>
      <p>
        A COA is a lab report issued by a third-party testing facility documenting product
        composition and purity. We track whether it is publicly available, available on request,
        or not disclosed.
      </p>

      <h3>What does Ultra Premium mean?</h3>
      <p>
        Ultra Premium is the highest tier in our rubric. It requires a pure shilajit resin with
        a <em>public</em> COA, stated country of manufacture, shilajit-only ingredients, and at
        least three verified evidence items. The criteria are entirely brand-agnostic.
      </p>

      <h3>How often is data verified?</h3>
      <p>
        Each product record shows a &ldquo;last verified&rdquo; date. Our automated pipeline
        re-checks evidence URLs on a regular schedule. Use the &ldquo;Report an update&rdquo;
        link on any product page to flag outdated information.
      </p>

      <h3>Does this database make medical claims or recommend products?</h3>
      <p>
        No. Rankings reflect objective transparency and quality signals only. Nothing here
        constitutes medical advice or a product endorsement.
      </p>
    </article>
  );
}
