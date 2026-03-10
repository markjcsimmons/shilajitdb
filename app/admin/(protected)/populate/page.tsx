import { AutoRefresh } from "@/components/auto-refresh";
import { Button, Input } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getAdminMetrics } from "@/lib/adminMetrics";
import { importListingsCsv } from "@/scripts/ingest/discovery/importCsv";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelRunAction, clearStaleRunsAction } from "@/app/admin/actions";
import { PipelineButton } from "./PipelineButton";
import type { FullPipelineStats } from "@/scripts/jobs/runFullPipeline";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString();
}

function jobRunStats(stats: unknown) {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.productsProcessed === "number") parts.push(`products: ${s.productsProcessed}`);
  if (typeof s.listingsUpserted === "number") parts.push(`listings: ${s.listingsUpserted}`);
  if (typeof s.urlsDiscovered === "number") parts.push(`urls: ${s.urlsDiscovered}`);
  if (typeof s.evidenceAdded === "number") parts.push(`evidence: ${s.evidenceAdded}`);
  if (typeof s.checkedCount === "number") parts.push(`checked: ${s.checkedCount}`);
  if (typeof s.errorsCount === "number") parts.push(`errors: ${s.errorsCount}`);
  if (typeof s.rowsProcessed === "number") parts.push(`rows: ${s.rowsProcessed}`);
  if (typeof s.failed === "number") parts.push(`failed: ${s.failed}`);
  if (typeof s.listingsWritten === "number") parts.push(`written: ${s.listingsWritten}`);
  return parts.length ? parts.join(", ") : "—";
}

function ingestionStats(stats: unknown) {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.brandsProcessed === "number") parts.push(`brands: ${s.brandsProcessed}`);
  if (typeof s.productsProcessed === "number") parts.push(`products: ${s.productsProcessed}`);
  if (typeof s.errorsCount === "number") parts.push(`errors: ${s.errorsCount}`);
  return parts.length ? parts.join(", ") : "—";
}

/** Fetch the most recent pipeline IngestionRun (statsJson.isPipeline === true). */
async function getLastPipelineRun() {
  const recent = await prisma.ingestionRun.findMany({
    where: { type: "DISCOVERY" },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: { id: true, status: true, finishedAt: true, statsJson: true },
  });
  const pipelineRun = recent.find((r) => {
    const s = r.statsJson as Record<string, unknown> | null;
    return s?.isPipeline === true;
  });
  if (!pipelineRun) return null;
  return {
    status: pipelineRun.status,
    finishedAt: pipelineRun.finishedAt?.toISOString() ?? null,
    stats: pipelineRun.statsJson as FullPipelineStats | null,
  };
}

export default async function AdminPopulatePage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string; ran?: string; count?: string; error?: string }>;
}) {
  const { started, ran, count, error } = await searchParams;

  async function importListingsCsvAction(formData: FormData) {
    "use server";
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), ".cache", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const p = path.join(dir, `listings-${Date.now()}.csv`);
    await fs.writeFile(p, buf);
    await importListingsCsv({ csvPath: p, dryRun: false, wrapRun: true });
    redirect("/admin/populate?ran=csv");
  }

  const metrics = await getAdminMetrics();
  const lastPipelineRun = await getLastPipelineRun();

  const [ingestionRuns, jobRuns] = await Promise.all([
    prisma.ingestionRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { job: { select: { name: true, type: true } } },
    }),
  ]);

  const hasRunning =
    ingestionRuns.some((r) => r.status === "RUNNING") ||
    jobRuns.some((r) => r.status === "RUNNING");
  const shouldAutoRefresh = hasRunning || Boolean(started);
  const runningCount =
    ingestionRuns.filter((r) => r.status === "RUNNING").length +
    jobRuns.filter((r) => r.status === "RUNNING").length;

  const isPipelineCurrentlyRunning =
    lastPipelineRun?.status === "RUNNING";

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={shouldAutoRefresh} />

      {/* Runs in progress banner */}
      {runningCount > 0 && (
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3" aria-hidden>
                <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
              </span>
              <span className="text-sm font-medium text-sky-900">
                {runningCount} run{runningCount !== 1 ? "s" : ""} in progress
              </span>
              <span className="text-xs text-sky-700">
                — page auto-refreshes every 4 s; use{" "}
                <strong>View log</strong> on a run for live output
              </span>
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

      {/* ─── Automation Pipeline ─────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-violet-900">
              Automation Pipeline
              {isPipelineCurrentlyRunning && (
                <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse"
                    aria-hidden
                  />
                  Running
                </span>
              )}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Automatically discover official brand sites from DSLD label images, harvest product
              URLs from sitemaps, and enrich products with evidence — in one click. Recommended
              cadence: run weekly after the DSLD import.
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
              <li>① OCR-scan DSLD label images → extract brand domains (max 200 products)</li>
              <li>② Fetch sitemaps for known domains → harvest product URLs (max 50 domains × 200 URLs)</li>
              <li>③ Enrich official pages → pull COA &amp; manufacturing evidence (max 50 products)</li>
            </ul>
          </div>
        </div>

        <div className="mt-5">
          <PipelineButton lastRun={lastPipelineRun} />
        </div>
      </div>

      {/* ─── Step-by-step panel ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Manual steps
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Run steps individually for more control, or use <strong>Run Full Pipeline</strong> above
          for hands-off weekly automation.
        </p>

        {started ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Started: <span className="font-medium">{started}</span>. This page will refresh while
            runs are in progress.
            {started === "url_csv_extract" && (
              <span className="block mt-1 text-xs">
                Logs: <code className="rounded bg-sky-100 px-1">.cache/job-logs/</code> · Output:{" "}
                <code className="rounded bg-sky-100 px-1">.cache/uploads/url-csv-enriched-*.csv</code>
              </span>
            )}
          </div>
        ) : null}
        {ran ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Done:{" "}
            <span className="font-medium">
              {ran === "csv"
                ? "Listings CSV imported"
                : ran === "url_csv_extract"
                  ? "URL CSV extract started (dry run)"
                  : ran === "url_csv_extract_db"
                    ? "URL CSV extract started (writing to DB)"
                    : ran === "canceled_ingestion"
                      ? "Ingestion run canceled"
                      : ran === "canceled_job"
                        ? "Job run canceled"
                        : ran === "stale_cleared"
                          ? `${count || "0"} stuck run(s) marked as failed`
                          : ran}
            </span>
            .
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              LOW completeness
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {metrics.lowCompletenessCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Merge queue
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {metrics.pendingMergeCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              COA public
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metrics.coaPublicCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Official URL set
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {metrics.officialUrlSetCount}
            </div>
          </div>
        </div>

        {/* Step 1: DSLD import */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                  Step 1
                </span>
                Load backbone (DSLD import)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Import shilajit products from the FDA DSLD. Run first to establish brands and
                products.
              </p>
            </div>
            <form
              action="/admin/ingestion/run"
              method="POST"
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="job" value="dsld" />
              <input type="hidden" name="next" value="/admin/populate" />
              <div className="sm:w-28">
                <label className="text-xs font-medium text-slate-700">Max labels</label>
                <Input name="maxLabels" type="number" min="1" placeholder="all" className="mt-0.5" />
              </div>
              <Button type="submit">Run DSLD import</Button>
            </form>
          </div>
        </div>

        {/* Step 2: Add listings */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
              Step 2
            </span>
            Add listings (discovery / CSV)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Run robots-allowed discovery or upload a{" "}
            <code className="rounded bg-slate-100 px-1">listings.csv</code> manually.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <form action="/admin/automation/run" method="POST" className="flex items-end gap-2">
              <input type="hidden" name="type" value="DISCOVERY_ROBOTS_ALLOWED" />
              <input type="hidden" name="next" value="/admin/populate" />
              <Button type="submit" variant="secondary">
                Run Discovery job
              </Button>
            </form>
            <form
              action={importListingsCsvAction}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="max-w-xs"
              />
              <Button type="submit" variant="secondary">
                Upload Listings CSV
              </Button>
            </form>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">URL CSV extractor</h3>
            <p className="mt-1 text-xs text-slate-600">
              Upload a CSV with columns <code className="rounded bg-slate-200 px-1">name</code>,{" "}
              <code className="rounded bg-slate-200 px-1">url</code>,{" "}
              <code className="rounded bg-slate-200 px-1">source</code> (optional). Classifies URLs,
              scrapes pages, and extracts structured data. Output:{" "}
              <code className="rounded bg-slate-200 px-1">.cache/uploads/url-csv-enriched-*.csv</code>.
              By default, products are <strong>not</strong> written to the DB.
            </p>
            <form
              action="/admin/url-csv-extract"
              method="POST"
              encType="multipart/form-data"
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="next" value="/admin/populate" />
              <Input
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="max-w-xs"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="writeDb" value="true" className="rounded" />
                Write to database
              </label>
              <Button type="submit" variant="secondary">
                Run URL CSV extract
              </Button>
            </form>
          </div>
        </div>

        {/* Step 3: OCR discovery */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                  Step 3
                </span>
                Discover official domains (DSLD label OCR)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                OCR-scan DSLD label images to extract brand website domains. Creates OFFICIAL
                listings and Evidence records. Run <strong>after</strong> step 1.
              </p>
            </div>
            <form
              action="/admin/automation/run"
              method="POST"
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="type" value="DISCOVER_OFFICIAL_FROM_DSLD_IMAGES" />
              <input type="hidden" name="next" value="/admin/populate" />
              <div className="sm:w-24">
                <label className="text-xs font-medium text-slate-700">Max products</label>
                <Input name="max" type="number" defaultValue={200} min={1} className="mt-0.5" />
              </div>
              <Button type="submit" variant="secondary">
                Run OCR discovery
              </Button>
            </form>
          </div>
        </div>

        {/* Step 4: Sitemap harvest */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                  Step 4
                </span>
                Harvest product URLs from sitemaps
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                For every known official domain, fetch{" "}
                <code className="rounded bg-slate-100 px-1">sitemap.xml</code> and create OFFICIAL
                listings for product-path URLs. Run <strong>after</strong> step 3.
              </p>
            </div>
            <form
              action="/admin/automation/run"
              method="POST"
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="type" value="DISCOVER_OFFICIAL_FROM_SITEMAPS" />
              <input type="hidden" name="next" value="/admin/populate" />
              <div className="sm:w-24">
                <label className="text-xs font-medium text-slate-700">Max domains</label>
                <Input name="maxDomains" type="number" defaultValue={50} min={1} className="mt-0.5" />
              </div>
              <div className="sm:w-24">
                <label className="text-xs font-medium text-slate-700">URLs/domain</label>
                <Input name="maxUrls" type="number" defaultValue={200} min={1} className="mt-0.5" />
              </div>
              <Button type="submit" variant="secondary">
                Run sitemap harvest
              </Button>
            </form>
          </div>
        </div>

        {/* Step 5: Enrich */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                  Step 5
                </span>
                Enrich official pages
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Pull COA and manufacturing evidence from official brand sites (robots-respecting).
              </p>
            </div>
            <form action="/admin/automation/run" method="POST" className="flex items-end gap-2">
              <input type="hidden" name="type" value="ENRICH_OFFICIAL" />
              <input type="hidden" name="next" value="/admin/populate" />
              <div className="w-20">
                <Input name="max" type="number" defaultValue={50} min={1} className="py-2" />
              </div>
              <Button type="submit">Run Enrich</Button>
            </form>
          </div>
        </div>

        {/* Step 6: Link health */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                  Step 6
                </span>
                Check link health
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Verify product and evidence URLs; mark dead OFFICIAL listings.
              </p>
            </div>
            <form action="/admin/automation/run" method="POST" className="flex items-end gap-2">
              <input type="hidden" name="type" value="LINK_HEALTH" />
              <input type="hidden" name="next" value="/admin/populate" />
              <div className="w-20">
                <Input name="max" type="number" defaultValue={200} min={1} className="py-2" />
              </div>
              <Button type="submit" variant="secondary">
                Run Link check
              </Button>
            </form>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900">After running</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            <li>
              <Link href="/admin/discovery" className="underline underline-offset-2">
                Review merge queue
              </Link>{" "}
              — approve or reject suggested product merges.
            </li>
            <li>
              Add data manually if needed:{" "}
              <Link href="/admin/brands" className="underline underline-offset-2">
                Brands
              </Link>
              {" · "}
              <Link href="/admin/products" className="underline underline-offset-2">
                Products
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Recent activity
        </div>
        <div className="divide-y divide-slate-200">
          {ingestionRuns.length === 0 && jobRuns.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              No runs yet. Start with step 1 or Run Full Pipeline.
            </div>
          ) : (
            <>
              {jobRuns.map((r) => (
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
                      <>
                        <Link
                          href={`/admin/logs?type=${encodeURIComponent(r.job.type)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 underline underline-offset-2 hover:text-sky-800"
                        >
                          View log
                        </Link>
                        <form action={cancelRunAction} className="ml-2 inline">
                          <input type="hidden" name="runId" value={r.id} />
                          <input type="hidden" name="kind" value="job_run" />
                          <input type="hidden" name="next" value="/admin/populate" />
                          <Button type="submit" variant="secondary" className="!py-1 text-xs">
                            Cancel
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                  {r.status === "RUNNING" && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-sky-200">
                      <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
                    </div>
                  )}
                </div>
              ))}
              {ingestionRuns.map((r) => {
                const isPipelineRun =
                  (r.statsJson as Record<string, unknown> | null)?.isPipeline === true;
                return (
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
                      <span className="font-medium text-slate-900">
                        {isPipelineRun ? "Full Pipeline" : r.type}
                      </span>
                      {isPipelineRun && (
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">
                          pipeline
                        </span>
                      )}
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
                        <span className="ml-2 text-slate-500">— {ingestionStats(r.statsJson)}</span>
                      )}
                      {r.status === "RUNNING" && (
                        <>
                          <Link
                            href={`/admin/logs?kind=ingestion&type=${encodeURIComponent(r.type)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 underline underline-offset-2 hover:text-sky-800"
                          >
                            View log
                          </Link>
                          <form action={cancelRunAction} className="ml-2 inline">
                            <input type="hidden" name="runId" value={r.id} />
                            <input type="hidden" name="kind" value="ingestion" />
                            <input type="hidden" name="next" value="/admin/populate" />
                            <Button type="submit" variant="secondary" className="!py-1 text-xs">
                              Cancel
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                    {r.status === "RUNNING" && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-sky-200">
                        <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
