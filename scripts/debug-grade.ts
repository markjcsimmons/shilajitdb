/**
 * Debug why a brand's products reach a given grade.
 * Usage: npx tsx scripts/debug-grade.ts "Pürblack"
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade, GRADING_SELECT, overallGradeScore, toProductForGrading } from "@/lib/grading";

async function main() {
  const brandName = process.argv[2] ?? "Pürblack";
  const brand = await prisma.brand.findFirst({
    where: { name: { contains: brandName, mode: "insensitive" } },
    include: {
      products: {
        select: {
          ...GRADING_SELECT,
          id: true,
          name: true,
          sourceRegion: true,
          overallGrade: true,
          qualityTier: true,
          transparencyGrade: true,
        },
      },
    },
  });
  if (!brand) {
    console.log(`Brand not found: ${brandName}`);
    process.exit(1);
  }
  console.log(`\nBrand: ${brand.name} (slug: ${brand.slug})\nProducts: ${brand.products.length}\n`);
  for (const p of brand.products) {
    const productForGrading = toProductForGrading(p);
    const grade = computeOverallGrade(productForGrading);
    const score = overallGradeScore(productForGrading);
    const transparency = computeTransparencyGrade(productForGrading);
    const quality = computeQualityTier(productForGrading);

    console.log(`  ${p.name}`);
    console.log(`    form=${p.form} coaStatus=${p.coaStatus} mfgCountry=${p.manufacturingCountryClaim ?? "—"}`);
    console.log(`    lab=${p.thirdPartyTestingLab ?? "—"} gmp=${p.gmpCertified} patent=${p.hasPatentClaim} region=${p.sourceRegion ?? "—"}`);
    console.log(`    → Overall score=${score}/14 → grade: ${grade} (stored: ${p.overallGrade ?? "null"})`);
    console.log(`    → Transparency score=${transparency.score} → ${transparency.grade}`);
    console.log(`    → Quality tier: ${quality.tier}`);
    console.log(`    Transparency reasons:`);
    transparency.reasons.forEach((r) => console.log(`      • ${r}`));
    console.log(`    Quality reasons:`);
    quality.reasons.forEach((r) => console.log(`      • ${r}`));
    console.log();
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
