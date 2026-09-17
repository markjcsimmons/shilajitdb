/**
 * Backfill the COA review fields that drive the overall grade, then recompute grades.
 *
 * Source: COA documents reviewed 2026-05 (coaNotes) and 2026-09-15 (the 16 public COA
 * links that had never been reviewed, plus the seven Pürblack Cambium Analytica reports).
 * Each review lists the exact product slugs it covers (slug prefixes were used until 2026-09-17,
 * which also caught products with no COA on file). Products not listed are left as they are.
 * A new product needs its own COA review before it is added here.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/backfill-coa-review.ts
 * Apply:    ./node_modules/.bin/tsx scripts/backfill-coa-review.ts --apply
 */
import { PrismaClient, type CoaIssuer, type HeavyMetalsResult, type ProductForm, type TestScope } from "@prisma/client";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "../lib/grading";

const prisma = new PrismaClient();

type Review = {
  coaVerified: boolean;
  coaIssuer: CoaIssuer | null;
  heavyMetalsResult: HeavyMetalsResult | null;
  heavyMetalsScope: TestScope | null;
  labNamedOnCoa: boolean;
  microbialPanel: boolean;
  coaBatchIdentified: boolean;
  coaReportDate: string | null;
};

const REVIEWS: { slugs: string[]; review: Review }[] = [
  {
    slugs: [
      "adndale-adndale-seamoss-shilajit-combo-sea-moss-and-shilajit-bundle-with-lion-s-mane-coq10-rhodi",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "alcami-pure-authentic-himalayan-shilajit-resin-alcami-elements",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2024-04-01" },
  },
  {
    slugs: [
      "amu-nutrition-authentic-benefits-of-mongolian-shilajit",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "anecdote-anecdote-himalayan-shilajit-honey-sticks",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "based-natural-himalayan-shilajit-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-02-01" },
  },
  {
    slugs: [
      "based-shilajit-tablets",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-02-01" },
  },
  {
    slugs: [
      "better-alt-cordyceps-shilajit-resin",
      "better-alt-gold-himalayan-shilajit-resin",
      "better-alt-gold-pure-shilajit-resin-gummies",
      "better-alt-gold-shilajit-honey-sticks-pack-of-2",
      "better-alt-himalayan-shilajit-gummies",
      "better-alt-pure-himalayan-shilajit-resin-pack-of-2",
      "better-alt-she-lajit-honey-sticks",
      "better-alt-shilajit-honey-sticks",
      "better-alt-shilajit-resin",
      "better-alt-shilajit-sea-moss-capsules-with-ashwagandha-black-pepper-and-fulvic-acid-120-caps",
      "better-alt-ultimate-power-up-duo-shilajit-gummies-shilajit-honey-sticks",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-05-01" },
  },
  {
    slugs: [
      "better-alt-betteralt-himalayan-shilajit-capsules",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "blakbrik-pure-himalayan-shilajit-resin-high-potency",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-09-01" },
  },
  {
    slugs: [
      "bossko-the-way-to-the-top-3200mg-pure-himalayan-shilajit-gummies-probiotics-magnesium-ashwagandh",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "chuga-shilajit-store-chuga-shilajit",
      "chuga-shilajit-store-shilajit-tablets",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "double-wood-supplements-shilajit-resin-supplement",
    ],
    review: { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-04-01" },
  },
  {
    slugs: [
      "essencraft-essencraft-pure-organic-himalayan-shilajit-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-06-01" },
  },
  {
    slugs: [
      "etta-vita-urolithin-a-complex-w-shilajit-organic-sea-moss-ashwagandha-tongkat-ali-natural-energy",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "fristfei-pure-himalayan-shilajit-gummies-for-men-women",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "goodliving-himalayan-shilajit-resin",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "healing-shilajit-pure-himalayan-shilajit-resin",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "healthforce-shilajit",
    ],
    review: { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-02-01" },
  },
  {
    slugs: [
      "herbion-herbion-naturals-himalayan-shilajit-resin-100-pure-82-fulvic-acid",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-08-01" },
  },
  {
    slugs: [
      "higanbana-himalayan-shilajit-pro-max-for-men-women",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-03-01" },
  },
  {
    slugs: [
      "himvit-pure-himalayan-organic-shilajit-resin-with-lab-report-super-high-potency-for-men-women-fu",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "josh-pure-himalayan-shilajit-resin-70-fulvic-acid",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "key-elements-organic-shilajit-gummies-with-sea-moss",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-10-01" },
  },
  {
    slugs: [
      "life-cykel-store-shilajit-gummies",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-09-01" },
  },
  {
    slugs: [
      "life-cykel-store-shilajit-pure-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-07-01" },
  },
  {
    slugs: [
      "lotus-blooming-herbs-store-authentic-shilajit-10g-genuine-himalayan-shilajit",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "manna-vitality-manna-vitality-shilajit-capsules",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-07-01" },
  },
  {
    slugs: [
      "mars-by-ghc-store-mars-himalayan-organic-shilajit-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-03-01" },
  },
  {
    slugs: [
      "mountaindrop-original-himalayan-shilajit",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "nurojit-blueberry-shilajit-60-vegan-gummies",
      "nurojit-nurojit-11-in-1-alpha-gummies",
      "nurojit-nurojit-6-in-1-shilajit-ashwagandha-mushroom-capsules",
      "nurojit-pure-shilajit-resin",
      "nurojit-she-lajit-honey-sticks",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "nutrotonic-authentic-himalayan-shilajit-drops",
      "nutrotonic-authentic-himalayan-shilajit-gummies",
      "nutrotonic-authentic-himalayan-shilajit-resin-15g",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "pakshilajit-store-himalayan-shilajit-gold-graded-resin",
      "pakshilajit-store-pakshilajit-himalayan-sundried-shilajit-drops",
      "pakshilajit-store-pakshilajit-process-sundried-himalayan-shilajit-capsules",
      "pakshilajit-store-sundried-himalayan-shilajit-gummies-organic-premium-shilajit-gummies",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "puralis-pure-himalayan-shilajit-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-04-01" },
  },
  {
    slugs: [
      "purblack-purblack-deja-brew-shilajit-resin-15-grams",
      "purblack-purblack-immunity-max-shilajit-resin-with-coated-silver-30-grams",
      "purblack-purblack-research-grade-shilajit-resin-15-grams",
      "purblack-purblack-shilajit-resin-with-true-gold-555-ppm-30-grams",
      "purblack-purblack-white-rabbit-serene-shilajit-resin-15-grams",
      "purblack-purblack-white-rabbit-slim-shilajit-resin-15-grams",
      "purblack-purblack-white-rabbit-vive-shilajit-resin-15-grams",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-03-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-himalayan-shilajit-tablets",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-liquid-shilajit-drops",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2021-05-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-shilajit-dry-drops",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-12-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-shilajit-resin",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-11-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-soft-resin-shilajit",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-01-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-solid-shilajit",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  },
  {
    slugs: [
      "pure-himalayan-shilajit-store-sun-dried-liquid-shilajit",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "pure-indian-foods-best-shilajit-ever-authentic-100-pure-himalayan-high-altitude-16k-ft-black-res",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: null },
  },
  {
    slugs: [
      "root-labs-10-in-1-alpha-shilajit-gummies",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-05-01" },
  },
  {
    slugs: [
      "sakoon-nutrition-shilajit-black-seed-oil-gummies",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "sensible-needs-pure-himalayan-shilajit-organic-resin-supplemen-78-fulvic-acid",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "shilaheal-himalayan-shilajit-resin",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "shilajit-co-pure-altai-shilajit-resin-tabs",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "shilajoy-organic-shilajit-resin-for-men-women",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "stellar-health-shilajit-matrix-ubiquinol-coq10-pqq-astaxanthin-nad-supplement-clinical-mitochond",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "sumeet-health-foods-shf-himalayan-shilajit-resin-30g-pure-organic-potent-gold-grade-himalayan-sh",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "sunmed-shilajit-gummies",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  },
  {
    slugs: [
      "terra-elmnt-100x-strength-black-shilajit-for-men-w-10-tongkat-ali-ashwagandha",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "u-s-shilajit-high-potency-liquid-extract",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2023-03-01" },
  },
  {
    slugs: [
      "vasu-ayurveda-himalayan-shilajit-resin-400mg",
    ],
    review: { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "vitaup-complex-shilajit",
      "vitaup-shilajit-gummies",
    ],
    review: { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  },
  {
    slugs: [
      "xara-shilajita-pure-shilajit-gummies-with-gifts",
    ],
    review: { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-02-01" },
  },
];

/** Products whose stored form is wrong. Form sets the grade and tier ceilings. */
const FORM_CORRECTIONS: Record<string, ProductForm> = {
  // Gummies + honey sticks bundle, stored as OTHER.
  "better-alt-ultimate-power-up-duo-shilajit-gummies-shilajit-honey-sticks": "GUMMY",
};

const REVIEW_BY_SLUG = new Map(REVIEWS.flatMap(({ slugs, review }) => slugs.map((slug) => [slug, review] as const)));

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { isCanonical: true },
    include: { brand: { select: { slug: true } } },
  });

  const known = new Set(products.map((p) => p.slug));
  for (const slug of REVIEW_BY_SLUG.keys()) {
    if (!known.has(slug)) console.warn(`Reviewed slug not found among canonical products: ${slug}`);
  }

  let matched = 0;
  let changed = 0;

  for (const p of products) {
    const review = REVIEW_BY_SLUG.get(p.slug) ?? null;
    const data = review
      ? {
          coaVerified: review.coaVerified,
          coaIssuer: review.coaIssuer,
          heavyMetalsResult: review.heavyMetalsResult,
          heavyMetalsScope: review.heavyMetalsScope,
          labNamedOnCoa: review.labNamedOnCoa,
          microbialPanel: review.microbialPanel,
          coaBatchIdentified: review.coaBatchIdentified,
          coaReportDate: review.coaReportDate ? new Date(review.coaReportDate) : null,
        }
      : null;
    if (review) matched++;
    const formFix = FORM_CORRECTIONS[p.slug];
    if (formFix && formFix !== p.form) console.log(`${p.slug}: form ${p.form} -> ${formFix}`);
    const form = formFix ?? p.form;

    const forGrading = { ...p, ...(data ?? {}), form, brandSlug: p.brand.slug };
    const overallGrade = computeOverallGrade(forGrading);
    const quality = computeQualityTier(forGrading);
    const transparency = computeTransparencyGrade(forGrading);

    const gradeChanged =
      overallGrade !== p.overallGrade ||
      quality.tier !== p.qualityTier ||
      transparency.grade !== p.transparencyGrade;
    if (gradeChanged) {
      changed++;
      console.log(
        `${p.slug}: ${p.overallGrade ?? "—"} -> ${overallGrade}, tier ${p.qualityTier} -> ${quality.tier}`,
      );
    }

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          ...(data ?? {}),
          form,
          overallGrade,
          qualityTier: quality.tier,
          transparencyGrade: transparency.grade,
        },
      });
    }
  }

  console.log(
    `\n${products.length} canonical products; ${matched} matched a reviewed COA; ${changed} grade/tier changes.`,
  );
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
