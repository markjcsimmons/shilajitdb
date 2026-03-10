import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";

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
        manufacturingClarity: p.manufacturingClarity,
        coaStatus: p.coaStatus,
      },
      { count: p.evidence.length }
    );
    const q = computeQualityTier(
      {
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingClarity: p.manufacturingClarity,
        coaStatus: p.coaStatus,
        brandSlug: p.brand.slug,
        hasOfficialLabels: p.evidence.length >= 2 || !!p.sourceDsldLabelId,
      },
      t
    );
    await prisma.product.update({
      where: { id: p.id },
      data: { transparencyGrade: t.grade, qualityTier: q.tier },
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

