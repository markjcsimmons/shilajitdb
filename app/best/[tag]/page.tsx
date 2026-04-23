import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const TAG_META: Record<string, { label: string; description: string }> = {
  best_value:     { label: "Best Value",     description: "Highest transparency grade per dollar — strong testing credentials without a premium price tag." },
  best_tested:    { label: "Best Tested",    description: "Products with a publicly available COA from a named independent laboratory." },
  best_resin:     { label: "Best Resin",     description: "Top-rated resin-form shilajit — the least processed format, preserving the fulvic-humic mineral matrix." },
  best_us_made:   { label: "Best US-Made",   description: "Products manufactured in the United States under FDA 21 CFR Part 111 facility oversight." },
  best_beginners: { label: "Best for Beginners", description: "Well-documented, straightforward products that are a good starting point for first-time buyers." },
  editors_pick:   { label: "Editor's Picks", description: "Hand-selected products that stand out across quality, transparency, and value." },
};

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

  const products = await prisma.product.findMany({
    where: {
      isCanonical: true,
      dataCompleteness: { not: "LOW" },
      bestForTags: { has: dbTag },
    },
    orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
    select: {
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
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
          <Link href="/" className="hover:text-stone-600">Home</Link>
          <span>/</span>
          <span>{meta.label}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          ★ {meta.label} Shilajit
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">{meta.description}</p>
        <p className="mt-1 text-xs text-stone-400">{products.length} product{products.length !== 1 ? "s" : ""} in this list</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No products have been tagged as {meta.label} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
