import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeAllGrades, GRADING_SELECT, toProductForGrading } from "@/lib/grading";

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, ...GRADING_SELECT },
  });

  let updated = 0;
  for (const { id, ...p } of products) {
    await prisma.product.update({
      where: { id },
      data: computeAllGrades(toProductForGrading(p)),
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
