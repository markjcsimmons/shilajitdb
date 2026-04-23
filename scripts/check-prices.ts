import { prisma } from "../lib/db";

async function main() {
  const totalWithPrice = await prisma.listing.count({ where: { priceCents: { not: null } } });
  const total = await prisma.listing.count();
  console.log(`\nListings with price: ${totalWithPrice} / ${total}`);

  const samples = await prisma.listing.findMany({
    where: { priceCents: { not: null } },
    select: {
      priceCents: true,
      source: true,
      product: { select: { name: true, brand: { select: { name: true } } } },
    },
    orderBy: { priceCents: "asc" },
    take: 15,
  });

  console.log("\nSample listings with price (cheapest first):");
  for (const l of samples) {
    const price = `$${((l.priceCents ?? 0) / 100).toFixed(2)}`;
    console.log(`  ${price.padEnd(8)} ${l.product.brand.name} — ${l.product.name} [${l.source}]`);
  }
}

main().finally(() => prisma.$disconnect());
