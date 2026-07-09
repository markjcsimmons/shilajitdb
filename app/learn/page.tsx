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
    slug: "shilajit-benefits-for-men",
    title: "Shilajit Benefits for Men: Energy, Recovery & What to Look For",
    description:
      "Why men use shilajit, what the testosterone and recovery research supports, and how to choose a verified product.",
    tag: "Practical",
  },
  {
    slug: "shilajit-benefits-for-women",
    title: "Benefits of Shilajit for Women: Iron, Energy & What to Look For",
    description:
      "Why women use shilajit, the iron bioavailability research behind it, and what to check before buying.",
    tag: "Practical",
  },
  {
    slug: "shilajit-dosing-timeline",
    title: "How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations",
    description:
      "Standard doses, how to take resin, what to expect week by week, and why product quality affects results.",
    tag: "Practical",
  },
  {
    slug: "fulvic-acid-percentage-explained",
    title: "Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results",
    description:
      "What the fulvic acid number on a COA actually measures, what ranges are credible by form, and how to tell extract percentage from finished-product percentage.",
    tag: "Science",
  },
  {
    slug: "shilajit-extraction-methods",
    title: "Shilajit Processing Methods: How Extraction Affects What's in the Jar",
    description:
      "How heat vs. low-temperature extraction, solvent use, and purification depth affect bioactive compounds — and what a COA can and cannot verify about processing claims.",
    tag: "Sourcing",
  },
  {
    slug: "shilajit-muscle-recovery",
    title: "Shilajit for Muscle Recovery: What the Clinical Evidence Shows",
    description:
      "A research-graded review of the studies on shilajit and fatigue resistance — what was measured, what doses were used, and what remains speculative.",
    tag: "Science",
  },
  {
    slug: "shilajit-sleep",
    title: "Shilajit for Sleep: Separating the Evidence from the Marketing",
    description:
      "An honest grading of what research supports for shilajit and sleep quality — and what is mechanistic extrapolation rather than clinical fact.",
    tag: "Science",
  },
  {
    slug: "shilajit-endurance-athletes",
    title: "Shilajit for Endurance Athletes: What Performance Metrics to Track",
    description:
      "How to measure whether shilajit is working for endurance performance — the specific metrics, timelines, and product quality signals that matter for tested athletes.",
    tag: "Practical",
  },
  {
    slug: "best-time-to-take-shilajit",
    title: "Best Time to Take Shilajit: Morning, With Food, or Pre-Workout?",
    description:
      "No clinical trial has directly tested morning vs. evening dosing — so here's what the research actually supports, broken down by goal and form.",
    tag: "Usage",
  },
  {
    slug: "shilajit-clinical-dosage",
    title: "Shilajit Dosage: What Clinical Trials Actually Used",
    description:
      "The specific doses, durations, and populations in published shilajit trials — separating research-backed guidance from manufacturer extrapolation.",
    tag: "Practical",
  },
  {
    slug: "shilajit-buyers-checklist",
    title: "The Shilajit Buyer's Checklist: 9 Things to Verify Before You Buy",
    description:
      "Nine verifiable criteria mapped to the ShilajitDB grading methodology — what good looks like and what to watch out for on each signal.",
    tag: "Buying Guide",
  },
  {
    slug: "shilajit-pre-workout",
    title: "Shilajit as a Pre-Workout: What the Research Supports (And What It Doesn't)",
    description:
      "Why pre-workout timing recommendations for shilajit go beyond the evidence — and how to set realistic expectations for a chronic-use supplement.",
    tag: "Practical",
  },
  {
    slug: "shilajit-grading-explained",
    title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
    description:
      "What separates an A+ grade from an A or B — the specific COA, lab, and manufacturing criteria that move a product between grades.",
    tag: "Buying Guide",
  },
  {
    slug: "shilajit-coa-pass-fail-vs-numeric",
    title: "Pass/Fail COA vs Numeric Results: Why the Difference Matters",
    description:
      "Why a COA that says 'Pass' for heavy metals tells you far less than one with actual ppm values — and how to tell the difference.",
    tag: "Testing",
  },
  {
    slug: "shilajit-testing-labs-compared",
    title: "Shilajit Testing Labs Compared: Eurofins, Certified Laboratories, Anresco & Others",
    description:
      "What ISO 17025 accreditation means, how the major labs differ, and why the lab name on a COA matters as much as the results.",
    tag: "Testing",
  },
  {
    slug: "shilajit-extract-vs-resin",
    title: "Shilajit Extract vs Raw Resin: Are You Getting What You Think?",
    description:
      "How standardised extract percentages are used deceptively on labels — and what to look for in a capsule COA.",
    tag: "Buying Guide",
  },
  {
    slug: "himalayan-shilajit-india-pakistan-nepal",
    title: "Himalayan Shilajit: India vs Pakistan vs Nepal — Does the Sub-Region Matter?",
    description:
      "The geological differences between Himalayan sub-regions, whether they affect quality, and why 'Himalayan' remains an unverifiable claim without a COA.",
    tag: "Sourcing",
  },
  {
    slug: "shilajit-ashwagandha-combination",
    title: "Shilajit with Ashwagandha: Synergy, Evidence, and What to Watch For",
    description:
      "What the clinical evidence says for each ingredient separately, whether there is evidence for the combination, and the dosing problem in most combination products.",
    tag: "Science",
  },
  {
    slug: "shilajit-fulvic-acid-how-much",
    title: "How Much Fulvic Acid Is Enough? Comparing Shilajit Claims Against the Evidence",
    description:
      "Why the 70%+ and 80%+ fulvic acid marketing figures are not evidence-based thresholds — and what the research actually used.",
    tag: "Science",
  },
];

const tagColors: Record<string, string> = {
  Foundation: "bg-[#052010] text-[#22C55E] border border-[#22C55E]/30",
  Sourcing: "bg-[#041828] text-[#38BDF8] border border-[#38BDF8]/30",
  "Buying Guide": "bg-[#160F28] text-[#A78BFA] border border-[#A78BFA]/30",
  Safety: "bg-[#200505] text-[#EF4444] border border-[#EF4444]/30",
  Science: "bg-[#051428] text-[#3B82F6] border border-[#3B82F6]/30",
  Practical: "bg-[#1F2540] text-[#8892B8] border border-[#252A40]",
  Testing: "bg-[#0A1628] text-[#6E9FFF] border border-[#3D7AFF]/30",
  Ingredients: "bg-[#0F1628] text-[#F59E0B] border border-[#F59E0B]/30",
};

export default function LearnIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex items-center gap-2 text-xs text-[#4A5070] mb-3">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span>/</span>
          <span>Learn</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8]">
          Learn About Shilajit
        </h1>
        <p className="mt-2 text-sm text-[#8892B8] max-w-2xl">
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
            className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:bg-[#171C2E] hover:border-[#313760] transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[a.tag] ?? "bg-[#1F2540] text-[#8892B8]"}`}
              >
                {a.tag}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-[#EEF0F8] leading-snug">
              {a.title}
            </h2>
            <p className="mt-1.5 text-xs text-[#4A5070] leading-relaxed">{a.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-[#6E9FFF] group-hover:text-[#EEF0F8] transition-colors">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
