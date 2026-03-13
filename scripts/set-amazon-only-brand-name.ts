/**
 * For any product that has only Amazon listing(s), set the product's brand name to match the product name.
 * If the brand is shared with other products, we find or create a dedicated brand with name = product.name
 * and assign the product to it.
 *
 * Usage: npx tsx scripts/set-amazon-only-brand-name.ts [--dryRun]
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function findOrCreateBrandWithName(productName: string): Promise<string> {
  const name = productName.trim();
  if (!name) throw new Error("Product name is empty");
  const existingByName = await prisma.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingByName) return existingByName.id;

  const baseSlug = slugify(name) || "brand";
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.brand.findUnique({ where: { slug }, select: { id: true } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
  const brand = await prisma.brand.create({
    data: { name, slug },
    select: { id: true },
  });
  return brand.id;
}

async function main() {
  const dryRun = process.argv.includes("--dryRun");

  const products = await prisma.product.findMany({
    where: { listings: { some: {} } },
    select: {
      id: true,
      name: true,
      brandId: true,
      brand: { select: { id: true, name: true, _count: { select: { products: true } } } },
      listings: { select: { source: true } },
    },
  });

  const amazonOnly = products.filter((p) => {
    if (p.listings.length === 0) return false;
    return p.listings.every((l) => l.source === "AMAZON");
  });

  console.log(`Products with only Amazon listing(s): ${amazonOnly.length}`);
  if (amazonOnly.length === 0) {
    await prisma.$disconnect();
    return;
  }

  for (const p of amazonOnly) {
    const currentBrandName = p.brand.name;
    if (currentBrandName.trim().toLowerCase() === p.name.trim().toLowerCase()) {
      console.log(`  [skip] ${p.name} — brand already "${currentBrandName}"`);
      continue;
    }
    if (dryRun) {
      console.log(`  [dry] ${p.name} — would set brand to "${p.name}" (current: ${currentBrandName})`);
      continue;
    }
    const newBrandId = await findOrCreateBrandWithName(p.name);
    if (newBrandId === p.brandId) {
      const updated = await prisma.brand.update({
        where: { id: p.brandId },
        data: { name: p.name },
        select: { name: true },
      });
      console.log(`  [updated] ${p.name} — brand name set to "${updated.name}"`);
    } else {
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId: newBrandId },
      });
      console.log(`  [moved] ${p.name} — assigned to brand "${p.name}"`);
    }
  }

  if (dryRun && amazonOnly.some((p) => p.brand.name.trim().toLowerCase() !== p.name.trim().toLowerCase())) {
    console.log("\nRun without --dryRun to apply changes.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
