import { prisma } from "@/lib/db";
import { adminAddEditorsPick, adminRemoveEditorsPick } from "@/app/admin/actions";
import { Button } from "@/components/ui";
import type { SearchParams } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function EditorsPicksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const [currentPicks, allProducts] = await Promise.all([
    prisma.product.findMany({
      where: { bestForTags: { has: "editors_pick" } },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, brand: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: {
        isCanonical: true,
        dataCompleteness: { not: "LOW" },
        NOT: { bestForTags: { has: "editors_pick" } },
      },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, brand: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Editor&apos;s Picks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Products tagged here appear on the public{" "}
          <a href="/best/editors-pick" target="_blank" className="underline hover:text-slate-800">
            /best/editors-pick
          </a>{" "}
          page automatically.
        </p>
      </div>

      {/* Feedback banners */}
      {sp.saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✓ Product added to Editor&apos;s Picks.
        </div>
      )}
      {sp.removed && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Product removed from Editor&apos;s Picks.
        </div>
      )}
      {sp.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          Error: {String(sp.error)}
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Add a product</h2>
        <form action={adminAddEditorsPick} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="productId" className="block text-xs text-slate-500 mb-1">
              Product
            </label>
            <select
              id="productId"
              name="productId"
              required
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— select a product —</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand.name} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Add to picks</Button>
        </form>
        {allProducts.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">All eligible products are already picks.</p>
        )}
      </div>

      {/* Current picks list */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-slate-800">
            Current picks{" "}
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {currentPicks.length}
            </span>
          </h2>
        </div>

        {currentPicks.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No picks yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {currentPicks.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-slate-800">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{p.brand.name}</span>
                </div>
                <form action={adminRemoveEditorsPick}>
                  <input type="hidden" name="productId" value={p.id} />
                  <button
                    type="submit"
                    className="text-xs text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
