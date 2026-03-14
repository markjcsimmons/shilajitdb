import { Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.brand.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Brands</h1>
          <p className="mt-1 text-sm text-slate-600">Create and edit brand records.</p>
        </div>
        <Button href="/admin/brands/new">New brand</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid-cols-6">
          <div className="sm:col-span-2">Name</div>
          <div className="sm:col-span-2">Slug</div>
          <div>Products</div>
          <div className="text-right">Edit</div>
        </div>
        <div className="divide-y divide-slate-200">
          {brands.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-1 gap-1 px-5 py-4 text-sm text-slate-700 sm:grid-cols-6 sm:items-center"
            >
              <div className="font-medium text-slate-900 sm:col-span-2">
                <Link
                  href={`/admin/brands/${b.id}`}
                  className="text-slate-900 hover:underline underline-offset-4"
                >
                  {b.name}
                </Link>
              </div>
              <div className="sm:col-span-2">{b.slug}</div>
              <div>
                <Link
                  href={`/admin/brands/${b.id}`}
                  className="text-slate-900 font-medium hover:underline underline-offset-4"
                >
                  {b._count.products}
                </Link>
                <span className="text-slate-600">
                  {" "}product{b._count.products !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-right">
                <Link
                  href={`/admin/brands/${b.id}`}
                  className="text-slate-900 underline underline-offset-4"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {brands.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-700">No brands yet.</div>
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
                href={`/admin/brands?page=${page - 1}`}
                className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/brands?page=${page + 1}`}
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

