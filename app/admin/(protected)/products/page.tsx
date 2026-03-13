import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"] as const;

const FORM_LABELS: Record<string, string> = {
  RESIN: "Resin",
  POWDER: "Powder",
  CAPSULE: "Capsules",
  GUMMY: "Gummies",
  LIQUID: "Liquid",
  BLEND: "Blend",
  OTHER: "Other",
};
function formLabel(form: string) {
  return FORM_LABELS[form] ?? form;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; grade?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const gradeFilter = params.grade && GRADE_ORDER.includes(params.grade as (typeof GRADE_ORDER)[number])
    ? (params.grade as (typeof GRADE_ORDER)[number])
    : null;

  const where = gradeFilter ? { overallGrade: gradeFilter } : undefined;

  const [products, total, ...gradeCounts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        form: true,
        officialCanonicalUrl: true,
        transparencyGrade: true,
        qualityTier: true,
        overallGrade: true,
        brand: { select: { name: true } },
        _count: { select: { evidence: true } },
      },
    }),
    prisma.product.count({ where }),
    ...GRADE_ORDER.map((g) => prisma.product.count({ where: { overallGrade: g } })),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const distribution = GRADE_ORDER.map((g, i) => ({ grade: g, count: gradeCounts[i] ?? 0 }));

  function pageUrl(nextPage: number) {
    const q = new URLSearchParams();
    if (nextPage > 1) q.set("page", String(nextPage));
    if (gradeFilter) q.set("grade", gradeFilter);
    const s = q.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-600">Create and edit product records.</p>
        </div>
        <Button href="/admin/products/new">New product</Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall grade distribution</div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          {distribution.map(({ grade, count }) => {
            const isActive = gradeFilter === grade;
            const label = (
              <>
                <Badge variant={grade === "A_PLUS" || grade === "A" ? "default" : grade === "E" || grade === "F" ? "muted" : "outline"}>
                  {grade.replace("_PLUS", "+")}
                </Badge>
                <span className={count > 0 ? "text-slate-700 font-medium" : "text-slate-400"}>{count}</span>
              </>
            );
            return (
              <span key={grade} className="flex items-center gap-1.5">
                {count > 0 ? (
                  <Link
                    href={`/admin/products?grade=${grade}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-1 -mx-1 transition hover:bg-slate-200/80 ${isActive ? "ring-2 ring-slate-400 ring-offset-2" : ""}`}
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-1 -mx-1 opacity-70">
                    {label}
                  </span>
                )}
              </span>
            );
          })}
          <Link
            href="/admin/products"
            className={`text-slate-500 hover:text-slate-700 ${!gradeFilter ? "font-medium" : ""}`}
          >
            Total: {total}
          </Link>
        </div>
        {gradeFilter && (
          <p className="mt-2 text-xs text-slate-600">
            Showing grade {gradeFilter.replace("_PLUS", "+")}.{" "}
            <Link href="/admin/products" className="underline underline-offset-2">Show all</Link>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Recompute all: <code className="rounded bg-slate-200 px-1">npm run db:recompute-overall-grades</code>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid-cols-12">
          <div className="sm:col-span-3">Product</div>
          <div className="sm:col-span-2">Brand</div>
          <div className="sm:col-span-1">Slug</div>
          <div className="sm:col-span-1">Form</div>
          <div className="sm:col-span-2">Product URL</div>
          <div>Overall</div>
          <div>Trans.</div>
          <div>Tier</div>
          <div className="text-right">Edit</div>
        </div>
        <div className="divide-y divide-slate-200">
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 gap-1 px-5 py-4 text-sm text-slate-700 sm:grid-cols-12 sm:items-center"
            >
              <div className="font-medium text-slate-900 sm:col-span-3">
                {p.name}{" "}
                <Badge variant="muted" title="Evidence items">
                  {p._count.evidence} evidence
                </Badge>
              </div>
              <div className="sm:col-span-2">{p.brand.name}</div>
              <div className="sm:col-span-1 truncate" title={p.slug}>{p.slug}</div>
              <div className="sm:col-span-1">{formLabel(p.form)}</div>
              <div className="sm:col-span-2 min-w-0">
                {p.officialCanonicalUrl ? (
                  <a
                    href={p.officialCanonicalUrl}
                    target="_blank"
                    rel="nofollow"
                    className="truncate block text-slate-600 underline underline-offset-2 hover:text-slate-900"
                    title={p.officialCanonicalUrl}
                  >
                    {(() => {
                    const s = p.officialCanonicalUrl!.replace(/^https?:\/\//, "");
                    return s.length > 32 ? `${s.slice(0, 32)}…` : s;
                  })()}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <Badge variant={p.overallGrade === "A_PLUS" || p.overallGrade === "A" ? "default" : p.overallGrade === "E" || p.overallGrade === "F" ? "muted" : "outline"}>
                  {p.overallGrade?.replace("_PLUS", "+") ?? "—"}
                </Badge>
              </div>
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
                href={pageUrl(page - 1)}
                className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageUrl(page + 1)}
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

