import { Pagination } from "@/components/pagination";
import { Badge, Button, Input, Select } from "@/components/ui";
import { prisma } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import {
  buildDefaultOrderBy,
  buildProductWhere,
  PAGE_SIZE,
  parseProductFilters,
  type SearchParams,
} from "@/lib/search";
import Link from "next/link";

export const dynamic = "force-dynamic";

function labelEnum(s: string) {
  return s.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseProductFilters(await searchParams);
  const where = buildProductWhere(filters);
  const orderBy = buildDefaultOrderBy();
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [total, products, countries] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        form: true,
        dataCompleteness: true,
        manufacturingCountryClaim: true,
        manufacturingClarity: true,
        coaStatus: true,
        coaUrl: true,
        transparencyGrade: true,
        qualityTier: true,
        lastVerifiedAt: true,
        brand: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.product.findMany({
      distinct: ["manufacturingCountryClaim"],
      where: { manufacturingCountryClaim: { not: null } },
      select: { manufacturingCountryClaim: true },
      orderBy: { manufacturingCountryClaim: "asc" },
    }),
  ]);

  const countryOptions = countries
    .map((c) => c.manufacturingCountryClaim)
    .filter((c): c is string => Boolean(c));

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: getSiteUrl(),
    name: "Shilajit Transparency Database",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Shilajit Transparency Database
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          This is a public, neutral, fact-based database of shilajit products sold in the
          United States. We focus on objective signals like COA availability, clarity of
          manufacturing claims, ingredient disclosures, and evidence links.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Read the rubric on{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <form
        method="GET"
        className="rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-700">
              Search (brand or product)
            </label>
            <Input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="e.g., purblack, resin, capsules"
            />
          </div>
          <div className="sm:w-40">
            <label className="text-xs font-medium text-slate-700">Form</label>
            <Select name="form" defaultValue={filters.form ?? ""}>
              <option value="">Any</option>
              {["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"].map((v) => (
                <option key={v} value={v}>
                  {labelEnum(v)}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-56">
            <label className="text-xs font-medium text-slate-700">
              Manufacturing country (claim)
            </label>
            <Select
              name="manufacturingCountryClaim"
              defaultValue={filters.manufacturingCountryClaim ?? ""}
            >
              <option value="">Any</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="text-xs font-medium text-slate-700">
              Manufacturing clarity
            </label>
            <Select
              name="manufacturingClarity"
              defaultValue={filters.manufacturingClarity ?? ""}
            >
              <option value="">Any</option>
              {["CLEAR", "AMBIGUOUS", "NOT_STATED"].map((v) => (
                <option key={v} value={v}>
                  {labelEnum(v)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">COA status</label>
            <Select name="coaStatus" defaultValue={filters.coaStatus ?? ""}>
              <option value="">Any</option>
              {["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"].map((v) => (
                <option key={v} value={v}>
                  {labelEnum(v)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">
              Transparency Grade
            </label>
            <Select
              name="transparencyGrade"
              defaultValue={filters.transparencyGrade ?? ""}
            >
              <option value="">Any</option>
              {["A", "B", "C", "D", "F"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Quality Tier</label>
            <Select name="qualityTier" defaultValue={filters.qualityTier ?? ""}>
              <option value="">Any</option>
              {["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"].map((v) => (
                <option key={v} value={v}>
                  {labelEnum(v)}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-700">
              Ingredient includes (exact match)
            </label>
            <Input
              name="ingredient"
              defaultValue={filters.ingredient ?? ""}
              placeholder="e.g., shilajit"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {products.length ? skip + 1 : 0}–{skip + products.length}
            </span>{" "}
            of <span className="font-medium text-slate-900">{total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit">Search</Button>
            <Button href="/" variant="secondary">
              Reset
            </Button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
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
                  · {labelEnum(p.form)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Transparency: {p.transparencyGrade}</Badge>
                <Badge variant="outline">Quality: {labelEnum(p.qualityTier)}</Badge>
                <Badge variant="muted">COA: {labelEnum(p.coaStatus)}</Badge>
                {p.dataCompleteness === "LOW" ? (
                  <Badge variant="muted" title="Placeholder or unverified product">Unverified</Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <div>
                <span className="text-slate-500">Manufacturing claim: </span>
                {p.manufacturingCountryClaim ?? "—"} ({labelEnum(p.manufacturingClarity)})
              </div>
              <div>
                <span className="text-slate-500">COA link: </span>
                {p.coaUrl ? (
                  <a
                    href={p.coaUrl}
                    className="underline underline-offset-4"
                    rel="nofollow"
                    target="_blank"
                  >
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
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
            No products matched. Try broadening your search or clearing filters.
          </div>
        ) : null}
      </div>

      <Pagination total={total} filters={filters} pageSize={PAGE_SIZE} />
    </div>
  );
}

