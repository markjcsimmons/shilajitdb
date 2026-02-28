import { AutoRefresh } from "@/components/auto-refresh";
import { Button, Input } from "@/components/ui";
import { cancelIngestionRun } from "@/lib/ingestion/cancelIngestionRun";
import { prisma } from "@/lib/db";
import { importBrandWebsiteCsv } from "@/scripts/ingest/discovery/importBrandWebsiteCsv";
import fs from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString();
}

function numFromStats(stats: unknown, key: string) {
  if (!stats || typeof stats !== "object") return 0;
  const v = (stats as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default async function AdminIngestionPage({
  searchParams,
}: {
  searchParams: Promise<{ ran?: string; started?: string }>;
}) {
  const { ran, started } = await searchParams;

  async function importBrandWebsiteCsvAction(formData: FormData) {
    "use server";
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), ".cache", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const p = path.join(dir, `discovery-${Date.now()}.csv`);
    await fs.writeFile(p, buf);
    await importBrandWebsiteCsv({ csvPath: p, dryRun: false });
    redirect("/admin/ingestion?ran=brand_website_csv");
  }

  async function cancelIngestionRunAction(runId: string) {
    "use server";
    await cancelIngestionRun(runId);
    redirect("/admin/ingestion?ran=canceled");
  }

  const runs = await prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 25,
  });
  const hasRunning = runs.some((r) => r.status === "RUNNING");
  const shouldAutoRefresh = hasRunning || Boolean(started);

  return (
    <div className="space-y-4">
      <AutoRefresh enabled={shouldAutoRefresh} />
      {hasRunning && (
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3" aria-hidden>
              <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
            </span>
            <span className="text-sm font-medium text-sky-900">Run in progress</span>
            <span className="text-xs text-sky-700">— page auto-refreshes every 4s</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sky-200">
            <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ingestion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Run ingestion jobs to populate and enrich the database.
        </p>
        {started ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Job started: <span className="font-medium">{started}</span>. This page will auto-refresh while runs are
            <span className="font-medium"> RUNNING</span>.
          </div>
        ) : null}
        {ran ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Job finished: <span className="font-medium">{ran}</span>. Scroll down for the latest run stats.
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action="/admin/ingestion/run" method="POST" className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="job" value="dsld" />
            <div className="sm:w-40">
              <label className="text-xs font-medium text-slate-700">Max labels</label>
              <Input name="maxLabels" type="number" min="1" placeholder="(blank = all)" />
            </div>
            <Button type="submit">Run DSLD Shilajit Import</Button>
          </form>
          <form
            action="/admin/ingestion/run"
            method="POST"
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="job" value="brand_crawl" />
            <div className="sm:w-40">
              <label className="text-xs font-medium text-slate-700">Max brands</label>
              <Input name="maxBrands" type="number" min="1" placeholder="(blank = all)" />
            </div>
            <Button type="submit" variant="secondary">
              Run Brand Crawl
            </Button>
          </form>
          <form
            action="/admin/ingestion/run"
            method="POST"
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="job" value="discover_websites" />
            <div className="sm:w-40">
              <label className="text-xs font-medium text-slate-700">Max brands</label>
              <Input name="maxBrands" type="number" min="1" placeholder="(blank = all)" />
            </div>
            <div className="sm:w-52">
              <label className="text-xs font-medium text-slate-700">Max labels/brand</label>
              <Input name="maxLabelsPerBrand" type="number" min="1" placeholder="2" />
            </div>
            <Button type="submit" variant="secondary">
              Discover Brand Websites (from DSLD labels)
            </Button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Brand website CSV import</div>
          <p className="mt-1 text-sm text-slate-600">
            Upload a CSV with columns: <code>brandName</code>, <code>website</code>,{" "}
            <code>productName</code> (optional), <code>form</code> (optional).
          </p>
          <form action={importBrandWebsiteCsvAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input name="file" type="file" accept=".csv,text/csv" required />
            <Button type="submit" variant="secondary">
              Import CSV
            </Button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Recent ingestion runs
        </div>
        <div className="divide-y divide-slate-200">
          {runs.map((r) => {
            const s: unknown = r.statsJson ?? {};
            return (
              <div
                key={r.id}
                className={`px-5 py-4 text-sm text-slate-700 ${r.status === "RUNNING" ? "border-l-4 border-sky-500 bg-sky-50/50" : ""}`}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    {r.status === "RUNNING" && (
                      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                        <span className="animate-run-pulse absolute inline-flex h-full w-full rounded-full bg-sky-500" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                      </span>
                    )}
                    <div className="font-medium text-slate-900">
                      {r.type} · {r.status === "RUNNING" ? "Running…" : r.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {fmtDate(r.startedAt)} → {fmtDate(r.finishedAt)}
                    </div>
                    {r.status === "RUNNING" ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/logs?kind=ingestion&type=${encodeURIComponent(r.type)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 underline underline-offset-2 hover:text-sky-800 text-xs"
                        >
                          View log
                        </Link>
                        <form action={cancelIngestionRunAction.bind(null, r.id)}>
                          <CancelButton />
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
                {r.status === "RUNNING" && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-sky-200">
                    <div className="h-full w-1/4 rounded-full bg-sky-500 animate-run-indeterminate" />
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-6">
                  <div>brands: {numFromStats(s, "brandsProcessed")}</div>
                  <div>products: {numFromStats(s, "productsProcessed")}</div>
                  <div>evidence: {numFromStats(s, "evidenceAdded")}</div>
                  <div>coa public: {numFromStats(s, "coaPublicCount")}</div>
                  <div>coa request: {numFromStats(s, "coaRequestCount")}</div>
                  <div>errors: {numFromStats(s, "errorsCount")}</div>
                </div>
                {r.errorText ? (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 whitespace-pre-wrap">
                    {r.errorText}
                  </div>
                ) : null}
              </div>
            );
          })}
          {runs.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-700">No ingestion runs yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

