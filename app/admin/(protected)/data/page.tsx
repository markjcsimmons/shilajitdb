import { Button, Input } from "@/components/ui";
import { prisma } from "@/lib/db";
import { isAdminAuthed, requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { importDataFromCsv } from "@/lib/data-import";

export const dynamic = "force-dynamic";

// Bulk import (with its replace mode, which deletes products) only runs on a local dev server —
// not on Vercel — until it has a preview step and duplicate checks. Export works everywhere.
const IMPORT_ENABLED = !process.env.VERCEL;

export default async function AdminDataPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; error?: string; replace?: string; warnings?: string }>;
}) {
  await requireAdmin();
  const { imported, error, replace, warnings } = await searchParams;

  async function importCsvAction(formData: FormData) {
    "use server";
    if (!(await isAdminAuthed())) redirect("/admin/login");
    if (!IMPORT_ENABLED) redirect(`/admin/data?error=${encodeURIComponent("Import is disabled in production")}`);
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    const buf = Buffer.from(await file.arrayBuffer());
    const replaceMode = formData.get("replace") === "true";
    // redirect() works by throwing, so it must not run inside the try — the catch would
    // swallow it and report a successful import as "NEXT_REDIRECT".
    let target: string;
    try {
      const result = await importDataFromCsv(buf, replaceMode);
      if (result.errors.length > 0) {
        target = `/admin/data?error=${encodeURIComponent(result.errors.join("; "))}`;
      } else {
        const msg = [
          result.brandsCreated && `${result.brandsCreated} brands created`,
          result.brandsUpdated && `${result.brandsUpdated} brands updated`,
          result.productsCreated && `${result.productsCreated} products created`,
          result.productsUpdated && `${result.productsUpdated} products updated`,
          result.productsDeleted && `${result.productsDeleted} products deleted`,
        ]
          .filter(Boolean)
          .join(", ");
        const params = new URLSearchParams({ imported: msg || "Done" });
        if (replaceMode) params.set("replace", "1");
        if (result.warnings.length > 0) params.set("warnings", result.warnings.join("\n"));
        target = `/admin/data?${params.toString()}`;
      }
    } catch (e) {
      target = `/admin/data?error=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`;
    }
    redirect(target);
  }

  const [productCount, brandCount] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Data export & import
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Download all products and brands as CSV, edit in a spreadsheet, then upload to replace or
          update the database.
        </p>
      </div>

      {imported ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Import complete: {imported}
          {replace === "1" && " (replace mode: products not in CSV were deleted)"}
        </div>
      ) : null}
      {imported && warnings ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Check these rows:</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.split("\n").map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Export</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download a CSV with all {productCount} products and {brandCount} brands. Keep the header
          row and <code className="rounded bg-slate-100 px-1">product_id</code> /{" "}
          <code className="rounded bg-slate-100 px-1">brand_id</code> for round-trip edits.
        </p>
        <a
          href="/admin/data/export"
          className="mt-4 inline-block"
        >
          <Button variant="secondary">Download CSV</Button>
        </a>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Import</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload a CSV (from export or same format). Rows with <code className="rounded bg-slate-100 px-1">product_id</code> update
          existing products; rows without create new ones. Grades are recomputed after import.
        </p>
        {IMPORT_ENABLED ? (
          <form action={importCsvAction} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input name="file" type="file" accept=".csv,text/csv" required className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="replace" value="true" className="rounded" />
              Replace mode (delete products not in CSV)
            </label>
            <Button type="submit">Upload & import</Button>
          </form>
        ) : (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Import is disabled in production. Run the site locally to import.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Replace mode will delete products not in the CSV and remove brands with no products.
          Evidence and listings for deleted products are removed.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="font-semibold text-slate-900">Format</h2>
        <p className="mt-1 text-sm text-slate-700">
          Required columns: brand_name, brand_slug, product_name, product_slug, form,
          ingredient_text, coa_status. Use{" "}
          <code className="rounded bg-slate-200 px-1">|</code> to separate values in{" "}
          <code className="rounded bg-slate-200 px-1">ingredients_normalized</code>. Dates as
          YYYY-MM-DD.
        </p>
        <Link href="/admin/products" className="mt-2 inline-block text-sm underline underline-offset-2">
          Edit individual products in the app
        </Link>
      </div>
    </div>
  );
}
