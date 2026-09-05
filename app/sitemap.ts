import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export const revalidate = 3600; // cache for 1 hour

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
  "fulvic-acid-percentage-explained",
  "shilajit-extraction-methods",
  "shilajit-muscle-recovery",
  "shilajit-sleep",
  "shilajit-endurance-athletes",
  "shilajit-clinical-dosage",
  "shilajit-buyers-checklist",
  "shilajit-pre-workout",
  "shilajit-grading-explained",
  "shilajit-coa-pass-fail-vs-numeric",
  "shilajit-testing-labs-compared",
  "shilajit-extract-vs-resin",
  "himalayan-shilajit-india-pakistan-nepal",
  "shilajit-ashwagandha-combination",
  "shilajit-fulvic-acid-how-much",
  "shilajit-gummies",
  "shilajit-honey-sticks",
  "shilajit-sea-moss",
  "shilajit-benefits-for-men",
  "shilajit-benefits-for-women",
  "top-rated-shilajit-brands",
  "shilajit-spelling-pronunciation",
  "shilajit-kidney-safety",
  "shilajit-erectile-dysfunction",
];

const BEST_TAGS = [
  "editors-pick",
  "best-tested",
  "best-resin",
  "best-value",
  "best-capsules",
  "best-gummies",
  "best-for-men",
  "best-for-women",
  "best-third-party-tested",
  "best-himalayan-shilajit",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, compareProducts, brandsWithCoa, productsWithLabData] = await Promise.all([
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" }, evidence: { some: {} } },
      select: { slug: true, lastVerifiedAt: true, _count: { select: { evidence: true } } },
      orderBy: { lastVerifiedAt: "desc" },
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    }),
    // Top 15 products for compare page pairs
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" }, overallGrade: { not: null } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      take: 15,
      select: { slug: true },
    }),
    // Brands that have at least one product with a COA URL (for lab-tests pages)
    prisma.brand.findMany({
      where: { products: { some: { isCanonical: true, coaUrl: { not: null } } } },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    }),
    // Products with any lab data (for /product/[slug]/lab-results pages)
    prisma.product.findMany({
      where: {
        isCanonical: true,
        dataCompleteness: { not: "LOW" },
        evidence: { some: {} },
        OR: [
          { coaUrl: { not: null } },
          { thirdPartyTestingLab: { not: null } },
          { heavyMetalsTested: { not: null } },
          { coaNotes: { not: null } },
        ],
      },
      select: { slug: true, lastVerifiedAt: true, _count: { select: { evidence: true } } },
      orderBy: { lastVerifiedAt: "desc" },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"),                      changeFrequency: "daily",   priority: 1.0 },
    { url: absoluteUrl("/shilajit-comparison"),   changeFrequency: "weekly",  priority: 0.9 },
    { url: absoluteUrl("/learn"),                 changeFrequency: "weekly",  priority: 0.9 },
    { url: absoluteUrl("/methodology"),           changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"),                 changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/disclosure"),            changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/updates"),               changeFrequency: "weekly",  priority: 0.7 },
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

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p._count.evidence >= 2)
    .map((p) => ({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: p.lastVerifiedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: absoluteUrl(`/brand/${b.slug}`),
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const brandLabTestsPages: MetadataRoute.Sitemap = brandsWithCoa.map((b) => ({
    url: absoluteUrl(`/brand/${b.slug}/lab-tests`),
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productLabResultsPages: MetadataRoute.Sitemap = productsWithLabData
    .filter((p) => p._count.evidence >= 2)
    .map((p) => ({
      url: absoluteUrl(`/product/${p.slug}/lab-results`),
      lastModified: p.lastVerifiedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

  // Generate all compare page pairs from top 15 products
  const comparePages: MetadataRoute.Sitemap = [];
  for (let i = 0; i < compareProducts.length; i++) {
    for (let j = i + 1; j < compareProducts.length; j++) {
      const [a, b] = [compareProducts[i].slug, compareProducts[j].slug].sort();
      comparePages.push({
        url: absoluteUrl(`/compare/${a}-vs-${b}`),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return [
    ...staticPages,
    ...learnPages,
    ...bestPages,
    ...productPages,
    ...productLabResultsPages,
    ...brandPages,
    ...brandLabTestsPages,
    ...comparePages,
  ];
}
