import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// ── Tag metadata ──────────────────────────────────────────────────────────────

const TAG_META: Record<string, { label: string; description: string }> = {
  best_value:    { label: "Best Budget",     description: "Best quality-to-price ratio — well-tested shilajit at a competitive price per gram." },
  best_tested:   { label: "Best Tested",    description: "Products with a publicly available COA from a named independent laboratory and confirmed heavy metals testing." },
  best_resin:    { label: "Best Resin",     description: "Top-rated resin-form shilajit — the least processed format, preserving the fulvic-humic mineral matrix." },
  best_capsules: { label: "Best Capsules",  description: "Top capsule-form shilajit products, curated by grade, testing transparency, and value." },
  best_gummies:  { label: "Best Gummies",   description: "Top gummy-form shilajit products, curated by grade, testing transparency, and value." },
  editors_pick:  { label: "Editor's Picks", description: "Hand-selected products that stand out across quality, transparency, and value." },
};

// ── Shared select ─────────────────────────────────────────────────────────────

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  form: true,
  dataCompleteness: true,
  manufacturingCountryClaim: true,
  coaStatus: true,
  coaUrl: true,
  transparencyGrade: true,
  qualityTier: true,
  overallGrade: true,
  thirdPartyTestingLab: true,
  lastVerifiedAt: true,
  heavyMetalsTested: true,
  bestForTags: true,
  pricePerServingCents: true,
  pricePerGramCents: true,
  brand: { select: { name: true, slug: true } },
} as const;

const BASE_WHERE = {
  isCanonical: true,
};

// ── Value score algorithm ─────────────────────────────────────────────────────
// Quality points / price per gram — higher = more quality per dollar

type ProductResult = Awaited<ReturnType<typeof prisma.product.findMany<{ select: typeof PRODUCT_SELECT }>>>[number];

async function fetchValueProducts(): Promise<ProductResult[]> {
  const candidates = await prisma.product.findMany({
    where: {
      isCanonical: true,
      pricePerGramCents: { not: null, gt: 0 },
      qualityTier: { not: "POOR" },
    },
    select: PRODUCT_SELECT,
  });

  function qualityPoints(p: ProductResult): number {
    let pts = 0;
    if (p.qualityTier === "ULTRA_PREMIUM") pts += 4;
    else if (p.qualityTier === "PREMIUM") pts += 3;
    else if (p.qualityTier === "AVERAGE") pts += 2;
    if (p.coaStatus === "PUBLIC") pts += 2;
    else if (p.coaStatus === "PUBLIC_EMBEDDED") pts += 1;
    if (p.thirdPartyTestingLab) pts += 1;
    if (p.heavyMetalsTested === "CONFIRMED") pts += 1;
    return pts;
  }

  return candidates
    .map((p) => ({ ...p, _score: qualityPoints(p) / p.pricePerGramCents! }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
    .map(({ _score, ...p }) => p);
}

// ── Per-tag product fetchers ──────────────────────────────────────────────────

async function fetchProducts(tag: string): Promise<ProductResult[]> {

  switch (tag) {
    case "best_tested":
      return prisma.product.findMany({
        where: {
          ...BASE_WHERE,
          coaStatus: "PUBLIC",
          thirdPartyTestingLab: { not: null },
        },
        orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
        take: 5,
        select: PRODUCT_SELECT,
      });

    case "best_resin":
      return prisma.product.findMany({
        where: { ...BASE_WHERE, form: "RESIN" },
        orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
        take: 5,
        select: PRODUCT_SELECT,
      });

    case "best_capsules":
      return prisma.product.findMany({
        where: { ...BASE_WHERE, form: "CAPSULE" },
        orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
        take: 5,
        select: PRODUCT_SELECT,
      });

    case "best_gummies":
      return prisma.product.findMany({
        where: { ...BASE_WHERE, form: "GUMMY" },
        orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
        take: 5,
        select: PRODUCT_SELECT,
      });

    case "best_value":
      return fetchValueProducts();

    case "editors_pick":
      return prisma.product.findMany({
        where: {
          ...BASE_WHERE,
          bestForTags: { has: "editors_pick" },
        },
        orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
        select: PRODUCT_SELECT,
      });

    default:
      return [];
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const dbTag = tag.replace(/-/g, "_");
  const meta = TAG_META[dbTag];
  if (!meta) return { title: "Not found" };
  const title = `${meta.label} Shilajit — Shilajit Transparency Database`;
  return {
    title,
    description: meta.description,
    alternates: { canonical: absoluteUrl(`/best/${tag}`) },
    openGraph: { title, description: meta.description, url: absoluteUrl(`/best/${tag}`) },
  };
}

export default async function BestTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const dbTag = tag.replace(/-/g, "_");
  const meta = TAG_META[dbTag];
  if (!meta) notFound();

  const products = await fetchProducts(dbTag);

  const canonicalUrl = absoluteUrl(`/best/${tag}`);
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${meta.label} Shilajit`,
    description: meta.description,
    url: canonicalUrl,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug}`),
      name: p.name,
    })),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
    <div className="space-y-4">
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex items-center gap-2 text-xs text-[#6E7A9A] mb-3">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span>/</span>
          <span>{meta.label}</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8]">
          ★ {meta.label} Shilajit
        </h1>
        <p className="mt-2 text-sm text-[#8892B8] max-w-2xl">{meta.description}</p>
        <p className="mt-1 text-xs text-[#6E7A9A]">{products.length} product{products.length !== 1 ? "s" : ""} in this list</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#252A40] bg-[#0F1320] p-8 text-center text-sm text-[#8892B8]">
          No products matched this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
