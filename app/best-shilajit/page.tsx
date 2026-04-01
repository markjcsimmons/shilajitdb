import { QualityBadge, TransparencyBadge } from "@/components/grade-badges";
import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { labelCoaStatus, labelForm } from "@/lib/labels";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

const title = "Best Shilajit Products — Transparency Database Rankings";
const description =
  "Objective rankings of the best shilajit products based on COA availability, manufacturing transparency, ingredient clarity, and evidence. No sponsored results.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/best-shilajit") },
  openGraph: { title, description, url: absoluteUrl("/best-shilajit") },
};

export default async function BestShilajitPage() {
  const [ultraPremium, premiumProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" }, qualityTier: "ULTRA_PREMIUM" },
      orderBy: [{ transparencyGrade: "desc" }, { name: "asc" }],
      select: {
        id: true, slug: true, name: true, form: true,
        coaStatus: true, coaUrl: true, transparencyGrade: true, qualityTier: true,
        manufacturingCountryClaim: true, lastVerifiedAt: true,
        brand: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.findMany({
      where: { isCanonical: true, dataCompleteness: { not: "LOW" }, qualityTier: "PREMIUM" },
      orderBy: [{ transparencyGrade: "desc" }, { name: "asc" }],
      take: 10,
      select: {
        id: true, slug: true, name: true, form: true,
        coaStatus: true, coaUrl: true, transparencyGrade: true, qualityTier: true,
        manufacturingCountryClaim: true, lastVerifiedAt: true,
        brand: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Best Shilajit", item: absoluteUrl("/best-shilajit") },
    ],
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Best Shilajit Products
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          These rankings are generated automatically from objective, verifiable signals: COA
          availability, country of manufacture disclosure, ingredient clarity, and the number of
          evidence items on file. There are no sponsored placements.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/methodology" className="underline underline-offset-4">
            Read the full methodology
          </Link>{" "}
          to understand exactly how each tier is determined.
        </p>
      </div>

      {ultraPremium.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-900">
            Ultra Premium
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Products meeting every criterion: resin form, public COA, stated country of manufacture,
            shilajit-only ingredients, and at least three verified evidence items.{" "}
            <Link href="/tier/ultra-premium" className="underline underline-offset-4">
              See all Ultra Premium products
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 gap-3">
            {ultraPremium.map((p) => (
              <ProductCard key={p.id} p={p} highlight />
            ))}
          </div>
        </section>
      )}

      {premiumProducts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-900">
            Premium
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Resin-form products with a COA on file, stated country of manufacture, and
            shilajit-only ingredients — meeting the core criteria but not the Ultra Premium evidence
            threshold.{" "}
            <Link href="/tier/premium" className="underline underline-offset-4">
              See all Premium products
            </Link>
            .
          </p>
          <div className="grid grid-cols-1 gap-3">
            {premiumProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
        Looking for a full list?{" "}
        <Link href="/" className="underline underline-offset-4">
          Search all products
        </Link>{" "}
        with filters for grade, tier, COA status, and more.
      </div>
    </div>
  );
}

type ProductCardProps = {
  p: {
    id: string; slug: string; name: string; form: string;
    coaStatus: string; coaUrl: string | null; transparencyGrade: string;
    qualityTier: string; manufacturingCountryClaim: string | null;
    lastVerifiedAt: Date | null; brand: { name: string; slug: string };
  };
  highlight?: boolean;
};

function ProductCard({ p, highlight }: ProductCardProps) {
  return (
    <div className={`rounded-2xl border bg-white p-5 ${highlight ? "border-amber-300 border-t-2" : "border-slate-200"}`}>
      {highlight && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Highest Rated
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/product/${p.slug}`}
            className="text-base font-semibold tracking-tight text-slate-900 hover:underline"
          >
            {p.name}
          </Link>
          <div className="mt-1 text-sm text-slate-600">
            <Link href={`/brand/${p.brand.slug}`} className="hover:underline">
              {p.brand.name}
            </Link>{" "}
            · {labelForm(p.form as any)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransparencyBadge grade={p.transparencyGrade as any} />
          <QualityBadge tier={p.qualityTier as any} />
          <Badge variant="muted">COA: {labelCoaStatus(p.coaStatus as any)}</Badge>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <div>
          <span className="text-slate-500">Manufacturing claim: </span>
          {p.manufacturingCountryClaim ?? "—"}
        </div>
        <div>
          <span className="text-slate-500">COA link: </span>
          {p.coaUrl ? (
            <a href={p.coaUrl} className="underline underline-offset-4" rel="nofollow" target="_blank">
              View
            </a>
          ) : "—"}
        </div>
        <div>
          <span className="text-slate-500">Last verified: </span>
          {p.lastVerifiedAt ? new Date(p.lastVerifiedAt).toLocaleDateString() : "—"}
        </div>
      </div>
    </div>
  );
}
