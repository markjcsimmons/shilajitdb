/**
 * Backfill the COA review fields that drive the overall grade, then recompute grades.
 *
 * Source: COA documents reviewed 2026-05 (coaNotes) and 2026-09-15 (the 16 public COA
 * links that had never been reviewed, plus the seven Pürblack Cambium Analytica reports).
 * Keys are slug prefixes; the longest matching prefix wins. Products with no match keep
 * the defaults (no verified COA), which is correct — they have no COA document on file.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/backfill-coa-review.ts
 * Apply:    ./node_modules/.bin/tsx scripts/backfill-coa-review.ts --apply
 */
import { PrismaClient, type CoaIssuer, type HeavyMetalsResult, type TestScope } from "@prisma/client";
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

const REVIEWS: Record<string, Review> = {
  "adndale-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "alcami-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2024-04-01" },
  "amu-nutrition-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "anecdote-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "based-natural-himalayan-shilajit-resin": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-02-01" },
  "based-shilajit-tablets": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-02-01" },
  "better-alt-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-05-01" },
  "better-alt-betteralt-himalayan-shilajit-capsules": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "blakbrik-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-09-01" },
  "bossko-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "chuga-shilajit-store-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "double-wood-supplements-": { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-04-01" },
  "essencraft-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2024-06-01" },
  "etta-vita-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "fristfei-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "goodliving-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "healing-shilajit-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "healthforce-shilajit": { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-02-01" },
  "herbion-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-08-01" },
  "higanbana-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-03-01" },
  "himvit-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "josh-pure-himalayan": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "key-elements-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-10-01" },
  "life-cykel-store-shilajit-gummies": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-09-01" },
  "life-cykel-store-shilajit-pure-resin": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-07-01" },
  "lotus-blooming-herbs-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "manna-vitality-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-07-01" },
  "mars-by-ghc-store-mars-himalayan": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2025-03-01" },
  "mountaindrop-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "nurojit-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "nutrotonic-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "pakshilajit-store-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "puralis-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-04-01" },
  "purblack-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-03-01" },
  "pure-himalayan-shilajit-store-himalayan-shilajit-t": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  "pure-himalayan-shilajit-store-liquid-shilajit-drop": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: false, coaReportDate: "2021-05-01" },
  "pure-himalayan-shilajit-store-shilajit-dry-drops": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-12-01" },
  "pure-himalayan-shilajit-store-shilajit-resin": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-11-01" },
  "pure-himalayan-shilajit-store-soft-resin": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-01-01" },
  "pure-himalayan-shilajit-store-solid-shilajit": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  "pure-himalayan-shilajit-store-sun-dried-liquid": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "pure-indian-foods-best-shilajit-ever": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: true, coaReportDate: null },
  "root-labs-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "INGREDIENT", labNamedOnCoa: true, microbialPanel: false, coaBatchIdentified: true, coaReportDate: "2025-05-01" },
  "sakoon-nutrition-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "sensible-needs-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "shilaheal-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "shilajit-co-pure-altai": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "shilajoy-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "stellar-health-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "sumeet-health-foods-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "sunmed-shilajit-gummies": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2024-09-01" },
  "terra-elmnt-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "u-s-shilajit-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: true, coaReportDate: "2023-03-01" },
  "vasu-ayurveda-himalayan-shilajit-resin": { coaVerified: true, coaIssuer: "MANUFACTURER", heavyMetalsResult: "PASS_FAIL", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: false, microbialPanel: true, coaBatchIdentified: false, coaReportDate: null },
  "vitaup-": { coaVerified: false, coaIssuer: null, heavyMetalsResult: null, heavyMetalsScope: null, labNamedOnCoa: false, microbialPanel: false, coaBatchIdentified: false, coaReportDate: null },
  "xara-shilajita-": { coaVerified: true, coaIssuer: "INDEPENDENT_LAB", heavyMetalsResult: "NUMERIC", heavyMetalsScope: "FINISHED_PRODUCT", labNamedOnCoa: true, microbialPanel: true, coaBatchIdentified: false, coaReportDate: "2026-02-01" },
};

function reviewFor(slug: string): Review | null {
  let best: string | null = null;
  for (const key of Object.keys(REVIEWS)) {
    if (slug.startsWith(key) && (best === null || key.length > best.length)) best = key;
  }
  return best ? REVIEWS[best] : null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { isCanonical: true },
    include: { brand: { select: { slug: true } } },
  });

  let matched = 0;
  let changed = 0;

  for (const p of products) {
    const review = reviewFor(p.slug);
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

    const forGrading = { ...p, ...(data ?? {}), brandSlug: p.brand.slug };
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
