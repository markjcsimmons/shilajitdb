import crypto from "crypto";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function uniqueBrandSlugForCreate(brandName: string) {
  const base = slugify(brandName);
  const existing = await prisma.brand.findUnique({ where: { slug: base }, select: { id: true } });
  if (!existing) return base;

  // Different names can slugify to the same base; add a stable suffix.
  const hash = crypto.createHash("sha1").update(brandName).digest("hex").slice(0, 6);
  const candidate = `${base}-${hash}`;
  const existing2 = await prisma.brand.findUnique({ where: { slug: candidate }, select: { id: true } });
  if (!existing2) return candidate;

  // Extremely unlikely, but ensure uniqueness.
  for (let i = 2; i <= 50; i += 1) {
    const c = `${candidate}-${i}`;
    const ex = await prisma.brand.findUnique({ where: { slug: c }, select: { id: true } });
    if (!ex) return c;
  }
  return `${candidate}-${Date.now()}`;
}

export async function upsertBrandSafe(opts: {
  brandName: string;
  website: string | null;
  websiteDomain: string | null;
  dryRun: boolean;
}) {
  if (opts.dryRun) return { id: "dry" };

  const byName = await prisma.brand.findUnique({ where: { name: opts.brandName }, select: { id: true } });
  if (byName) {
    return await prisma.brand.update({
      where: { id: byName.id },
      data: {
        website: opts.website ?? undefined,
        websiteDomain: opts.websiteDomain ?? undefined,
      },
      select: { id: true },
    });
  }

  const slug = await uniqueBrandSlugForCreate(opts.brandName);
  return await prisma.brand.create({
    data: {
      name: opts.brandName,
      slug,
      website: opts.website,
      websiteDomain: opts.websiteDomain,
    },
    select: { id: true },
  });
}

