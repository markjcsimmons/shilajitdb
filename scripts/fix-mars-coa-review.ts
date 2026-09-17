/**
 * Correct the COA review fields on Mars by GHC's Himalayan Organic Shilajit Resin, then regrade.
 *
 * The COA at its coaUrl is a manufacturer document ("Manufactured For TGHCO Health Support
 * Services Private Limited", mars-by-GHC letterhead, signed "Chemist-QC"). It names no
 * independent laboratory — Eurofins appears nowhere on it — and reports heavy metals as
 * "Complies" against a NMT 20 ppm specification rather than as concentrations. The stored
 * fields claimed an independent, named-lab COA with numeric results, which is worth 9 of its
 * 14 points and put it at A+ / ULTRA_PREMIUM.
 *
 * coaReportDate is deliberately NOT touched: that document's own dates contradict each other
 * (signed 16-09-2023, MFG 16 Sept 2025, expiry 15 Sept 2025, i.e. before manufacture).
 *
 * Grades are recomputed through GRADING_SELECT / toProductForGrading / computeAllGrades, the
 * single regrade path every other caller uses. Re-run scripts/retag-best-for.ts afterwards.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/fix-mars-coa-review.ts
 * Apply:    ./node_modules/.bin/tsx scripts/fix-mars-coa-review.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { GRADING_SELECT, toProductForGrading, computeAllGrades, overallGradeBreakdown } from "../lib/grading";

const prisma = new PrismaClient();
const SLUG = "mars-by-ghc-store-mars-himalayan-organic-shilajit-resin";

/** What the document at coaUrl actually supports. */
const CORRECTIONS = {
  coaIssuer: "MANUFACTURER",
  labNamedOnCoa: false,
  heavyMetalsResult: "PASS_FAIL",
  thirdPartyTestingLab: null,
} as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const p = await prisma.product.findFirst({
    where: { slug: SLUG, isCanonical: true },
    select: { ...GRADING_SELECT, id: true, slug: true, overallGrade: true, qualityTier: true, transparencyGrade: true, bestForTags: true },
  });
  if (!p) throw new Error(`no canonical product with slug ${SLUG}`);

  const before = toProductForGrading(p);
  const after = { ...before, ...CORRECTIONS };
  const beforeScore = overallGradeBreakdown(before).score;
  const afterBreakdown = overallGradeBreakdown(after);
  const grades = computeAllGrades(after);

  console.log(`${p.slug}\n`);
  console.log("field changes:");
  for (const [k, v] of Object.entries(CORRECTIONS)) {
    console.log(`  ${k.padEnd(22)} ${String((before as never)[k])}  ->  ${String(v)}`);
  }
  console.log(`\nscore   ${beforeScore}/14  ->  ${afterBreakdown.score}/14`);
  console.log(`overall ${p.overallGrade}  ->  ${grades.overallGrade}`);
  console.log(`tier    ${p.qualityTier}  ->  ${grades.qualityTier}`);
  console.log(`transp. ${p.transparencyGrade}  ->  ${grades.transparencyGrade}`);
  console.log("\npoints after correction:");
  for (const r of afterBreakdown.reasons) console.log(`  ${r}`);
  console.log(`\ncurrent bestForTags: ${p.bestForTags.join(", ") || "(none)"}`);
  console.log("  -> run scripts/retag-best-for.ts after applying; tags are not changed here.");

  if (apply) {
    await prisma.product.update({
      where: { id: p.id },
      data: { ...CORRECTIONS, ...grades },
    });
    console.log("\nApplied.");
  } else {
    console.log("\nDry run — pass --apply to write.");
  }
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
