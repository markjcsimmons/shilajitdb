import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "ShilajitDB's affiliate disclosure policy: which links may earn a commission, and how that's kept separate from product grading.",
  alternates: { canonical: absoluteUrl("/disclosure") },
  openGraph: {
    title: "Affiliate Disclosure — Shilajit Transparency Database",
    description:
      "Which links may earn a commission, and how that's kept separate from product grading.",
    url: absoluteUrl("/disclosure"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Affiliate Disclosure — Shilajit Transparency Database",
    description: "Which links may earn a commission, and how that's kept separate from product grading.",
  },
};

export default function DisclosurePage() {
  return (
    <article className="prose prose-invert max-w-3xl">
      <h1>Affiliate Disclosure</h1>

      <p>
        Some outbound purchase links on ShilajitDB are affiliate links. If you buy a product
        after clicking one of these links, ShilajitDB may earn a commission from the retailer
        or brand, at no additional cost to you. This page explains where those links appear,
        how they&rsquo;re marked, and how they&rsquo;re kept separate from product grading.
      </p>

      <hr />

      <h2>How to spot an affiliate link</h2>
      <p>
        Any link that may earn a commission is marked inline with an{" "}
        <span className="inline-flex items-center gap-1 rounded border border-[#4A3F1A] bg-[#2A2410] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#D9B23C]">
          Affiliate link
        </span>{" "}
        tag, directly next to the link itself &mdash; on the product page&rsquo;s &ldquo;Shop&rdquo;
        button, its &ldquo;Official product page&rdquo; link, and its &ldquo;Where to buy&rdquo;
        listings. Links without this tag are not affiliate links.
      </p>

      <h2>This has no effect on grading</h2>
      <p>
        Every product is scored by the same fixed formula &mdash; COA status, named-lab
        credibility, heavy metal test results, and manufacturing transparency &mdash; applied
        identically regardless of whether ShilajitDB has a commercial relationship with the
        brand. No brand receives a different formula, a manual override, or preferential
        placement in rankings because of an affiliate relationship. See our{" "}
        <Link href="/methodology">scoring methodology</Link> for how grades are calculated.
      </p>

      <h2>Why we use affiliate links</h2>
      <p>
        Affiliate commissions help fund maintaining and expanding this database. They do not
        change what a product is graded, and a low-graded product with an affiliate
        relationship still shows its actual grade.
      </p>

      <hr />

      <p className="text-sm">
        Questions about a specific link or relationship: <a href="mailto:hello@shilajitdb.com">hello@shilajitdb.com</a>
      </p>
    </article>
  );
}
