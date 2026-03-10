/**
 * Remove brands that have zero products.
 * Use this to keep the DB shilajit-only: only brands that have at least one (shilajit) product remain.
 */
import "dotenv/config";
import { prisma } from "@/lib/db";

async function main() {
  const count = await prisma.brand.count({ where: { products: { none: {} } } });
  if (count === 0) {
    console.log("No brands with zero products. Nothing to remove.");
    await prisma.$disconnect();
    return;
  }
  await prisma.brand.deleteMany({ where: { products: { none: {} } } });
  console.log(`Removed ${count} brand(s) with no products. Database now only has brands that have at least one product.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
