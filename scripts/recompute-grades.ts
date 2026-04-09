import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "@/lib/grading";

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      brand: { select: { slug: true } },
    },
  });

  let updated = 0;
  for (const p of products) {
    const productForGrading = {
      form: p.form,
      coaStatus: p.coaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };
    const t = computeTransparencyGrade(productForGrading);
    const q = computeQualityTier(productForGrading);
    const overallGrade = computeOverallGrade(productForGrading);
    await prisma.product.update({
      where: { id: p.id },
      data: { transparencyGrade: t.grade, qualityTier: q.tier, overallGrade },
    });
    updated += 1;
  }

  console.log(`Recomputed grades for ${updated} products.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
