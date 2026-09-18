import "dotenv/config";

import { prisma } from "@/lib/db";
import { retagBestFor } from "@/lib/best-for-tags";
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
  const retag = await retagBestFor(prisma, { apply: true });
  console.log(`Rebuilt /best tags: ${retag.changed} product(s) changed.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
