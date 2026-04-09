import {
  adminDeleteProduct,
  adminRecomputeGrades,
  adminUpsertProduct,
} from "@/app/admin/actions";
import { MetaDescriptionField } from "@/components/meta-description-field";
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
    meta_error?: string;
    recomputed?: string;
    promoted?: string;
    otherId?: string;
    otherName?: string;
  }>;
}) {
  const { id } = await params;
  const { saved, error, meta_error, recomputed, promoted, otherId, otherName } = await searchParams;

  const [brands, product] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findUnique({
      where: { id },
      include: { brand: true },
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
              <Badge variant={product.overallGrade === "A_PLUS" || product.overallGrade === "A" ? "default" : "outline"}>
                Overall: {product.overallGrade?.replace("_PLUS", "+") ?? "—"}
              </Badge>
              <Badge variant="outline">Transparency: {product.transparencyGrade}</Badge>
              <Badge variant="outline">Quality: {product.qualityTier}</Badge>
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
                ? meta_error || "Validation error. Please check fields."
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
          <input type="hidden" name="mpn" value={product.mpn ?? ""} />
          <input type="hidden" name="brandSku" value={product.brandSku ?? ""} />
          <input type="hidden" name="flavor" value={product.flavor ?? ""} />
          <input type="hidden" name="servingsCount" value={product.servingsCount ?? ""} />
          <input type="hidden" name="capsuleCount" value={product.capsuleCount ?? ""} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              <label className="text-xs font-medium text-slate-700">Brand name</label>
              <Input
                name="brandName"
                required
                defaultValue={product.brand.name}
                placeholder="Edits the selected brand"
              />
              <p className="mt-1 text-xs text-slate-500">Updates the selected brand above in the brand database.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Form</label>
              <Select name="form" required defaultValue={product.form}>
                {[
                  { value: "RESIN", label: "Resin" },
                  { value: "CAPSULE", label: "Capsules" },
                  { value: "POWDER", label: "Powder" },
                  { value: "TABLETS", label: "Tablets" },
                  { value: "GUMMY", label: "Gummies" },
                  { value: "HONEY_STICKS", label: "Honey Sticks" },
                  { value: "LIQUID", label: "Liquid" },
                  { value: "BLEND", label: "Blend" },
                  { value: "OTHER", label: "Other" },
                ].map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
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
            <label className="text-xs font-medium text-slate-700">Official product URL (external product page)</label>
            <Input
              name="officialCanonicalUrl"
              type="url"
              placeholder="https://…"
              defaultValue={product.officialCanonicalUrl ?? ""}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">Same URL as in the CSV. Used for CRAWL and linking to the brand’s product page.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-700">GTIN (optional)</label>
              <Input name="gtin" defaultValue={product.gtin ?? ""} placeholder="Barcode" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Net quantity text (optional)</label>
              <Input name="netQuantityText" defaultValue={product.netQuantityText ?? ""} placeholder="e.g. 60 g" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Ingredient text</label>
            <textarea
              name="ingredientText"
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

          <div>
            <label className="text-xs font-medium text-slate-700">
              Country of manufacture (optional)
            </label>
            <Input
              name="manufacturingCountryClaim"
              defaultValue={product.manufacturingCountryClaim ?? ""}
              placeholder="e.g. USA, India"
            />
            <p className="mt-1 text-xs text-slate-500">USA → 3 points toward grade; other country → 1 point.</p>
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
            <label className="text-xs font-medium text-slate-700">Third-party testing lab (optional)</label>
            <textarea
              name="thirdPartyTestingLab"
              defaultValue={product.thirdPartyTestingLab ?? ""}
              placeholder="e.g. Lab name, testing done (heavy metals, potency), or “tested by X”"
              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
            <p className="mt-1 text-xs text-slate-500">Lab name or details when COA/testing is mentioned but no document link.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Patents</label>
            <Select name="hasPatentClaim" required defaultValue={product.hasPatentClaim ? "yes" : "no"}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Last verified date (optional)
            </label>
            <Input name="lastVerifiedAt" defaultValue={lastVerifiedValue} placeholder="YYYY-MM-DD" />
          </div>

          <MetaDescriptionField
            name="metaDescription"
            defaultValue={product.metaDescription}
            errorFromServer={meta_error}
          />

          <div className="flex items-center gap-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

