import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Shilajit Transparency Database evaluates COA availability, manufacturing claim clarity, ingredients disclosure, and evidence policy.",
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-none">
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
        shilajit product vs a blend).
      </p>

      <h2>Evidence policy</h2>
      <p>
        We show sources and a &ldquo;last verified&rdquo; date. If you see an outdated claim,
        please use the &ldquo;Report an update&rdquo; link on the product page.
      </p>
    </article>
  );
}

