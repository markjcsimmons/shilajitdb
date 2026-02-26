import { adminDeleteBrand, adminUpsertBrand } from "@/app/admin/actions";
import { Button, Input } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBrandEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { products: { select: { id: true, name: true, slug: true } } },
  });
  if (!brand) notFound();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Edit brand
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Public page:{" "}
              <Link
                href={`/brand/${brand.slug}`}
                className="underline underline-offset-4"
                target="_blank"
              >
                /brand/{brand.slug}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={adminDeleteBrand}>
              <input type="hidden" name="id" value={brand.id} />
              <Button type="submit" variant="secondary">
                Delete
              </Button>
            </form>
            <Button href="/admin/brands" variant="secondary">
              Back
            </Button>
          </div>
        </div>

        {saved ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Saved.
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error === "unique"
              ? "Name/slug must be unique."
              : "Validation error. Please check fields."}
          </div>
        ) : null}

        <form action={adminUpsertBrand} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={brand.id} />
          <div>
            <label className="text-xs font-medium text-slate-700">Name</label>
            <Input name="name" defaultValue={brand.name} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Slug</label>
            <Input name="slug" defaultValue={brand.slug} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Website (optional)</label>
            <Input name="website" defaultValue={brand.website ?? ""} placeholder="https://…" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Description (optional)</label>
            <textarea
              name="description"
              defaultValue={brand.description ?? ""}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Products ({brand.products.length})
          </h2>
          <Link href="/admin/products" className="text-sm underline underline-offset-4">
            Manage products
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {brand.products.map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 hover:bg-slate-50"
            >
              {p.name}
            </Link>
          ))}
          {brand.products.length === 0 ? (
            <div className="text-sm text-slate-700">No products for this brand yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

