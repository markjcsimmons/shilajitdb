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
  );
}

