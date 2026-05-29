import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

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
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <h1 className="font-serif text-xl font-semibold text-[#EEF0F8]">Recent updates</h1>
        <p className="mt-1 text-sm text-[#8892B8]">
          Latest product additions and data changes — most recent first.
        </p>
      </div>

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([date, items]) => (
          <div key={date}>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#4A5070]">
              {date}
            </div>
            <div className="rounded-lg border border-[#252A40] bg-[#0F1320] divide-y divide-[#252A40]">
              {items.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {/* Grade badge */}
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-[#1F2540] flex items-center justify-center text-xs font-bold font-mono text-[#8892B8]">
                    {gradeLabel(p.overallGrade)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${p.slug}`}
                      className="text-sm font-medium text-[#EEF0F8] hover:text-[#6E9FFF] transition-colors"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-[#4A5070] mt-0.5">
                      <Link href={`/brand/${p.brand.slug}`} className="hover:text-[#8892B8] transition-colors">
                        {p.brand.name}
                      </Link>
                      {" · "}
                      {p.form.charAt(0) + p.form.slice(1).toLowerCase()}
                    </div>
                  </div>

                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isNew(p.createdAt, p.updatedAt)
                      ? "bg-[#052010] text-[#22C55E] border border-[#22C55E]/30"
                      : "bg-[#1F2540] text-[#4A5070] border border-[#252A40]"
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
