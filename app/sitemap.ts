import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/best-shilajit`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/tier/ultra-premium`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tier/premium`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/tier/average`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/tier/poor`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${base}/brand/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...brandPages, ...productPages];
}
