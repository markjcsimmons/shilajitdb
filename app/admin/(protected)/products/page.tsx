import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        transparencyGrade: true,
        qualityTier: true,
        brand: { select: { name: true } },
        _count: { select: { evidence: true } },
      },
    }),
    prisma.product.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-600">Create and edit product records.</p>
        </div>
        <Button href="/admin/products/new">New product</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid-cols-10">
          <div className="sm:col-span-3">Product</div>
          <div className="sm:col-span-2">Brand</div>
          <div className="sm:col-span-2">Slug</div>
          <div>Grade</div>
          <div>Tier</div>
          <div className="text-right">Edit</div>
        </div>
        <div className="divide-y divide-slate-200">
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 gap-1 px-5 py-4 text-sm text-slate-700 sm:grid-cols-10 sm:items-center"
            >
              <div className="font-medium text-slate-900 sm:col-span-3">
                {p.name}{" "}
                <Badge variant="muted" title="Evidence items">
                  {p._count.evidence} evidence
                </Badge>
              </div>
              <div className="sm:col-span-2">{p.brand.name}</div>
              <div className="sm:col-span-2">{p.slug}</div>
              <div>{p.transparencyGrade}</div>
              <div>{p.qualityTier}</div>
              <div className="text-right">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-slate-900 underline underline-offset-4"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {products.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-700">No products yet.</div>
          ) : null}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
          <span>
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/products?page=${page - 1}`}
                className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/products?page=${page + 1}`}
                className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

