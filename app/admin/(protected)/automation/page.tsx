import { Button, Input } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { prisma } from "@/lib/db";
import { getAdminMetrics } from "@/lib/adminMetrics";
import { cancelRunAction, clearStaleRunsAction } from "@/app/admin/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString();
}

function statsSummary(stats: unknown) {
  if (!stats || typeof stats !== "object") return "—";
  const s = stats as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.productsProcessed === "number") parts.push(`products: ${s.productsProcessed}`);
  if (typeof s.productsScanned === "number") parts.push(`scanned: ${s.productsScanned}`);
  if (typeof s.evidenceAdded === "number") parts.push(`evidence: ${s.evidenceAdded}`);
  if (typeof s.evidenceCreated === "number") parts.push(`evidence: ${s.evidenceCreated}`);
  if (typeof s.checkedCount === "number") parts.push(`checked: ${s.checkedCount}`);
  if (typeof s.deadCount === "number") parts.push(`dead: ${s.deadCount}`);
  if (typeof s.urlsDiscovered === "number") parts.push(`urls: ${s.urlsDiscovered}`);
  if (typeof s.listingsUpserted === "number") parts.push(`listings: ${s.listingsUpserted}`);
  if (typeof s.officialListingsCreated === "number") parts.push(`listings: ${s.officialListingsCreated}`);
  if (typeof s.domainsFound === "number") parts.push(`domains: ${s.domainsFound}`);
  if (typeof s.domainsScanned === "number") parts.push(`domains: ${s.domainsScanned}`);
  if (typeof s.sitemapsFetched === "number") parts.push(`sitemaps: ${s.sitemapsFetched}`);
  if (typeof s.productUrlsFound === "number") parts.push(`productUrls: ${s.productUrlsFound}`);
  if (typeof s.placeholdersCreated === "number") parts.push(`placeholders: ${s.placeholdersCreated}`);
  if (typeof s.mergeCandidatesCreated === "number") parts.push(`merges: ${s.mergeCandidatesCreated}`);
  if (typeof s.errorsCount === "number") parts.push(`errors: ${s.errorsCount}`);
  return parts.length ? parts.join(", ") : "—";
}

export default async function AdminAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string; ran?: string; count?: string; error?: string }>;
}) {
  const { started, ran, count, error } = await searchParams;

  let jobs: Awaited<ReturnType<typeof prisma.job.findMany>> = [];
  let recentRuns: Awaited<ReturnType<typeof prisma.jobRun.findMany>> = [];
  let metrics: Awaited<ReturnType<typeof getAdminMetrics>> | null = null;
  let loadError: string | null = null;

  try {
    const prismaAny = prisma as { job?: { findMany: unknown }; jobRun?: { findMany: unknown } };
    if (typeof prismaAny.job?.findMany !== "function" || typeof prismaAny.jobRun?.findMany !== "function") {
      loadError =
        "Prisma client is out of date (missing Job/JobRun models). Run from the project directory: npx prisma generate — then restart the dev server (npm run dev).";
    } else {
      const [jobsResult, runsResult, metricsResult] = await Promise.all([
        prisma.job.findMany({
          orderBy: { type: "asc" },
          include: {
            runs: { orderBy: { startedAt: "desc" }, take: 1 },
          },
        }),
        prisma.jobRun.findMany({
          orderBy: { startedAt: "desc" },
          take: 20,
          include: { job: { select: { type: true, name: true } } },
        }),
        getAdminMetrics(),
      ]);
      jobs = jobsResult;
      recentRuns = runsResult;
      metrics = metricsResult;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isClientOutOfDate = msg.includes("findMany") && msg.includes("undefined");
    const isMissingTables = msg.includes("does not exist") || msg.includes("Unknown arg");
    loadError = isClientOutOfDate
      ? "Prisma client is out of date (missing Job/JobRun models). Run from the project directory: npx prisma generate — then restart the dev server (npm run dev)."
      : isMissingTables
        ? "Automation tables missing. From the project directory run: npx prisma migrate deploy && npx prisma generate && npx prisma db seed"
        : msg;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-xl font-semibold text-rose-900">Automation</h1>
          <p className="mt-2 text-sm text-rose-800">{loadError}</p>
          <p className="mt-2 text-xs text-rose-700">
            Run from the project folder:{" "}
            <code className="rounded bg-rose-100 px-1">cd /Users/mark/Desktop/CURSOR/ShilajitDB</code> then the
            commands above.
          </p>
        </div>
      </div>
    );
  }

  const metricsSafe = metrics ?? {
    lowCompletenessCount: 0,
    pendingMergeCount: 0,
    coaPublicCount: 0,
    officialUrlSetCount: 0,
  };

  const runningCount = recentRuns.filter((r) => r.status === "RUNNING").length;

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={runningCount > 0 || Boolean(started)} />
      {runningCount > 0 && (
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3" aria-hidden>
                <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
              </span>
              <span className="text-sm font-medium text-sky-900">
                {runningCount} job run{runningCount !== 1 ? "s" : ""} in progress
              </span>
              <span className="text-xs text-sky-700">— page auto-refreshes every 4s</span>
            </div>
            <form action={clearStaleRunsAction} className="mt-2 sm:mt-0">
              <input type="hidden" name="next" value="/admin/automation" />
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
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Automation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Scheduled and on-demand jobs for enrichment, link health, and safe discovery. Amazon/Walmart/Google
          Shopping are not scraped; use CSV or API.
        </p>

        {started ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Job started: <span className="font-medium">{started}</span>. Check recent runs below.
          </div>
        ) : null}
        {ran === "stale_cleared" ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span className="font-medium">{count || "0"} stuck run(s) marked as failed.</span>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error === "invalid_type"
              ? "Invalid job type."
              : error === "job_disabled"
                ? "Job is disabled. Enable it first."
                : error === "missing_job"
                  ? "Missing job."
                  : error === "already_running"
                    ? "A run is already in progress for this job. Wait for it to finish or cancel it."
                    : error === "run_failed"
                      ? "Failed to start the job run."
                      : "Error."}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Products (LOW completeness)
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metricsSafe.lowCompletenessCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Merge queue (pending)
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metricsSafe.pendingMergeCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">COA public</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metricsSafe.coaPublicCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Official URL set</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{metricsSafe.officialUrlSetCount}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Jobs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Schedule (UTC)</th>
                <th className="py-2 pr-4">Enabled</th>
                <th className="py-2 pr-4">Last run</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.map((job) => {
                const lastRun = job.runs[0];
                return (
                  <tr key={job.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{job.type}</td>
                    <td className="py-3 pr-4 text-slate-700">{job.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{job.schedule ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={job.isEnabled ? "text-emerald-600" : "text-slate-500"}>
                        {job.isEnabled ? "Yes" : "No"}
                      </span>
                      <form action="/admin/automation/toggle" method="POST" className="ml-2 inline">
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="isEnabled" value={job.isEnabled ? "0" : "1"} />
                        <Button type="submit" variant="secondary" className="!py-1 text-xs">
                          {job.isEnabled ? "Disable" : "Enable"}
                        </Button>
                      </form>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {lastRun ? (
                        <>
                          {lastRun.status} · {fmtDate(lastRun.startedAt)}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {job.isEnabled && (
                        <form action="/admin/automation/run" method="POST" className="inline">
                          <input type="hidden" name="type" value={job.type} />
                          {job.type === "ENRICH_OFFICIAL" ? (
                            <span className="inline-flex items-center gap-2">
                              <Input name="max" type="number" defaultValue={50} className="!w-20 !py-1 text-sm" />
                              <Button type="submit">Run now</Button>
                            </span>
                          ) : job.type === "LINK_HEALTH" ? (
                            <span className="inline-flex items-center gap-2">
                              <Input name="max" type="number" defaultValue={200} className="!w-20 !py-1 text-sm" />
                              <Button type="submit">Run now</Button>
                            </span>
                          ) : job.type === "DISCOVER_OFFICIAL_FROM_DSLD_IMAGES" ? (
                            <span className="inline-flex items-center gap-2">
                              <Input name="max" type="number" defaultValue={200} className="!w-20 !py-1 text-sm" title="Max products" />
                              <Button type="submit">Run now</Button>
                            </span>
                          ) : job.type === "DISCOVER_OFFICIAL_FROM_SITEMAPS" ? (
                            <span className="inline-flex items-center gap-2">
                              <Input name="maxDomains" type="number" defaultValue={50} className="!w-16 !py-1 text-sm" title="Max domains" />
                              <Input name="maxUrls" type="number" defaultValue={200} className="!w-16 !py-1 text-sm" title="URLs/domain" />
                              <Button type="submit">Run now</Button>
                            </span>
                          ) : (
                            <Button type="submit">Run now</Button>
                          )}
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent runs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Started</th>
                <th className="py-2 pr-4">Finished</th>
                <th className="py-2 pr-4">Stats</th>
                <th className="py-2 pr-4">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentRuns.map((r) => (
                <tr key={r.id} className={r.status === "RUNNING" ? "bg-sky-50/50" : undefined}>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {r.job.name} ({r.job.type})
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {r.status === "RUNNING" && (
                        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                          <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                        </span>
                      )}
                      <span
                        className={
                          r.status === "SUCCESS"
                            ? "text-emerald-600"
                            : r.status === "FAILED"
                              ? "text-rose-600"
                              : r.status === "RUNNING"
                                ? "text-sky-600"
                                : r.status === "CANCELED"
                                  ? "text-slate-500"
                                  : "text-slate-600"
                        }
                      >
                        {r.status === "RUNNING" ? "Running…" : r.status}
                      </span>
                    </div>
                    {r.status === "RUNNING" && (
                      <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-sky-200">
                        <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
                      </div>
                    )}
                    {r.status === "RUNNING" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/logs?type=${encodeURIComponent(r.job.type)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 underline underline-offset-2 hover:text-sky-800 text-xs"
                        >
                          View log
                        </Link>
                        <form action={cancelRunAction} className="inline">
                          <input type="hidden" name="runId" value={r.id} />
                          <input type="hidden" name="kind" value="job_run" />
                          <input type="hidden" name="next" value="/admin/automation" />
                          <Button type="submit" variant="secondary" className="!py-1 text-xs">
                            Cancel
                          </Button>
                        </form>
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{fmtDate(r.startedAt)}</td>
                  <td className="py-3 pr-4 text-slate-600">{fmtDate(r.finishedAt)}</td>
                  <td className="py-3 pr-4 text-slate-600 max-w-xs truncate" title={typeof r.statsJson === "object" && r.statsJson != null ? JSON.stringify(r.statsJson) : ""}>
                    {statsSummary(r.statsJson)}
                  </td>
                  <td className="py-3 pr-4 text-rose-700 max-w-xs truncate">{r.errorText ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentRuns.length === 0 ? (
          <div className="py-4 text-sm text-slate-600">No job runs yet.</div>
        ) : null}
      </div>
    </div>
  );
}
