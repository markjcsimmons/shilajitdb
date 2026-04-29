import { Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { removeBrandsWithNoProductsAction, adminRecomputeAllGrades } from "@/app/admin/actions";
import { RecomputeGradesButton } from "@/app/admin/recompute-grades-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ran?: string; removed?: string; recomputedAll?: string }>;
}) {
  const { ran, removed, recomputedAll } = await searchParams;
  const [brandCount, productCount, evidenceCount, brandsWithNoProducts] = await Promise.all([
    prisma.brand.count(),
    prisma.product.count(),
    prisma.evidence.count(),
    prisma.brand.count({ where: { products: { none: {} } } }),
  ]);

  return (
    <div className="space-y-6">
      {ran === "brands_cleaned" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Removed <strong>{removed ?? "0"}</strong> brand(s) with no products. Database now only lists brands that have at least one (shilajit) product.
        </div>
      )}
      {recomputedAll && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          ✅ Recomputed grades for <strong>{recomputedAll}</strong> product(s). All products now use the updated grading algorithm.
        </div>
      )}
      <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-300">Grading</div>
        <div className="mt-2 text-xl font-semibold">Recompute all product grades</div>
        <p className="mt-2 text-sm text-slate-300">
          Update all product grades based on the latest grading algorithm. Use this after updating the rubric or when deploying grade changes.
        </p>
        <div className="mt-4">
          
            <RecomputeGradesButton />
          
        </div>
      </div>

      <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-300">Get data in</div>
        <div className="mt-2 text-xl font-semibold">Populate database</div>
        <p className="mt-2 text-sm text-slate-300">
          Upload the product data entry CSV to create brands, products, and listings — or add entries manually via the admin forms.
        </p>
        <div className="mt-4">
          <Button href="/admin/populate" className="bg-white text-slate-900 hover:bg-slate-100">
            Open Populate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Brands</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {brandCount}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Only shilajit: brands with no products are excluded.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/admin/brands" variant="secondary">
            Manage brands
          </Button>
          {brandsWithNoProducts > 0 && (
            <form action={removeBrandsWithNoProductsAction} className="inline">
              <input type="hidden" name="next" value="/admin" />
              <Button type="submit" variant="secondary">
                Remove {brandsWithNoProducts} brands with no products
              </Button>
            
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Products</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {productCount}
        </div>
        <div className="mt-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium bg-slate-100 text-slate-900 hover:bg-slate-200 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
          >
            Manage products
          </Link>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Evidence items</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {evidenceCount}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Evidence is the backbone of the database. Add sources and update "last verified" when
          claims change.
        </p>
      </div>
    </div>
    </div>
  );
}
