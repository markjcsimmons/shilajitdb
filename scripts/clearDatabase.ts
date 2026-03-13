import "dotenv/config";
import { prisma } from "@/lib/db";

/**
 * Clears all brands, products, evidence, listings, and related data
 * so you can start fresh (e.g. before uploading your own CSV).
 * Leaves schema and Job definitions intact.
 */
async function main() {
  console.log("Clearing database...");

  await prisma.mergeCandidate.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brandAlias.deleteMany();
  await prisma.brandCompany.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.companyEntity.deleteMany();

  console.log("Done. Brands, products, evidence, listings, and related data removed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
