import { QualityBadge, TransparencyBadge } from "@/components/grade-badges";
import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { labelCoaStatus, labelForm } from "@/lib/labels";
import type { QualityTier } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const TIER_META: Record<
  string,
  {
    tier: QualityTier;
    title: string;
    heading: string;
    description: string;
    blurb: string;
  }
> = {
  "ultra-premium": {
    tier: "ULTRA_PREMIUM",
    title: "Ultra Premium shilajit products",
    heading: "Ultra Premium Shilajit",
    description:
      "Products earning the highest rating in the Shilajit Transparency Database: resin form, public COA, stated country of manufacture, shilajit-only ingredients, and strong evidence backing.",
    blurb:
      "Ultra Premium is the highest tier in our rubric. To qualify, a product must be a pure shilajit resin with a publicly available Certificate of Analysis, a stated country of manufacture, no blending agents, and at least three verified evidence items on file.",
  },
  premium: {
    tier: "PREMIUM",
    title: "Premium shilajit products",
    heading: "Premium Shilajit",
    description:
      "Premium-rated shilajit products in the Shilajit Transparency Database: resin form, COA available, stated country of manufacture, and shilajit-only ingredients.",
    blurb:
      "Premium products are resin-form shilajit with a COA on file (public or available on request), a stated country of manufacture, and no blending agents. They meet the core transparency criteria but fall short of the Ultra Premium evidence threshold.",
  },
  average: {
    tier: "AVERAGE",
    title: "Average-rated shilajit products",
    heading: "Average-Rated Shilajit",
    description:
      "Shilajit products rated Average in the Transparency Database — some transparency signals present but missing COA, country of manufacture, or other key disclosures.",
    blurb:
      "Average products have some transparency signals (e.g. a COA or ingredient disclosure) but are missing one or more key criteria such as country of manufacture or official labels.",
  },
  poor: {
    tier: "POOR",
    title: "Poor-rated shilajit products",
    heading: "Poor-Rated Shilajit",
    description:
      "Shilajit products rated Poor in the Transparency Database — lacking COA and country of manufacture disclosures, or containing proprietary blend indicators.",
    blurb:
      "Poor-rated products lack both a COA and country of manufacture disclosure, or contain proprietary blend language in a gummy or blend form.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  const meta = TIER_META[tier];
  if (!meta) return { title: "Not found" };

  const canonical = absoluteUrl(`/tier/${tier}`);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    openGraph: { title: meta.title, description: meta.description, url: canonical },
  };
}

export async function generateStaticParams() {
  return Object.keys(TIER_META).map((tier) => ({ tier }));
}

export default async function TierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const meta = TIER_META[tier];
  if (!meta) notFound();

  const products = await prisma.product.findMany({
    where: {
      isCanonical: true,
      dataCompleteness: { not: "LOW" },
      qualityTier: meta.tier,
    },
    orderBy: [{ transparencyGrade: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      form: true,
      coaStatus: true,
      coaUrl: true,
      transparencyGrade: true,
      qualityTier: true,
      manufacturingCountryClaim: true,
      lastVerifiedAt: true,
      brand: { select: { name: true, slug: true } },
    },
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.heading,
        item: absoluteUrl(`/tier/${tier}`),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {meta.heading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{meta.blurb}</p>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{products.length}</span>{" "}
              {products.length === 1 ? "product" : "products"} in this tier ·{" "}
              <Link href="/methodology" className="underline underline-offset-4">
                see full rubric
              </Link>
            </p>
          </div>
          <Button href="/" variant="secondary">
            All products
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border bg-white p-5 ${meta.tier === "ULTRA_PREMIUM" ? "border-amber-300 border-t-2" : "border-slate-200"}`}
          >
            {meta.tier === "ULTRA_PREMIUM" && (
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
                  · {labelForm(p.form)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TransparencyBadge grade={p.transparencyGrade} />
                <QualityBadge tier={p.qualityTier} />
                <Badge variant="muted">COA: {labelCoaStatus(p.coaStatus)}</Badge>
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
                ) : (
                  "—"
                )}
              </div>
              <div>
                <span className="text-slate-500">Last verified: </span>
                {p.lastVerifiedAt ? new Date(p.lastVerifiedAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
            No verified products in this tier yet.
          </div>
        )}
      </div>
    </div>
  );
}
