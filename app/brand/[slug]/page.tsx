import { Badge, Button, Select } from "@/components/ui";
import { QualityBadge, TransparencyBadge } from "@/components/grade-badges";
import { prisma } from "@/lib/db";
import { labelCoaStatus, labelForm } from "@/lib/labels";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function countBy<T extends string>(items: T[]) {
  const m = new Map<T, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return m;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { name: true, description: true, slug: true },
  });
  if (!brand) return { title: "Brand not found" };

  const title = `${brand.name} shilajit products`;
  const description =
    brand.description?.slice(0, 155) ??
    `Browse shilajit products sold in the United States from ${brand.name}, including transparency grades, COA availability, and evidence links.`;

  const canonical = absoluteUrl(`/brand/${brand.slug}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      website: true,
      description: true,
      products: {
        select: {
          id: true,
          slug: true,
          name: true,
          form: true,
          coaStatus: true,
          transparencyGrade: true,
          qualityTier: true,
          manufacturingCountryClaim: true,
        },
      },
    },
  });
  if (!brand) notFound();

  const gradeRank = { A: 5, B: 4, C: 3, D: 2, F: 1 } as const;
  const tierRank = { ULTRA_PREMIUM: 4, PREMIUM: 3, AVERAGE: 2, POOR: 1 } as const;
  const orderByDefault = (
    a: (typeof brand.products)[number],
    b: (typeof brand.products)[number]
  ) => {
    const g = (tierRank[b.qualityTier] ?? 0) - (tierRank[a.qualityTier] ?? 0);
    const t = (gradeRank[b.transparencyGrade] ?? 0) - (gradeRank[a.transparencyGrade] ?? 0);
    if (t !== 0) return t;
    if (g !== 0) return g;
    return a.name.localeCompare(b.name);
  };

  const products = [...brand.products].sort(
    sort === "name" ? (a, b) => a.name.localeCompare(b.name) : orderByDefault
  );

  const gradeCounts = countBy(products.map((p) => p.transparencyGrade));
  const coaCounts = countBy(products.map((p) => p.coaStatus));
  const countries = Array.from(
    new Set(products.map((p) => p.manufacturingCountryClaim).filter(Boolean))
  ) as string[];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: brand.name,
        item: absoluteUrl(`/brand/${brand.slug}`),
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {brand.name}
            </h1>
            {brand.website ? (
              <p className="mt-1 text-sm text-slate-600">
                <a
                  href={brand.website}
                  className="underline underline-offset-4"
                  target="_blank"
                  rel="nofollow"
                >
                  {brand.website}
                </a>
              </p>
            ) : null}
            {brand.description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                {brand.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="muted">{products.length} products</Badge>
            <Button href="/" variant="secondary">
              Back to search
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-900">Transparency distribution</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["A", "B", "C", "D", "F"] as const).map((g) => (
              <Badge key={g} variant="outline">
                {g}: {gradeCounts.get(g) ?? 0}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-900">COA availability</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"] as const).map((s) => (
              <Badge key={s} variant="outline">
                {labelCoaStatus(s)}: {coaCounts.get(s) ?? 0}
              </Badge>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-900">Manufacturing country (claim)</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {countries.length ? (
              countries.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))
            ) : (
              <div className="text-sm text-slate-600">No country claims recorded.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Products
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Sort defaults to highest Transparency Grade, then highest Quality Tier.
            </p>
          </div>
          <form method="GET" className="w-full sm:w-56">
            <label className="text-xs font-medium text-slate-700">Sort</label>
            <Select name="sort" defaultValue={sort === "name" ? "name" : "default"}>
              <option value="default">Transparency (best first)</option>
              <option value="name">Name (A–Z)</option>
            </Select>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/product/${p.slug}`}
                    className="text-base font-semibold tracking-tight text-slate-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-600">{labelForm(p.form)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TransparencyBadge grade={p.transparencyGrade} />
                  <QualityBadge tier={p.qualityTier} />
                  <Badge variant="muted">COA: {labelCoaStatus(p.coaStatus)}</Badge>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-700">
                <span className="text-slate-500">Manufacturing claim: </span>
                {p.manufacturingCountryClaim ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

