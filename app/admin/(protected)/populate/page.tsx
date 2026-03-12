import { AutoRefresh } from "@/components/auto-refresh";
import { Button, Input } from "@/components/ui";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelRunAction, clearStaleRunsAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString();
}

function jobRunStats(stats: unknown) {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.rowsProcessed === "number") parts.push(`rows: ${s.rowsProcessed}`);
  if (typeof s.listingsWritten === "number") parts.push(`updated: ${s.listingsWritten}`);
  if (typeof s.failed === "number") parts.push(`failed: ${s.failed}`);
  return parts.length ? parts.join(", ") : "—";
}

export default async function AdminPopulatePage({
  searchParams,
}: {
  searchParams: Promise<{
    started?: string;
    ran?: string;
    imported?: string;
    count?: string;
    error?: string;
  }>;
}) {
  const { started, ran, imported, count, error } = await searchParams;

  async function addEntryAction(formData: FormData) {
    "use server";
    const brandName = String(formData.get("brandName") ?? "").trim();
    const brandUrl = String(formData.get("brandUrl") ?? "").trim();
    const productUrlsRaw = String(formData.get("productUrls") ?? "").trim();
    if (!brandName) redirect("/admin/populate?error=Brand+name+required");
    const urls = productUrlsRaw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 10 && (u.startsWith("http") || /^[a-z0-9][a-z0-9.-]*\.(com|in|org|net|co)(\/|$)/i.test(u)));
    const normalizedUrl = (u: string) => (u.startsWith("http") ? u : `https://${u}`);
    const { slugify } = await import("@/lib/slug");
    const { deriveWebsiteDomain } = await import("@/lib/url");
    const { canonicalizeUrl, extractDomain } = await import("@/lib/urlCanonicalize");
    let brand = await prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: "insensitive" } },
      select: { id: true },
    });
    if (!brand) {
      const slug = slugify(brandName) || `brand-${Date.now()}`;
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          slug,
          website: brandUrl ? normalizedUrl(brandUrl) : null,
          websiteDomain: deriveWebsiteDomain(brandUrl ? normalizedUrl(brandUrl) : null),
        },
        select: { id: true },
      });
    } else {
      if (brandUrl) {
        await prisma.brand.update({
          where: { id: brand.id },
          data: {
            website: normalizedUrl(brandUrl),
            websiteDomain: deriveWebsiteDomain(normalizedUrl(brandUrl)),
          },
        });
      }
    }
    let created = 0;
    for (let i = 0; i < urls.length; i++) {
      const url = normalizedUrl(urls[i]);
      const canonical = canonicalizeUrl(url);
      const existing = await prisma.product.findFirst({
        where: { officialCanonicalUrl: canonical },
        select: { id: true },
      });
      if (existing) continue;
      const slug = `${slugify(brandName)}-${i + 1}-${Math.random().toString(36).slice(2, 8)}`;
      await prisma.product.create({
        data: {
          brandId: brand.id,
          name: `${brandName} – Product ${i + 1}`,
          slug,
          form: "OTHER",
          ingredientText: "",
          ingredientsNormalized: [],
          manufacturingClarity: "NOT_STATED",
          coaStatus: "UNKNOWN",
          transparencyGrade: "F",
          qualityTier: "POOR",
          officialCanonicalUrl: canonical,
          officialDomain: extractDomain(url),
          dataCompleteness: "LOW",
        },
      });
      created++;
    }
    redirect(`/admin/populate?ran=add_entry&imported=${encodeURIComponent(`${created} products added`)}`);
  }

  const [productCount, crawlableCount, jobRuns] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { officialCanonicalUrl: { not: null } } }),
    prisma.jobRun.findMany({
      where: { job: { type: "URL_CSV_EXTRACT" } },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { job: { select: { name: true } } },
    }),
  ]);

  const hasRunning = jobRuns.some((r) => r.status === "RUNNING");
  const shouldAutoRefresh = hasRunning || Boolean(started);

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={shouldAutoRefresh} />

      {hasRunning && (
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3" aria-hidden>
                <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
              </span>
              <span className="text-sm font-medium text-sky-900">CRAWL in progress</span>
              <span className="text-xs text-sky-700">— page auto-refreshes every 4 s</span>
            </div>
            <form action={clearStaleRunsAction} className="mt-2 sm:mt-0">
              <input type="hidden" name="next" value="/admin/populate" />
              <Button type="submit" variant="secondary" className="text-xs">
                Clear stuck runs
              </Button>
            </form>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sky-200">
            <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Populate database
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload a CSV (BRAND, BRAND URL, PRODUCT 1, PRODUCT 2…) to create brands and products, then run <strong>CRAWL</strong> to fill in details from each product page.
        </p>

        {started && (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Started: <span className="font-medium">{started}</span>. Logs:{" "}
            <code className="rounded bg-sky-100 px-1">.cache/job-logs/</code>
          </div>
        )}
        {ran && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {ran === "import" && imported ? (
              <>Import: {imported}</>
            ) : ran === "crawl" ? (
              <>CRAWL started. It will fetch each product page and update the database.</>
            ) : ran === "add_entry" && imported ? (
              <>{imported}</>
            ) : ran === "stale_cleared" ? (
              <>Cleared {count || "0"} stuck run(s).</>
            ) : (
              <>Done: {ran}</>
            )}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Products</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{productCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">With URL (crawlable)</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{crawlableCount}</div>
          </div>
        </div>

        {/* 1. Upload CSV */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">1. Upload CSV</h2>
          <p className="mt-1 text-sm text-slate-600">
            CSV with columns <code className="rounded bg-slate-100 px-1">BRAND</code>,{" "}
            <code className="rounded bg-slate-100 px-1">BRAND URL</code>,{" "}
            <code className="rounded bg-slate-100 px-1">PRODUCT 1</code>,{" "}
            <code className="rounded bg-slate-100 px-1">PRODUCT 2</code>, etc. Creates brands and products (with URLs). Duplicate URLs are skipped.
          </p>
          <form
            action={`/admin/import-csv?next=${encodeURIComponent("/admin/populate")}`}
            method="POST"
            encType="multipart/form-data"
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input name="file" type="file" accept=".csv,text/csv" required className="max-w-xs" />
            <Button type="submit">Import CSV</Button>
          </form>
        </div>

        {/* 2. CRAWL */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">2. CRAWL</h2>
          <p className="mt-1 text-sm text-slate-600">
            Visit each product URL in the database and pull in name, ingredients, COA, manufacturing, form. Run after importing.
          </p>
          <form
            action={`/admin/crawl?next=${encodeURIComponent("/admin/populate")}`}
            method="POST"
            className="mt-3"
          >
            <Button type="submit" variant="secondary" disabled={crawlableCount === 0}>
              CRAWL ({crawlableCount} products)
            </Button>
          </form>
        </div>

        {/* 3. Add entry */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">3. Add entry</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add one brand and its product URLs. Then run CRAWL to fill details.
          </p>
          <form action={addEntryAction} className="mt-3 flex flex-col gap-3 max-w-md">
            <div>
              <label className="text-xs font-medium text-slate-700">Brand name</label>
              <Input name="brandName" required placeholder="Brand Name" className="mt-0.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Brand URL (optional)</label>
              <Input name="brandUrl" type="url" placeholder="https://…" className="mt-0.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Product URLs (one per line or comma-separated)</label>
              <textarea
                name="productUrls"
                rows={4}
                placeholder="https://…&#10;https://…"
                className="mt-0.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <Button type="submit" variant="secondary">Add entry</Button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <Link href="/admin/brands" className="underline underline-offset-2">Brands</Link>
            {" · "}
            <Link href="/admin/products" className="underline underline-offset-2">Products</Link>
            {" · "}
            <Link href="/admin/data" className="underline underline-offset-2">Data</Link>
            {" — edit or export/import CSV."}
          </p>
        </div>
      </div>

      {/* Recent CRAWL runs */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Recent CRAWL runs
        </div>
        <div className="divide-y divide-slate-200">
          {jobRuns.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              No CRAWL runs yet.
            </div>
          ) : (
            jobRuns.map((r) => (
              <div
                key={r.id}
                className={`px-5 py-3 text-sm text-slate-700 ${r.status === "RUNNING" ? "border-l-4 border-sky-500 bg-sky-50/50" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {r.status === "RUNNING" && (
                    <span className="relative flex h-2 w-2" aria-hidden>
                      <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    </span>
                  )}
                  <span className="font-medium text-slate-900">{r.job.name}</span>
                  {" · "}
                  <span
                    className={
                      r.status === "SUCCESS"
                        ? "text-emerald-600"
                        : r.status === "FAILED"
                          ? "text-rose-600"
                          : r.status === "CANCELED"
                            ? "text-slate-500"
                            : "text-sky-600"
                    }
                  >
                    {r.status === "RUNNING" ? "Running…" : r.status}
                  </span>
                  {" · "}
                  {fmtDate(r.startedAt)}
                  {r.statsJson && r.status !== "RUNNING" && (
                    <span className="ml-2 text-slate-500">— {jobRunStats(r.statsJson)}</span>
                  )}
                  {r.status === "RUNNING" && (
                    <Link
                      href="/admin/logs?type=URL_CSV_EXTRACT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sky-600 underline underline-offset-2"
                    >
                      View log
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
