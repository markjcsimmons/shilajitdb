import { Button } from "@/components/ui";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [brandCount, productCount, evidenceCount] = await Promise.all([
    prisma.brand.count(),
    prisma.product.count(),
    prisma.evidence.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-300">Get data in</div>
        <div className="mt-2 text-xl font-semibold">Populate database</div>
        <p className="mt-2 text-sm text-slate-300">
          Run DSLD import, discovery, enrichment, and link checks in order. Use manual add only after that.
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
        <div className="mt-4">
          <Button href="/admin/brands" variant="secondary">
            Manage brands
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Products</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {productCount}
        </div>
        <div className="mt-4">
          <Button href="/admin/products" variant="secondary">
            Manage products
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Evidence items</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {evidenceCount}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Evidence is the backbone of the database. Add sources and update “last verified” when
          claims change.
        </p>
      </div>
    </div>
    </div>
  );
}

