import { adminUpsertProduct } from "@/app/admin/actions";
import { MetaDescriptionField } from "@/components/meta-description-field";
import { Button, Input, Select } from "@/components/ui";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProductNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; meta_error?: string }>;
}) {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const { error, meta_error } = await searchParams;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">New product</h1>
      <p className="mt-1 text-sm text-slate-600">Create a product record.</p>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error === "unique" ? "Slug must be unique." : meta_error || "Validation error."}
        </div>
      ) : null}

      <form action={adminUpsertProduct} className="mt-6 space-y-5">
        <input type="hidden" name="id" value="" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">Brand</label>
            <Select name="brandId" required defaultValue={brands[0]?.id ?? ""}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Form</label>
            <Select name="form" required defaultValue="RESIN">
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
            <Input name="name" required placeholder="Product name" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Slug (optional)</label>
            <Input name="slug" placeholder="auto-generated if blank" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">Official product URL (optional)</label>
          <Input
            name="officialCanonicalUrl"
            type="url"
            placeholder="https://… (same as in CSV)"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-slate-500">External product page. Used for CRAWL and linking.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">GTIN (optional)</label>
            <Input name="gtin" placeholder="Barcode" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Net quantity text (optional)</label>
            <Input name="netQuantityText" placeholder="e.g. 60 g" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">Ingredient text</label>
          <textarea
            name="ingredientText"
            className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Raw disclosure text as shown on packaging/site.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">
            Ingredients normalized (CSV)
          </label>
          <Input
            name="ingredientsNormalizedCsv"
            placeholder="shilajit, vegetarian capsule, ..."
          />
          <p className="mt-1 text-xs text-slate-500">
            Comma-separated list used for filtering (exact match).
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">
            Country of manufacture (optional)
          </label>
          <Input name="manufacturingCountryClaim" placeholder="e.g. USA, India" />
          <p className="mt-1 text-xs text-slate-500">USA → 3 points toward grade; other country → 1 point.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">
              Manufacturing claim text (optional)
            </label>
            <textarea
              name="manufacturingClaimText"
              className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">
              Manufacturing evidence URL (optional)
            </label>
            <Input name="manufacturingEvidenceUrl" placeholder="https://…" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-700">COA status</label>
            <Select name="coaStatus" required defaultValue="UNKNOWN">
              {["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-700">COA URL (optional)</label>
            <Input name="coaUrl" placeholder="https://…" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">Third-party testing lab (optional)</label>
          <textarea
            name="thirdPartyTestingLab"
            placeholder="e.g. Lab name, testing done (heavy metals, potency), or 'tested by X'"
            className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
          <p className="mt-1 text-xs text-slate-500">Lab name or details when COA/testing is mentioned but no document link.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">Heavy metals tested</label>
            <Select name="heavyMetalsTested" defaultValue="">
              <option value="">Unknown / not specified</option>
              <option value="CONFIRMED">Confirmed — COA proves it</option>
              <option value="CLAIMED">Claimed — brand says so, no COA proof</option>
              <option value="NONE">None — not tested</option>
            </Select>
            <p className="mt-1 text-xs text-slate-500">CONFIRMED scores highest; CLAIMED scores lower.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">GMP certified</label>
            <Select name="gmpCertified" defaultValue="no">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">Price per serving ($ USD)</label>
            <Input
              name="pricePerServingCents"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 0.92"
            />
            <p className="mt-1 text-xs text-slate-500">From price_per_serving column. Enter in dollars.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Price per gram ($ USD) — resin / powder only</label>
            <Input
              name="pricePerGramCents"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 3.67"
            />
            <p className="mt-1 text-xs text-slate-500">Derived from price ÷ unit_size. Used for Best Value ranking.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">Patents</label>
          <Select name="hasPatentClaim" required defaultValue="no">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700">
            Last verified date (optional)
          </label>
          <Input name="lastVerifiedAt" placeholder="YYYY-MM-DD" />
        </div>

        <MetaDescriptionField name="metaDescription" errorFromServer={meta_error} />

        <div className="flex items-center gap-2">
          <Button type="submit">Save product</Button>
          <Button href="/admin/products" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

