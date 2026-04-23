import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recent updates — Shilajit Transparency Database",
  description: "Latest product additions and data updates to the Shilajit Transparency Database.",
  alternates: { canonical: absoluteUrl("/updates") },
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function isNew(createdAt: Date, updatedAt: Date) {
  return Math.abs(updatedAt.getTime() - createdAt.getTime()) < 60_000;
}

export default async function UpdatesPage() {
  const products = await prisma.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      overallGrade: true,
      form: true,
      createdAt: true,
      updatedAt: true,
      brand: { select: { name: true, slug: true } },
    },
  });

  // Group by date (updatedAt day)
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const key = formatDate(p.updatedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const gradeLabel = (g: string | null) => g?.replace("_PLUS", "+") ?? "—";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Recent updates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Latest product additions and data changes — most recent first.
        </p>
      </div>

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([date, items]) => (
          <div key={date}>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {date}
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
              {items.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {/* Grade badge */}
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700">
                    {gradeLabel(p.overallGrade)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${p.slug}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-stone-400 mt-0.5">
                      <Link href={`/brand/${p.brand.slug}`} className="hover:underline">
                        {p.brand.name}
                      </Link>
                      {" · "}
                      {p.form.charAt(0) + p.form.slice(1).toLowerCase()}
                    </div>
                  </div>

                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isNew(p.createdAt, p.updatedAt)
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-stone-50 text-stone-500 border border-stone-200"
                  }`}>
                    {isNew(p.createdAt, p.updatedAt) ? "New" : "Updated"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
