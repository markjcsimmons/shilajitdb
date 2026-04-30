import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const LEARN_SLUGS = [
  "what-is-shilajit",
  "shilajit-benefits",
  "shilajit-heavy-metals",
  "how-to-read-shilajit-coa",
  "shilajit-forms-compared",
  "fulvic-acid-shilajit",
  "fake-shilajit-how-to-spot",
  "shilajit-sourcing-regions",
  "shilajit-men-vs-women",
  "shilajit-dosing-timeline",
];

const BEST_TAGS = [
  "editors-pick",
  "best-tested",
  "best-resin",
  "best-value",
  "best-capsules",
  "best-gummies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
      select: { slug: true, lastVerifiedAt: true },
      orderBy: { lastVerifiedAt: "desc" },
    }),
    prisma.brand.findMany({
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"),             changeFrequency: "daily",   priority: 1.0 },
    { url: absoluteUrl("/learn"),        changeFrequency: "weekly",  priority: 0.9 },
    { url: absoluteUrl("/methodology"),  changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"),        changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/updates"),      changeFrequency: "weekly",  priority: 0.7 },
  ];

  const learnPages: MetadataRoute.Sitemap = LEARN_SLUGS.map((slug) => ({
    url: absoluteUrl(`/learn/${slug}`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const bestPages: MetadataRoute.Sitemap = BEST_TAGS.map((tag) => ({
    url: absoluteUrl(`/best/${tag}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.slug}`),
    lastModified: p.lastVerifiedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: absoluteUrl(`/brand/${b.slug}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...learnPages,
    ...bestPages,
    ...productPages,
    ...brandPages,
  ];
}
