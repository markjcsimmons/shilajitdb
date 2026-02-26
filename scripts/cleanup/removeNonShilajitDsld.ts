import "dotenv/config";

import { prisma } from "@/lib/db";

const TERM_PATTERNS = [
  "shilajit",
  "shilajeet",
  "mumijo",
  "mumie",
  "asphaltum",
  "mineral pitch",
] as const;

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const apply = hasFlag("--apply");

  const termOr = TERM_PATTERNS.map((t) => ({
    ingredientText: { contains: t, mode: "insensitive" as const },
  }));

  const whereNonShilajit = {
    sourceDsldLabelId: { not: null as any },
    NOT: { OR: termOr },
  };

  const totalDsld = await prisma.product.count({ where: { sourceDsldLabelId: { not: null } } });
  const nonShilajit = await prisma.product.count({ where: whereNonShilajit });

  console.log(
    JSON.stringify(
      {
        ok: true,
        apply,
        totalDsldProducts: totalDsld,
        nonShilajitDsldProductsToDelete: nonShilajit,
      },
      null,
      2
    )
  );

  if (!apply) {
    console.log('Dry run only. Re-run with "--apply" to delete.');
    return;
  }

  const deleted = await prisma.product.deleteMany({ where: whereNonShilajit });

  const remainingDsld = await prisma.product.count({ where: { sourceDsldLabelId: { not: null } } });

  console.log(
    JSON.stringify(
      {
        deletedProducts: deleted.count,
        remainingDsldProducts: remainingDsld,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

