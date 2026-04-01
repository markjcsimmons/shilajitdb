import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "@/lib/grading";

async function main() {
  const products = await prisma.product.findMany({
    include: {
      evidence: { select: { id: true } },
      brand: { select: { slug: true } },
    },
  });

  let updated = 0;
  for (const p of products) {
    const t = computeTransparencyGrade(
      {
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingCountryClaim: p.manufacturingCountryClaim,
        coaStatus: p.coaStatus,
      },
      { count: p.evidence.length }
    );
    const hasCoa = p.coaStatus === "PUBLIC" || p.coaStatus === "REQUEST_ONLY";
    const hasOfficialLabels =
      p.evidence.length >= 2 ||
      !!p.sourceDsldLabelId ||
      (p.evidence.length >= 1 && hasCoa);
    const q = computeQualityTier(
      {
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingCountryClaim: p.manufacturingCountryClaim,
        coaStatus: p.coaStatus,
        hasOfficialLabels,
        evidenceCount: p.evidence.length,
      },
      t
    );
    const overallGrade = computeOverallGrade({
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized ?? [],
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus,
    });
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

