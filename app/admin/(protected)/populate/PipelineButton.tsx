"use client";

import { useState } from "react";
import type {
  FullPipelineStats,
  StageStatus,
} from "@/scripts/jobs/runFullPipeline";

const STAGE_LABELS: Record<StageStatus, string> = {
  pending: "Pending",
  running: "Running…",
  done: "Done",
  failed: "Failed",
};

const STAGE_DOT: Record<StageStatus, string> = {
  pending: "bg-slate-300",
  running: "bg-sky-400 animate-pulse",
  done: "bg-emerald-500",
  failed: "bg-rose-500",
};

const STAGE_TEXT: Record<StageStatus, string> = {
  pending: "text-slate-400",
  running: "text-sky-600",
  done: "text-emerald-600",
  failed: "text-rose-600",
};

type LastRun = {
  status: string;
  finishedAt: string | null;
  stats: FullPipelineStats | null;
};

// ─── Stat row helper ──────────────────────────────────────────────────────────

function StatGrid({ items }: { items: [string, number | undefined, boolean?][] }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 text-sm">
      {items.map(([label, val, isError]) => (
        <div key={label}>
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd
            className={[
              "font-semibold",
              isError && (val ?? 0) > 0 ? "text-rose-600" : "text-slate-900",
            ].join(" ")}
          >
            {val ?? 0}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Stage section ────────────────────────────────────────────────────────────

function StageSection({
  stageKey,
  label,
  status,
  children,
}: {
  stageKey: string;
  label: string;
  status: StageStatus;
  children?: React.ReactNode;
}) {
  return (
    <div key={stageKey} className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className={["inline-block h-2.5 w-2.5 shrink-0 rounded-full", STAGE_DOT[status]].join(" ")}
          aria-hidden
        />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {label}
        </span>
        <span className={["ml-auto text-xs font-medium", STAGE_TEXT[status]].join(" ")}>
          {STAGE_LABELS[status]}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PipelineButton({ lastRun }: { lastRun: LastRun | null }) {
  const [state, setState] = useState<"idle" | "starting" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    setState("starting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/run-full-pipeline", { method: "POST" });
      const json = (await res.json()) as { success: boolean; error?: string };

      if (!json.success) {
        setErrorMsg(json.error ?? "Unknown error");
        setState("error");
        return;
      }

      setState("running");
      // Reload so the IngestionRun appears in Recent Activity and auto-refresh kicks in.
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setState("error");
    }
  }

  const busy = state === "starting" || state === "running";

  return (
    <div className="space-y-4">
      {/* Button row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          onClick={handleClick}
          disabled={busy}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition",
            busy
              ? "cursor-not-allowed bg-violet-300 text-white"
              : "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 cursor-pointer",
          ].join(" ")}
        >
          {busy && (
            <span
              className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden
            />
          )}
          {state === "starting"
            ? "Starting…"
            : state === "running"
              ? "Pipeline running…"
              : "Run Full Pipeline"}
        </button>

        {busy && (
          <span className="text-sm text-slate-600">
            This may take a few minutes — the page will refresh automatically.
          </span>
        )}
      </div>

      {/* Error banner */}
      {state === "error" && errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <span className="font-medium">Error: </span>
          {errorMsg}
          <button
            onClick={() => setState("idle")}
            className="ml-3 underline underline-offset-2 hover:text-rose-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pipeline results panel */}
      {lastRun && lastRun.stats && (
        <div
          className={[
            "rounded-xl border p-4 space-y-3",
            lastRun.status === "SUCCESS"
              ? "border-emerald-200 bg-emerald-50"
              : lastRun.status === "FAILED"
                ? "border-rose-200 bg-rose-50"
                : "border-sky-200 bg-sky-50",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Pipeline Results
              <span
                className={[
                  "ml-2 text-xs font-normal",
                  lastRun.status === "SUCCESS"
                    ? "text-emerald-600"
                    : lastRun.status === "FAILED"
                      ? "text-rose-600"
                      : "text-sky-600",
                ].join(" ")}
              >
                {lastRun.status === "RUNNING" ? "Running…" : lastRun.status}
              </span>
            </h3>
            <div className="flex items-center gap-3">
              {lastRun.stats.totalErrors > 0 && (
                <span className="text-xs font-medium text-rose-600">
                  {lastRun.stats.totalErrors} error{lastRun.stats.totalErrors !== 1 ? "s" : ""}
                </span>
              )}
              {lastRun.finishedAt && (
                <span className="text-xs text-slate-500">
                  {new Date(lastRun.finishedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Per-stage breakdown */}
          <div className="grid gap-2 sm:grid-cols-3">
            {/* OCR Discovery */}
            <StageSection
              stageKey="ocrDiscovery"
              label="OCR Discovery"
              status={lastRun.stats.stages.ocrDiscovery}
            >
              <StatGrid
                items={[
                  ["Products scanned", lastRun.stats.ocr.productsScanned],
                  ["Skipped (cached)", lastRun.stats.ocr.productsSkipped],
                  ["Images processed", lastRun.stats.ocr.imagesProcessed],
                  ["Cache hits", lastRun.stats.ocr.imagesCachedHit],
                  ["Domains found", lastRun.stats.ocr.domainsFound],
                  ["Listings created", lastRun.stats.ocr.officialListingsCreated],
                  ["Errors", lastRun.stats.ocr.errors, true],
                ]}
              />
            </StageSection>

            {/* Sitemap Harvest */}
            <StageSection
              stageKey="sitemapHarvest"
              label="Sitemap Harvest"
              status={lastRun.stats.stages.sitemapHarvest}
            >
              <StatGrid
                items={[
                  ["Domains scanned", lastRun.stats.sitemaps.domainsScanned],
                  ["Sitemaps fetched", lastRun.stats.sitemaps.sitemapsFetched],
                  ["Product URLs found", lastRun.stats.sitemaps.productUrlsFound],
                  ["⛔ Non-shilajit skipped", lastRun.stats.sitemaps.skippedNonShilajit ?? 0],
                  ["⏭ Already seen skipped", lastRun.stats.sitemaps.skippedAlreadySeen ?? 0],
                  ["⚠ Weak term – not confirmed", lastRun.stats.sitemaps.skippedWeakTermNotConfirmed ?? 0],
                  ["Title fetches", lastRun.stats.sitemaps.titleFetchAttempts ?? 0],
                  ["Title fetch failures", lastRun.stats.sitemaps.titleFetchFailures ?? 0, true],
                  ["🔒 Quarantined listings", lastRun.stats.sitemaps.quarantinedListingsCreated ?? 0],
                  ["Listings upserted", lastRun.stats.sitemaps.listingsUpserted],
                  ["Placeholders created", lastRun.stats.sitemaps.placeholdersCreated ?? 0],
                  ["Merge candidates", lastRun.stats.sitemaps.mergeCandidatesCreated],
                  ["Errors", lastRun.stats.sitemaps.errors, true],
                ]}
              />
            </StageSection>

            {/* Enrichment */}
            <StageSection
              stageKey="enrich"
              label="Enrichment"
              status={lastRun.stats.stages.enrich}
            >
              <StatGrid
                items={[
                  ["Products selected", lastRun.stats.enrich.productsSelected],
                  ["Products enriched", lastRun.stats.enrich.productsProcessed],
                  ["Skipped (no URL)", lastRun.stats.enrich.skippedNoProductUrl],
                  ["Evidence added", lastRun.stats.enrich.evidenceAdded],
                  ["COAs found", lastRun.stats.enrich.coaPublicFound],
                  ["Mfg claims", lastRun.stats.enrich.manufacturingFound],
                  ["Errors", lastRun.stats.enrich.errors, true],
                ]}
              />
            </StageSection>
          </div>

          {/* If a stage failed, highlight it */}
          {(lastRun.stats.stages.ocrDiscovery === "failed" ||
            lastRun.stats.stages.sitemapHarvest === "failed" ||
            lastRun.stats.stages.enrich === "failed") && (
            <p className="text-xs text-rose-700">
              One or more stages failed — partial results above are still saved.
              Check server logs for details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
