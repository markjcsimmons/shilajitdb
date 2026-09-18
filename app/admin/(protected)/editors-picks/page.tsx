import { prisma } from "@/lib/db";
import { EDITORS_PICK, RANK_SELECT, rankForTag } from "@/lib/best-for-tags";
import { requireAdmin } from "@/lib/admin-auth";
import { gradeLabel } from "@/lib/grade-colors";

export const dynamic = "force-dynamic";

export default async function EditorsPicksPage() {
  await requireAdmin();

  const picks = rankForTag(
    "editors_pick",
    await prisma.product.findMany({
      where: { bestForTags: { has: "editors_pick" } },
      select: { ...RANK_SELECT, brand: { select: { name: true, slug: true } } },
    }),
  );

  const how = (slug: string) =>
    EDITORS_PICK.first.includes(slug) ? "pinned first" : EDITORS_PICK.include.includes(slug) ? "manual include" : "rule";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Editor&apos;s Picks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Picks are rebuilt automatically after every grade change, in this order: the pinned product, then A+ and
          then A products that appear on at least {EDITORS_PICK.minCategories} other /best lists, at most 2 per
          brand. Manual overrides (<code>first</code>, <code>include</code>, <code>exclude</code>) are the{" "}
          <code>EDITORS_PICK</code> lists in <code>lib/best-for-tags.ts</code>. The first 5 show on{" "}
          <a href="/best/editors-pick" target="_blank" className="underline hover:text-slate-800">
            /best/editors-pick
          </a>{" "}
          and the homepage.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-slate-800">
            Current picks{" "}
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{picks.length}</span>
          </h2>
        </div>

        {picks.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No picks yet.</p>
        ) : (
          <ol className="divide-y divide-stone-100">
            {picks.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <span className="mr-2 text-xs text-slate-400">{i + 1}.</span>
                  <span className="text-sm font-medium text-slate-800">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{p.brand.name}</span>
                </div>
                <div className="shrink-0 text-xs text-slate-500">
                  {p.overallGrade ? gradeLabel(p.overallGrade) : "—"} · {how(p.slug)}
                  {i >= 5 && " · not shown"}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
