import { ComparePicker } from "@/components/compare-picker";
import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { labelClarity, labelCoaStatus, labelForm, labelQualityTier } from "@/lib/labels";
import { absoluteUrl } from "@/lib/site";
import type { EvidenceType, ListingSource } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function labelEvidenceType(t: EvidenceType) {
  return t.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function labelListingSource(s: ListingSource) {
  if (s === "OFFICIAL") return "Official";
  if (s === "AMAZON") return "Amazon";
  if (s === "WALMART") return "Walmart";
  if (s === "IHERB") return "iHerb";
  if (s === "GOOGLE_SHOPPING") return "Google Shopping";
  if (s === "MANUAL") return "Manual";
  return "Other retailer";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      dataCompleteness: true,
      isCanonical: true,
      evidence: { select: { id: true } },
      brand: { select: { name: true } },
    },
  });
  if (!product) return { title: "Product not found" };

  const noIndex =
    !product.isCanonical ||
    product.dataCompleteness === "LOW" ||
    product.evidence.length === 0;

  const title = `${product.name} transparency & quality`;
  const description = `View transparency grade, COA status, manufacturing claim clarity, ingredients disclosure, and evidence links for ${product.brand.name} — ${product.name}.`;
  const canonical = absoluteUrl(`/product/${product.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    ...(noIndex ? { robots: "noindex, nofollow" } : {}),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      evidence: { orderBy: { createdAt: "desc" } },
      listings: { orderBy: [{ source: "asc" }, { updatedAt: "desc" }] },
    },
  });
  if (!product) notFound();

  const transparency = computeTransparencyGrade(
    {
      form: product.form,
      ingredientText: product.ingredientText,
      ingredientsNormalized: product.ingredientsNormalized,
      manufacturingClarity: product.manufacturingClarity,
      coaStatus: product.coaStatus,
    },
    { count: product.evidence.length }
  );
  const quality = computeQualityTier(
    {
      form: product.form,
      ingredientText: product.ingredientText,
      ingredientsNormalized: product.ingredientsNormalized,
      manufacturingClarity: product.manufacturingClarity,
      coaStatus: product.coaStatus,
    },
    transparency
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: product.brand.name,
        item: absoluteUrl(`/brand/${product.brand.slug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(`/product/${product.slug}`),
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand.name },
    url: absoluteUrl(`/product/${product.slug}`),
    ...(product.listings.length
      ? {
          offers: product.listings.map((l) => {
            const offer: Record<string, unknown> = {
              "@type": "Offer",
              url: l.url,
              priceCurrency: l.currency ?? undefined,
              price:
                typeof l.priceCents === "number" && Number.isFinite(l.priceCents)
                  ? (l.priceCents / 100).toFixed(2)
                  : undefined,
              availability:
                typeof l.inStock === "boolean"
                  ? l.inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock"
                  : undefined,
              seller: l.seller ? { "@type": "Organization", name: l.seller } : undefined,
            };
            return offer;
          }),
        }
      : {}),
  };

  const reportSubject = encodeURIComponent(`Update request: ${product.brand.name} — ${product.name}`);
  const reportBody = encodeURIComponent(
    `I would like to report an update for:\n\n${product.brand.name} — ${product.name}\n${absoluteUrl(
      `/product/${product.slug}`
    )}\n\nWhat changed?\n- \n\nSource URL(s):\n- `
  );
  const reportEmail = process.env.NEXT_PUBLIC_REPORT_EMAIL ?? "updates@example.com";

  const compareOptions = await prisma.product.findMany({
    where: { isCanonical: true },
    select: { slug: true, name: true, brand: { select: { name: true } } },
    orderBy: [{ transparencyGrade: "desc" }, { qualityTier: "desc" }, { name: "asc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      {!product.isCanonical && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          <strong>Discovered / Needs Review.</strong> This product was discovered from a sitemap or
          other source and has not yet been verified. It is not shown in public search.
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm text-slate-600">
              <Link href={`/brand/${product.brand.slug}`} className="hover:underline">
                {product.brand.name}
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Form: {labelForm(product.form)}</Badge>
              <Badge variant="outline">COA: {labelCoaStatus(product.coaStatus)}</Badge>
              <Badge variant="outline">Transparency: {transparency.grade}</Badge>
              <Badge variant="outline">Quality: {labelQualityTier(quality.tier)}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button href={`/brand/${product.brand.slug}`} variant="secondary">
              Brand page
            </Button>
            <a
              className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
              href={`mailto:${encodeURIComponent(reportEmail)}?subject=${reportSubject}&body=${reportBody}`}
            >
              Report an update
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="text-sm font-medium text-slate-900">Ingredients</div>
          <div className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
            {product.ingredientText}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.ingredientsNormalized.length ? (
              product.ingredientsNormalized.map((ing) => (
                <Badge key={ing} variant="muted">
                  {ing}
                </Badge>
              ))
            ) : (
              <Badge variant="muted">No normalized ingredients listed</Badge>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-900">Compare</div>
          <p className="mt-2 text-sm text-slate-600">
            Compare this product side-by-side with another.
          </p>
          <div className="mt-3">
            <ComparePicker
              currentSlug={product.slug}
              options={compareOptions.map((p) => ({
                slug: p.slug,
                label: `${p.brand.name} — ${p.name}`,
              }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Manufacturing claim
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Country (claim)</dt>
              <dd className="text-right text-slate-900">
                {product.manufacturingCountryClaim ?? "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Clarity</dt>
              <dd className="text-right text-slate-900">
                {labelClarity(product.manufacturingClarity)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Claim text</dt>
              <dd className="text-right text-slate-900 whitespace-pre-wrap">
                {product.manufacturingClaimText ?? "—"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Evidence URL</dt>
              <dd className="text-right text-slate-900">
                {product.manufacturingEvidenceUrl ? (
                  <a
                    href={product.manufacturingEvidenceUrl}
                    className="underline underline-offset-4"
                    target="_blank"
                    rel="nofollow"
                  >
                    View
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">COA</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Status</dt>
              <dd className="text-right text-slate-900">
                {labelCoaStatus(product.coaStatus)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-6">
              <dt className="text-slate-500">Public link</dt>
              <dd className="text-right text-slate-900">
                {product.coaUrl ? (
                  <a
                    href={product.coaUrl}
                    className="underline underline-offset-4"
                    target="_blank"
                    rel="nofollow"
                  >
                    View
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-4 text-sm text-slate-600">
            Transparency score: <span className="font-medium">{transparency.score}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Why this Transparency Grade ({transparency.grade})
          </h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {transparency.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Why this Quality Tier ({labelQualityTier(quality.tier)})
          </h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {quality.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Where This Product Is Sold
          </h2>
          <div className="text-sm text-slate-600">
            {product.listings.length} listing{product.listings.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {product.listings.length ? (
            (
              [
                "OFFICIAL",
                "AMAZON",
                "WALMART",
                "IHERB",
                "OTHER_RETAILER",
                "GOOGLE_SHOPPING",
                "MANUAL",
              ] satisfies ListingSource[]
            )
              .map((source) => ({
                source,
                listings: product.listings.filter((l) => l.source === source),
              }))
              .filter((g) => g.listings.length)
              .map((g) => (
                <div key={g.source} className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {labelListingSource(g.source)}
                  </div>
                  <div className="space-y-2">
                    {g.listings.map((l) => (
                      <div
                        key={l.id}
                        className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="mt-1 text-sm text-slate-700 truncate">
                            <a
                              href={l.url}
                              className="underline underline-offset-4"
                              target="_blank"
                              rel="nofollow"
                            >
                              {l.title ?? l.url}
                            </a>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Last seen: {l.lastSeenAt ? new Date(l.lastSeenAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={l.source === "OFFICIAL" ? "outline" : "muted"}>
                            {l.source}
                          </Badge>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="nofollow"
                            className="text-sm underline underline-offset-4"
                          >
                            Visit
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-sm text-slate-700">
              No listings have been captured yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Evidence</h2>
          <div className="text-sm text-slate-600">
            Last verified:{" "}
            {product.lastVerifiedAt ? new Date(product.lastVerifiedAt).toLocaleDateString() : "—"}
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {product.evidence.length ? (
            product.evidence.map((e) => (
              <div key={e.id} className="py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="text-sm font-medium text-slate-900">
                    {labelEvidenceType(e.type)}
                  </div>
                  <a
                    href={e.url}
                    className="text-sm underline underline-offset-4"
                    target="_blank"
                    rel="nofollow"
                  >
                    Source
                  </a>
                </div>
                {e.quote ? (
                  <div className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                    {e.quote}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-4 text-sm text-slate-700">
              No evidence items have been added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

