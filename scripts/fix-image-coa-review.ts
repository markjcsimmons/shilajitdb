/**
 * Corrections from reading the six image-only / scanned COAs by eye (2026-09-17).
 * scripts/audit-coa-review.ts reports these as MANUAL because they have no text layer.
 *
 * Mars was handled separately in scripts/fix-mars-coa-review.ts. Of the remaining five,
 * four were substantially correct; the findings are:
 *
 *  - Pure Indian Foods: the COA is on Pure Indian Foods Corporation letterhead, signed by
 *    their own QA Manager (Sandeep Agarwal, 5 Jul 2024). Its disclaimer says testing was done
 *    "in an independent lab" but never names one, and thirdPartyTestingLab held the brand's
 *    own name. Issuer corrected to BRAND. This lowers the grade.
 *  - Two lab names were misspelled "Labaratories" and are shown publicly on product pages.
 *  - Five coaReportDate values were month-accurate but day-wrong. None crosses the 24-month
 *    recency boundary, so no points move; precise dates matter for the COA-recency tie-break
 *    in scripts/retag-best-for.ts.
 *
 * NOT changed, deliberately: Puralis's heavyMetalsScope stays INGREDIENT. Its Eurofins report
 * is addressed to Amera Exports (the supplier) for a 230 g sample, while the retail jar is
 * 50 g, so it reads as bulk material rather than a test of the finished Puralis product.
 * Changing it to FINISHED_PRODUCT would double the heavy-metals points on a judgement call.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/fix-image-coa-review.ts
 * Apply:    ./node_modules/.bin/tsx scripts/fix-image-coa-review.ts --apply
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { GRADING_SELECT, toProductForGrading, computeAllGrades, overallGradeBreakdown } from "../lib/grading";

const prisma = new PrismaClient();

const FIXES: Record<string, Prisma.ProductUpdateInput> = {
  // Eurofins Analytical Services India, NABL TC-13580, report 15.04.2025, batch 0325046.
  "puralis-pure-himalayan-shilajit-resin": {
    coaReportDate: new Date("2025-04-15T00:00:00Z"),
  },
  // Advanced Laboratories, Salt Lake City UT, completed 3/21/2023.
  "u-s-shilajit-high-potency-liquid-extract": {
    thirdPartyTestingLab: "Advanced Laboratories",
    coaReportDate: new Date("2023-03-21T00:00:00Z"),
  },
  // Certified Laboratories, A2LA ISO 17025 cert 3034.01, batch B0425, signed Dec 2 2025.
  "pure-himalayan-shilajit-store-shilajit-resin": {
    thirdPartyTestingLab: "Certified Laboratories",
    coaReportDate: new Date("2025-12-02T00:00:00Z"),
  },
  // Certified Laboratories, batch LM445, signed Jan 11 2024.
  "pure-himalayan-shilajit-store-soft-resin-shilajit": {
    thirdPartyTestingLab: "Certified Laboratories",
    coaReportDate: new Date("2024-01-11T00:00:00Z"),
  },
  // Brand-issued: Pure Indian Foods letterhead, QA Manager signature, no lab named.
  "pure-indian-foods-best-shilajit-ever-authentic-100-pure-himalayan-high-altitude-16k-ft-black-res": {
    coaIssuer: "BRAND",
    thirdPartyTestingLab: null,
    coaReportDate: new Date("2024-07-05T00:00:00Z"),
  },
};

async function main() {
  const apply = process.argv.includes("--apply");
  let regraded = 0;

  for (const [slug, data] of Object.entries(FIXES)) {
    const p = await prisma.product.findFirst({
      where: { slug, isCanonical: true },
      select: { ...GRADING_SELECT, id: true, slug: true, overallGrade: true, qualityTier: true, transparencyGrade: true },
    });
    if (!p) { console.log(`!! ${slug}: not found\n`); continue; }

    const after = { ...toProductForGrading(p), ...(data as Record<string, unknown>) } as never;
    const grades = computeAllGrades(after);
    const moved = grades.overallGrade !== p.overallGrade || grades.qualityTier !== p.qualityTier || grades.transparencyGrade !== p.transparencyGrade;

    console.log(`${(p.overallGrade ?? "—").replace("_PLUS", "+")} ${slug.slice(0, 60)}`);
    for (const [k, v] of Object.entries(data)) {
      const was = (p as Record<string, unknown>)[k];
      const fmt = (x: unknown) => (x instanceof Date ? x.toISOString().slice(0, 10) : String(x));
      console.log(`   ${k.padEnd(21)} ${fmt(was).padEnd(22)} -> ${fmt(v)}`);
    }
    if (moved) {
      regraded++;
      console.log(`   REGRADE  ${overallGradeBreakdown(toProductForGrading(p)).score}/14 -> ${overallGradeBreakdown(after).score}/14`);
      console.log(`            overall ${p.overallGrade} -> ${grades.overallGrade} · tier ${p.qualityTier} -> ${grades.qualityTier} · transp ${p.transparencyGrade} -> ${grades.transparencyGrade}`);
    } else {
      console.log("   grade unchanged");
    }
    console.log("");

    if (apply) await prisma.product.update({ where: { id: p.id }, data: { ...data, ...grades } });
  }

  console.log(`${Object.keys(FIXES).length} product(s); ${regraded} regrade(s).`);
  console.log(apply ? "Applied. Re-run scripts/retag-best-for.ts next." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
