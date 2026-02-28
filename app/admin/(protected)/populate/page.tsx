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
  return parts.length ? parts.join(", ") : "—";
}

function ingestionStats(stats: unknown) {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof (s as { brandsProcessed?: number }).brandsProcessed === "number") parts.push(`brands: ${(s as { brandsProcessed: number }).brandsProcessed}`);
  if (typeof (s as { productsProcessed?: number }).productsProcessed === "number") parts.push(`products: ${(s as { productsProcessed: number }).productsProcessed}`);
  if (typeof (s as { errorsCount?: number }).errorsCount === "number") parts.push(`errors: ${(s as { errorsCount: number }).errorsCount}`);
  return parts.length ? parts.join(", ") : "—";
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

  let metrics = await getAdminMetrics();
  const [ingestionRuns, jobRuns] = await Promise.all([
    prisma.ingestionRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { job: { select: { name: true, type: true } } },
    }),
  ]);
  const hasRunning = ingestionRuns.some((r) => r.status === "RUNNING") || jobRuns.some((r) => r.status === "RUNNING");
  const shouldAutoRefresh = hasRunning || Boolean(started);
  const runningIngestion = ingestionRuns.filter((r) => r.status === "RUNNING");
  const runningJobs = jobRuns.filter((r) => r.status === "RUNNING");
  const runningCount = runningIngestion.length + runningJobs.length;

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
              <span className="text-xs text-sky-700">— page auto-refreshes every 4s; use <strong>View log</strong> on a run for live output</span>
            </div>
            <form action={clearStaleRunsAction} method="POST" className="mt-2 sm:mt-0">
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
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Populate database</h1>
        <p className="mt-1 text-sm text-slate-600">
          Run these steps in order. Use manual add (Brands / Products) only after you’ve run ingestion and automation.
        </p>

        {started ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Started: <span className="font-medium">{started}</span>. This page will refresh while runs are in progress.
          </div>
        ) : null}
        {ran ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Done:{" "}
            <span className="font-medium">
              {ran === "csv" ? "Listings CSV imported" : ran === "canceled_ingestion" ? "Ingestion run canceled" : ran === "canceled_job" ? "Job run canceled" : ran === "stale_cleared" ? `${count || "0"} stuck run(s) marked as failed` : ran}
            </span>.
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
        ) : null}

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">LOW completeness</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metrics.lowCompletenessCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Merge queue</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metrics.pendingMergeCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">COA public</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metrics.coaPublicCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Official URL set</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metrics.officialUrlSetCount}</div>
          </div>
        </div>

        {/* Step 1: Backbone */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">1. Load backbone (DSLD)</h2>
              <p className="mt-1 text-sm text-slate-600">
                Import shilajit products from the FDA DSLD. Run first to establish brands and products.
              </p>
            </div>
            <form action="/admin/ingestion/run" method="POST" className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
          <h2 className="text-lg font-semibold text-slate-900">2. Add listings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Run discovery (allowlist + CSV in <code className="rounded bg-slate-100 px-1">data/inbox/listings.csv</code>) or upload a Listings CSV here.
            Many retail search pages are JS-rendered, so the job often finds 0 URLs from the allowlist; use the CSV for reliable imports.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <form action="/admin/automation/run" method="POST" className="flex items-end gap-2">
              <input type="hidden" name="type" value="DISCOVERY_ROBOTS_ALLOWED" />
              <input type="hidden" name="next" value="/admin/populate" />
              <Button type="submit" variant="secondary">
                Run Discovery job
              </Button>
            </form>
            <form action={importListingsCsvAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input name="file" type="file" accept=".csv,text/csv" required className="max-w-xs" />
              <Button type="submit" variant="secondary">
                Upload Listings CSV
              </Button>
            </form>
          </div>
        </div>

        {/* Step 3: Enrich */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">3. Enrich official pages</h2>
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

        {/* Step 4: Link health */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">4. Check link health</h2>
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
              <Button type="submit" variant="secondary">Run Link check</Button>
            </form>
          </div>
        </div>

        {/* Next: Review & manual */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900">Next</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            <li>
              <Link href="/admin/discovery" className="underline underline-offset-2">
                Review merge queue
              </Link>{" "}
              — approve or reject suggested product merges.
            </li>
            <li>
              Only then add data manually: <Link href="/admin/brands" className="underline underline-offset-2">Brands</Link>
              {" · "}
              <Link href="/admin/products" className="underline underline-offset-2">Products</Link>.
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
            <div className="px-5 py-6 text-sm text-slate-600">No runs yet. Start with step 1.</div>
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
                    <span className={r.status === "SUCCESS" ? "text-emerald-600" : r.status === "FAILED" ? "text-rose-600" : r.status === "CANCELED" ? "text-slate-500" : "text-sky-600"}>{r.status === "RUNNING" ? "Running…" : r.status}</span>
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
                        <form action={cancelRunAction} method="POST" className="ml-2 inline">
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
              {ingestionRuns.map((r) => (
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
                    <span className="font-medium text-slate-900">{r.type}</span>
                    {" · "}
                    <span className={r.status === "SUCCESS" ? "text-emerald-600" : r.status === "FAILED" ? "text-rose-600" : r.status === "CANCELED" ? "text-slate-500" : "text-sky-600"}>{r.status === "RUNNING" ? "Running…" : r.status}</span>
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
                        <form action={cancelRunAction} method="POST" className="ml-2 inline">
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
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
