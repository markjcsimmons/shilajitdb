import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn About Shilajit — Research, Guides & Buyer Education",
  description:
    "Evidence-based guides on shilajit: what it is, how to evaluate quality, how to read a COA, heavy metals safety, sourcing regions, and more.",
  alternates: { canonical: absoluteUrl("/learn") },
  openGraph: {
    title: "Learn About Shilajit — Research, Guides & Buyer Education",
    description:
      "Evidence-based guides on shilajit quality, sourcing, testing, and safety.",
    url: absoluteUrl("/learn"),
  },
};

const articles = [
  {
    slug: "what-is-shilajit",
    title: "What Is Shilajit?",
    description:
      "Formation, key compounds, and what the clinical research actually supports — separated from marketing claims.",
    tag: "Foundation",
  },
  {
    slug: "shilajit-sourcing-regions",
    title: "Where Shilajit Comes From: Mountain Regions Compared",
    description:
      "Why Himalayan origin is not the only quality signal — and how Altai, Caucasus, and other regions compare.",
    tag: "Sourcing",
  },
  {
    slug: "how-to-read-shilajit-coa",
    title: "How to Read a Shilajit COA",
    description:
      "A practical guide to interpreting a Certificate of Analysis: what panels matter, what to verify, and red flags.",
    tag: "Buying Guide",
  },
  {
    slug: "shilajit-heavy-metals",
    title: "Shilajit and Heavy Metals: Safety, Testing & Acceptable Levels",
    description:
      "Which heavy metals appear in shilajit, what safe limits look like, and how to find this information before you buy.",
    tag: "Safety",
  },
  {
    slug: "shilajit-forms-compared",
    title: "Resin vs. Capsules vs. Powder vs. Gummies: Which Form Is Best?",
    description:
      "Processing tradeoffs, bioavailability differences, and adulteration risk across shilajit product formats.",
    tag: "Buying Guide",
  },
  {
    slug: "fulvic-acid-shilajit",
    title: "What Is Fulvic Acid? The Primary Bioactive in Shilajit",
    description:
      "How fulvic acid works, why its concentration matters, and how to find it on a product's lab report.",
    tag: "Science",
  },
  {
    slug: "fake-shilajit-how-to-spot",
    title: "How to Spot Fake or Adulterated Shilajit",
    description:
      "Visual and physical tests, what lab testing reveals, and why a public COA is the most reliable verification tool.",
    tag: "Safety",
  },
  {
    slug: "shilajit-benefits",
    title: "Shilajit Benefits: What the Evidence Actually Supports",
    description:
      "A research-framed survey of testosterone, energy, cognition, sleep, and iron absorption claims — with honest caveats.",
    tag: "Science",
  },
  {
    slug: "shilajit-men-vs-women",
    title: "Shilajit for Men and Women: Are the Effects Different?",
    description:
      "Testosterone research for men; iron bioavailability and hormonal context for women. What the studies show.",
    tag: "Science",
  },
  {
    slug: "shilajit-dosing-timeline",
    title: "How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations",
    description:
      "Standard doses, how to take resin, what to expect week by week, and why product quality affects results.",
    tag: "Practical",
  },
];

const tagColors: Record<string, string> = {
  Foundation: "bg-emerald-50 text-emerald-700",
  Sourcing: "bg-sky-50 text-sky-700",
  "Buying Guide": "bg-violet-50 text-violet-700",
  Safety: "bg-rose-50 text-rose-700",
  Science: "bg-amber-50 text-amber-700",
  Practical: "bg-stone-100 text-stone-700",
};

export default function LearnIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
          <Link href="/" className="hover:text-stone-600">Home</Link>
          <span>/</span>
          <span>Learn</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Learn About Shilajit
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Evidence-based guides written for buyers — not brands. Each article references
          peer-reviewed research and links back to the database so you can act on what you learn.
        </p>
      </div>

      {/* Article grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/learn/${a.slug}`}
            className="group rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[a.tag] ?? "bg-stone-100 text-stone-600"}`}
              >
                {a.tag}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 leading-snug">
              {a.title}
            </h2>
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">{a.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
