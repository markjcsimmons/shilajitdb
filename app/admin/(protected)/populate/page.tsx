import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPopulatePage({
  searchParams,
}: {
  searchParams: Promise<{
    ran?: string;
    imported?: string;
    error?: string;
  }>;
}) {
  const { ran, imported, error } = await searchParams;

  const [productCount, brandCount] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Import data</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload the product data entry CSV to create brands, products, and listings.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Products</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{productCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Brands</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{brandCount}</div>
          </div>
        </div>

        {ran === "import" && imported && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {imported}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">Upload CSV</h2>
          <p className="mt-1 text-sm text-slate-600">
            CSV columns:{" "}
            {[
              "brand_name",
              "product_name",
              "form",
              "country_of_manufacture",
              "coa_status",
              "coa_url",
              "third_party_lab",
              "has_patent_claim",
              "bbb_grade",
              "meta_description",
              "amazon_asin",
              "official_url",
              "last_verified_date",
            ].map((col, i, arr) => (
              <span key={col}>
                <code className="rounded bg-slate-100 px-1">{col}</code>
                {i < arr.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            and more. Duplicate products (by slug or official URL) are skipped.
          </p>
          <form
            action="/admin/import-manual-csv?next=/admin/populate"
            method="post"
            encType="multipart/form-data"
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Import
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <Link href="/admin/brands" className="underline underline-offset-2">Brands</Link>
            {" · "}
            <Link href="/admin/products" className="underline underline-offset-2">Products</Link>
            {" · "}
            <Link href="/admin/data" className="underline underline-offset-2">Data</Link>
            {" — edit or export/import individual records."}
          </p>
        </div>
      </div>
    </div>
  );
}
