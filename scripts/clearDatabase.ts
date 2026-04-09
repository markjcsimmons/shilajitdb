import "dotenv/config";
import { prisma } from "@/lib/db";

async function main() {
  console.log("Clearing database...");
  await prisma.evidence.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  console.log("Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
