/**
 * Every /learn article, in the order the /learn index shows them. This is the one place to register
 * a new article: the /learn index, the sitemap, /llms.txt and the homepage "last updated" stat all
 * read from here. `published` is the publish date and `updated` the last content edit (YYYY-MM-DD) —
 * `updated` feeds the sitemap's lastModified; refresh it with scripts/sync-learn-updated.ts.
 */
export type LearnArticle = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  published: string;
  updated: string;
};

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "shilajit-kidney-safety",
    title: "Is Shilajit Safe for Your Kidneys?",
    description:
      "The real kidney risk isn't shilajit itself — it's heavy metal contamination in unpurified product. What the research shows and who should be cautious.",
    tag: "Safety",
    published: "2026-09-05",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-erectile-dysfunction",
    title: "Shilajit and Erectile Dysfunction: What the Research Actually Shows",
    description:
      "No trial has tested shilajit alone against erectile dysfunction. What's actually been studied is testosterone and sperm count — a different question.",
    tag: "Science",
    published: "2026-09-05",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-spelling-pronunciation",
    title: "How to Spell and Pronounce Shilajit",
    description:
      "Shilijit, shiljat, shelajit — the correct spelling, how to say it, where the word comes from, and what shilajit actually is.",
    tag: "Foundation",
    published: "2026-09-01",
    updated: "2026-09-01",
  },
  {
    slug: "what-is-shilajit",
    title: "What Is Shilajit?",
    description:
      "Formation, key compounds, and what the clinical research actually supports — separated from marketing claims.",
    tag: "Foundation",
    published: "2025-01-15",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-sourcing-regions",
    title: "Where Shilajit Comes From: Mountain Regions Compared",
    description:
      "Why Himalayan origin is not the only quality signal — and how Altai, Caucasus, and other regions compare.",
    tag: "Sourcing",
    published: "2025-01-15",
    updated: "2026-05-14",
  },
  {
    slug: "how-to-read-shilajit-coa",
    title: "How to Read a Shilajit COA",
    description:
      "A practical guide to interpreting a Certificate of Analysis: what panels matter, what to verify, and red flags.",
    tag: "Buying Guide",
    published: "2026-05-14",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-heavy-metals",
    title: "Shilajit and Heavy Metals: Safety, Testing & Acceptable Levels",
    description:
      "Which heavy metals appear in shilajit, what safe limits look like, and how to find this information before you buy.",
    tag: "Safety",
    published: "2025-01-15",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-forms-compared",
    title: "Resin vs. Capsules vs. Powder vs. Gummies: Which Form Is Best?",
    description:
      "Processing tradeoffs, bioavailability differences, and adulteration risk across shilajit product formats.",
    tag: "Buying Guide",
    published: "2025-01-15",
    updated: "2026-09-16",
  },
  {
    slug: "fulvic-acid-shilajit",
    title: "What Is Fulvic Acid? The Primary Bioactive in Shilajit",
    description:
      "How fulvic acid works, why its concentration matters, and how to find it on a product's lab report.",
    tag: "Science",
    published: "2026-05-14",
    updated: "2026-05-14",
  },
  {
    slug: "fake-shilajit-how-to-spot",
    title: "How to Spot Fake or Adulterated Shilajit",
    description:
      "Visual and physical tests, what lab testing reveals, and why a public COA is the most reliable verification tool.",
    tag: "Safety",
    published: "2026-05-14",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-benefits",
    title: "Shilajit Benefits: What the Evidence Actually Supports",
    description:
      "A research-framed survey of testosterone, energy, cognition, sleep, and iron absorption claims — with honest caveats.",
    tag: "Science",
    published: "2025-01-15",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-men-vs-women",
    title: "Shilajit for Men and Women: Are the Effects Different?",
    description:
      "Testosterone research for men; iron bioavailability and hormonal context for women. What the studies show.",
    tag: "Science",
    published: "2025-01-15",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-benefits-for-men",
    title: "Shilajit Benefits for Men: Energy, Recovery & What to Look For",
    description:
      "Why men use shilajit, what the testosterone and recovery research supports, and how to choose a verified product.",
    tag: "Practical",
    published: "2026-07-09",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-benefits-for-women",
    title: "Benefits of Shilajit for Women: Iron, Energy & What to Look For",
    description:
      "Why women use shilajit, the iron bioavailability research behind it, and what to check before buying.",
    tag: "Practical",
    published: "2026-07-09",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-dosing-timeline",
    title: "How Long Does Shilajit Take to Work? Dosing, Timeline & Expectations",
    description:
      "Standard doses, how to take resin, what to expect week by week, and why product quality affects results.",
    tag: "Practical",
    published: "2026-05-07",
    updated: "2026-09-05",
  },
  {
    slug: "fulvic-acid-percentage-explained",
    title: "Fulvic Acid Percentage in Shilajit: How to Read and Compare COA Results",
    description:
      "What the fulvic acid number on a COA actually measures, what ranges are credible by form, and how to tell extract percentage from finished-product percentage.",
    tag: "Science",
    published: "2026-05-14",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-extraction-methods",
    title: "Shilajit Processing Methods: How Extraction Affects What's in the Jar",
    description:
      "How heat vs. low-temperature extraction, solvent use, and purification depth affect bioactive compounds — and what a COA can and cannot verify about processing claims.",
    tag: "Sourcing",
    published: "2025-01-15",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-muscle-recovery",
    title: "Shilajit for Muscle Recovery: What the Clinical Evidence Shows",
    description:
      "A research-graded review of the studies on shilajit and fatigue resistance — what was measured, what doses were used, and what remains speculative.",
    tag: "Science",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-sleep",
    title: "Shilajit for Sleep: Separating the Evidence from the Marketing",
    description:
      "An honest grading of what research supports for shilajit and sleep quality — and what is mechanistic extrapolation rather than clinical fact.",
    tag: "Science",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-endurance-athletes",
    title: "Shilajit for Endurance Athletes: What Performance Metrics to Track",
    description:
      "How to measure whether shilajit is working for endurance performance — the specific metrics, timelines, and product quality signals that matter for tested athletes.",
    tag: "Practical",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "best-time-to-take-shilajit",
    title: "Best Time to Take Shilajit: Morning, With Food, or Pre-Workout?",
    description:
      "No clinical trial has directly tested morning vs. evening dosing — so here's what the research actually supports, broken down by goal and form.",
    tag: "Usage",
    published: "2026-05-30",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-clinical-dosage",
    title: "Shilajit Dosage: What Clinical Trials Actually Used",
    description:
      "The specific doses, durations, and populations in published shilajit trials — separating research-backed guidance from manufacturer extrapolation.",
    tag: "Practical",
    published: "2026-05-07",
    updated: "2026-06-29",
  },
  {
    slug: "shilajit-buyers-checklist",
    title: "The Shilajit Buyer's Checklist: 9 Things to Verify Before You Buy",
    description:
      "Nine verifiable criteria mapped to the ShilajitDB grading methodology — what good looks like and what to watch out for on each signal.",
    tag: "Buying Guide",
    published: "2025-01-15",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-pre-workout",
    title: "Shilajit as a Pre-Workout: What the Research Supports (And What It Doesn't)",
    description:
      "Why pre-workout timing recommendations for shilajit go beyond the evidence — and how to set realistic expectations for a chronic-use supplement.",
    tag: "Practical",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-grading-explained",
    title: "Shilajit Grades Explained: What A+, A, B, C, D Mean and Why They Differ",
    description:
      "What separates an A+ grade from an A or B — the specific COA, lab, and manufacturing criteria that move a product between grades.",
    tag: "Buying Guide",
    published: "2025-01-15",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-coa-pass-fail-vs-numeric",
    title: "Pass/Fail COA vs Numeric Results: Why the Difference Matters",
    description:
      "Why a COA that says 'Pass' for heavy metals tells you far less than one with actual ppm values — and how to tell the difference.",
    tag: "Testing",
    published: "2026-05-14",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-testing-labs-compared",
    title: "Shilajit Testing Labs Compared: Eurofins, Certified Laboratories, Anresco & Others",
    description:
      "What ISO 17025 accreditation means, how the major labs differ, and why the lab name on a COA matters as much as the results.",
    tag: "Testing",
    published: "2026-05-30",
    updated: "2026-05-30",
  },
  {
    slug: "shilajit-extract-vs-resin",
    title: "Shilajit Extract vs Raw Resin: Are You Getting What You Think?",
    description:
      "How standardised extract percentages are used deceptively on labels — and what to look for in a capsule COA.",
    tag: "Buying Guide",
    published: "2025-01-15",
    updated: "2026-09-16",
  },
  {
    slug: "himalayan-shilajit-india-pakistan-nepal",
    title: "Himalayan Shilajit: India vs Pakistan vs Nepal — Does the Sub-Region Matter?",
    description:
      "The geological differences between Himalayan sub-regions, whether they affect quality, and why 'Himalayan' remains an unverifiable claim without a COA.",
    tag: "Sourcing",
    published: "2026-05-14",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-ashwagandha-combination",
    title: "Shilajit with Ashwagandha: Synergy, Evidence, and What to Watch For",
    description:
      "What the clinical evidence says for each ingredient separately, whether there is evidence for the combination, and the dosing problem in most combination products.",
    tag: "Science",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-fulvic-acid-how-much",
    title: "How Much Fulvic Acid Is Enough? Comparing Shilajit Claims Against the Evidence",
    description:
      "Why the 70%+ and 80%+ fulvic acid marketing figures are not evidence-based thresholds — and what the research actually used.",
    tag: "Science",
    published: "2026-05-07",
    updated: "2026-05-14",
  },
  {
    slug: "shilajit-gummies",
    title: "Shilajit Gummies: The Processing and Filler Problem, Explained",
    description:
      "How shilajit gummies are actually manufactured, why the format is the most processed and diluted way to take shilajit, and what to check before buying one.",
    tag: "Buying Guide",
    published: "2026-07-24",
    updated: "2026-09-16",
  },
  {
    slug: "top-rated-shilajit-brands",
    title: "Top Rated Shilajit Brands: Ranked by Lab Data, Not Reviews",
    description:
      "Most \"top 10 shilajit brands\" lists are recycled affiliate content. Here's what a top-rated brand actually needs to prove, and how the highest-graded brands stack up.",
    tag: "Buying Guide",
    published: "2026-08-01",
    updated: "2026-09-16",
  },
  {
    slug: "shilajit-honey-sticks",
    title: "Shilajit Honey Sticks: What's Actually in Them?",
    description:
      "Most shilajit honey sticks don't disclose how much shilajit is in each stick — and those that do rarely reach clinical doses. What to check before you buy.",
    tag: "Buying Guide",
    published: "2026-06-08",
    updated: "2026-09-05",
  },
  {
    slug: "shilajit-sea-moss",
    title: "Shilajit and Sea Moss: Do They Work Together?",
    description:
      "What each supplement does, what the combination claims, and why combo products raise more transparency questions than solo ones.",
    tag: "Ingredients",
    published: "2026-06-08",
    updated: "2026-09-05",
  },
];

/** Returns the most recent article publish date as a Date object. */
export function latestArticleDate(): Date {
  return new Date(LEARN_ARTICLES.reduce((latest, a) => (a.published > latest ? a.published : latest), ""));
}
