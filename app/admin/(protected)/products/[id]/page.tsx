import {
  adminAddEvidence,
  adminDeleteEvidence,
  adminDeleteProduct,
  adminPromoteToCanonical,
  adminRecomputeGrades,
  adminSetOfficialCanonicalUrl,
  adminUpsertProduct,
} from "@/app/admin/actions";
import { Badge, Button, Input, Select } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
    recomputed?: string;
    promoted?: string;
    otherId?: string;
    otherName?: string;
  }>;
}) {
  const { id } = await params;
  const { saved, error, recomputed, promoted, otherId, otherName } = await searchParams;

  const [brands, product] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        evidence: { orderBy: { createdAt: "desc" } },
        listings: { orderBy: [{ source: "asc" }, { updatedAt: "desc" }] },
      },
    }),
  ]);
  if (!product) notFound();

  const normalizedCsv = product.ingredientsNormalized.join(", ");
  const lastVerifiedValue = product.lastVerifiedAt
    ? new Date(product.lastVerifiedAt).toISOString().slice(0, 10)
    : "";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Edit product
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Public page:{" "}
              <Link
                href={`/product/${product.slug}`}
                className="underline underline-offset-4"
                target="_blank"
              >
                /product/{product.slug}
              </Link>{" "}
              · Brand:{" "}
              <Link
                href={`/brand/${product.brand.slug}`}
                className="underline underline-offset-4"
                target="_blank"
              >
                {product.brand.name}
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Transparency: {product.transparencyGrade}</Badge>
              <Badge variant="outline">Quality: {product.qualityTier}</Badge>
              <Badge variant="muted">{product.evidence.length} evidence items</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={adminRecomputeGrades}>
              <input type="hidden" name="productId" value={product.id} />
              <Button type="submit" variant="secondary">
                Recompute grades
              </Button>
            </form>
            <form action={adminDeleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <Button type="submit" variant="secondary">
                Delete
              </Button>
            </form>
            <Button href="/admin/products" variant="secondary">
              Back
            </Button>
          </div>
        </div>

        {saved ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Saved.
          </div>
        ) : null}
        {recomputed ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Grades recomputed.
          </div>
        ) : null}
        {promoted ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Product promoted to canonical. It will now appear in public search.
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error === "unique"
              ? "Slug must be unique."
              : error === "validation"
                ? "Validation error. Please check fields."
                : error === "official_taken" && otherId
                  ? (
                    <>
                      That official URL is already assigned to another product.{" "}
                      <Link
                        href={`/admin/products/${otherId}`}
                        className="font-medium underline underline-offset-4"
                      >
                        {otherName ? `${otherName} (view)` : "View product"}
                      </Link>
                    </>
                  )
                  : error === "listing"
                    ? "Listing not found or not OFFICIAL."
                    : "Error."}
          </div>
        ) : null}

        <form action={adminUpsertProduct} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={product.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-700">Brand</label>
              <Select name="brandId" required defaultValue={product.brandId}>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Form</label>
              <Select name="form" required defaultValue={product.form}>
                {["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-700">Name</label>
              <Input name="name" required defaultValue={product.name} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Slug</label>
              <Input name="slug" required defaultValue={product.slug} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Ingredient text</label>
            <textarea
              name="ingredientText"
              required
              defaultValue={product.ingredientText}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Ingredients normalized (CSV)
            </label>
            <Input name="ingredientsNormalizedCsv" defaultValue={normalizedCsv} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Manufacturing country claim (optional)
              </label>
              <Input
                name="manufacturingCountryClaim"
                defaultValue={product.manufacturingCountryClaim ?? ""}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Manufacturing clarity</label>
              <Select name="manufacturingClarity" required defaultValue={product.manufacturingClarity}>
                {["CLEAR", "AMBIGUOUS", "NOT_STATED"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Manufacturing claim text (optional)
              </label>
              <textarea
                name="manufacturingClaimText"
                defaultValue={product.manufacturingClaimText ?? ""}
                className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">
                Manufacturing evidence URL (optional)
              </label>
              <Input
                name="manufacturingEvidenceUrl"
                defaultValue={product.manufacturingEvidenceUrl ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-700">COA status</label>
              <Select name="coaStatus" required defaultValue={product.coaStatus}>
                {["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">COA URL (optional)</label>
              <Input name="coaUrl" defaultValue={product.coaUrl ?? ""} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Last verified date (optional)
            </label>
            <Input name="lastVerifiedAt" defaultValue={lastVerifiedValue} placeholder="YYYY-MM-DD" />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div id="listings" className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Listings</h2>
          <div className="text-sm text-slate-600">
            {product.listings.length} known listing{product.listings.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">URL</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Last seen</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {product.listings.length ? (
                product.listings.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 pr-4">
                      <Badge variant={l.source === "OFFICIAL" ? "outline" : "muted"}>{l.source}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="nofollow"
                        className="underline underline-offset-4"
                      >
                        {l.url}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{l.title ?? "—"}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {l.lastSeenAt ? new Date(l.lastSeenAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {l.source === "OFFICIAL" ? (
                        <form action={adminSetOfficialCanonicalUrl}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input type="hidden" name="listingId" value={l.id} />
                          <Button type="submit" variant="secondary">
                            Mark this Listing as Official
                          </Button>
                        </form>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-700">
                    No listings yet. Ingest official and marketplace listings to populate this section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div id="evidence" className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Evidence</h2>
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            className="text-sm underline underline-offset-4"
          >
            View public page
          </a>
        </div>

        <form action={adminAddEvidence} className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-8">
          <input type="hidden" name="productId" value={product.id} />
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-slate-700">Type</label>
            <Select name="type" defaultValue="OTHER">
              {["COA", "MANUFACTURING", "INGREDIENTS", "TESTING", "OTHER"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-slate-700">URL</label>
            <Input name="url" placeholder="https://…" required />
          </div>
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-slate-700">Quote/snippet (optional)</label>
            <Input name="quote" placeholder="Short snippet captured from source" />
          </div>
          <div className="lg:col-span-8 flex items-center gap-2">
            <Button type="submit" variant="secondary">
              Add evidence
            </Button>
            <span className="text-xs text-slate-500">
              Adding/deleting evidence triggers grade recomputation.
            </span>
          </div>
        </form>

        <div className="mt-6 divide-y divide-slate-200">
          {product.evidence.length ? (
            product.evidence.map((e) => (
              <div key={e.id} className="py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-slate-900">
                    {e.type}{" "}
                    <span className="font-normal text-slate-500">
                      · {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="nofollow"
                      className="text-sm underline underline-offset-4"
                    >
                      Source
                    </a>
                    <form action={adminDeleteEvidence}>
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="evidenceId" value={e.id} />
                      <Button type="submit" variant="secondary">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
                {e.quote ? (
                  <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{e.quote}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-4 text-sm text-slate-700">No evidence items yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

