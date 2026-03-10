/**
 * Full Pipeline orchestrator.
 *
 * Runs the three discovery/enrichment stages in order:
 *   1. DSLD label image OCR → extract official brand domains
 *   2. Sitemap harvesting     → turn domains into product URLs
 *   3. Enrichment             → pull COA/manufacturing evidence
 *
 * Concurrency guard (DB-backed):
 *   - Creates an IngestionRun row with status=RUNNING at startup.
 *   - Heartbeats statsJson.heartbeatAt every 30 s.
 *   - isPipelineRunning() treats a RUNNING row with a heartbeat older than
 *     10 minutes as stale and marks it FAILED.
 *   - This works across restarts and serverless environments.
 *
 * Usage (CLI):
 *   tsx scripts/jobs/runFullPipeline.ts
 *
 * Usage (from API route):
 *   spawn(tsxCmd, ["scripts/jobs/runFullPipeline.ts"], { detached: true })
 */

import "dotenv/config";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runDsldImageDiscovery } from "@/scripts/ingest/discovery/dsld_images/discoverOfficialFromDsldImages";
import { runSitemapHarvest } from "@/scripts/ingest/discovery/sitemaps/harvestOfficialProductUrlsFromSitemaps";
import { enrichOfficialCore } from "@/scripts/ingest/enrich/enrichOfficialCore";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StageStatus = "pending" | "running" | "done" | "failed";

export type OcrStageStats = {
  productsScanned: number;
  productsSkipped: number;
  imagesProcessed: number;
  imagesCachedHit: number;
  domainsFound: number;
  officialListingsCreated: number;
  errors: number;
};

export type SitemapStageStats = {
  domainsScanned: number;
  sitemapsFetched: number;
  productUrlsFound: number;
  skippedNonShilajit: number;
  skippedAlreadySeen: number;
  skippedWeakTermNotConfirmed: number;
  titleFetchAttempts: number;
  titleFetchFailures: number;
  quarantinedListingsCreated: number;
  listingsUpserted: number;
  placeholdersCreated: number;
  mergeCandidatesCreated: number;
  errors: number;
};

export type EnrichStageStats = {
  productsSelected: number;
  productsProcessed: number;
  skippedNoProductUrl: number;
  evidenceAdded: number;
  coaPublicFound: number;
  manufacturingFound: number;
  errors: number;
};

export type FullPipelineStats = {
  isPipeline: true;
  /** ISO timestamp updated every 30 s — used as DB-backed heartbeat. */
  heartbeatAt: string;
  stages: {
    ocrDiscovery: StageStatus;
    sitemapHarvest: StageStatus;
    enrich: StageStatus;
  };
  ocr: OcrStageStats;
  sitemaps: SitemapStageStats;
  enrich: EnrichStageStats;
  /** Aggregated totals for quick summary display. */
  totalErrors: number;
};

// ─── Per-run limits ─────────────────────────────────────────────────────────────

const LIMITS = {
  ocrMax: 200,
  ocrMaxImagesPerProduct: 3,
  sitemapMaxDomains: 50,
  sitemapMaxUrlsPerDomain: 200,
  enrichMax: 50,
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] [pipeline] ${msg}`);
}

function emptyStats(): FullPipelineStats {
  return {
    isPipeline: true,
    heartbeatAt: new Date().toISOString(),
    stages: {
      ocrDiscovery: "pending",
      sitemapHarvest: "pending",
      enrich: "pending",
    },
    ocr: {
      productsScanned: 0,
      productsSkipped: 0,
      imagesProcessed: 0,
      imagesCachedHit: 0,
      domainsFound: 0,
      officialListingsCreated: 0,
      errors: 0,
    },
    sitemaps: {
      domainsScanned: 0,
      sitemapsFetched: 0,
      productUrlsFound: 0,
      skippedNonShilajit: 0,
      skippedAlreadySeen: 0,
      skippedWeakTermNotConfirmed: 0,
      titleFetchAttempts: 0,
      titleFetchFailures: 0,
      quarantinedListingsCreated: 0,
      listingsUpserted: 0,
      placeholdersCreated: 0,
      mergeCandidatesCreated: 0,
      errors: 0,
    },
    enrich: {
      productsSelected: 0,
      productsProcessed: 0,
      skippedNoProductUrl: 0,
      evidenceAdded: 0,
      coaPublicFound: 0,
      manufacturingFound: 0,
      errors: 0,
    },
    totalErrors: 0,
  };
}

/**
 * Creates the pipeline IngestionRun. Call from API route before spawn to close
 * the race where a second request could start before the first child creates its run.
 * @param pid - Process ID (null when creating from API before spawn; child will update)
 */
export async function startPipelineRun(pid: number | null = process.pid): Promise<string> {
  const run = await prisma.ingestionRun.create({
    data: {
      type: "DISCOVERY",
      status: "RUNNING",
      pid: pid ?? undefined,
      statsJson: emptyStats() as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return run.id;
}

async function heartbeat(runId: string, stats: FullPipelineStats) {
  stats.heartbeatAt = new Date().toISOString();
  await prisma.ingestionRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: { statsJson: stats as unknown as Prisma.InputJsonValue },
  });
}

async function finishPipelineRun(
  runId: string,
  status: "SUCCESS" | "FAILED",
  stats: FullPipelineStats,
  errorText?: string | null,
) {
  stats.heartbeatAt = new Date().toISOString();
  await prisma.ingestionRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status,
      finishedAt: new Date(),
      statsJson: stats as unknown as Prisma.InputJsonValue,
      errorText: errorText ?? null,
    },
  });
}

// ─── DB-backed concurrency guard ──────────────────────────────────────────────

const STALE_HEARTBEAT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns true if a pipeline is currently running with a fresh heartbeat.
 * Marks stale runs (no heartbeat for 10+ min) as FAILED so a new run can start.
 */
export async function isPipelineRunning(): Promise<boolean> {
  const running = await prisma.ingestionRun.findFirst({
    where: { type: "DISCOVERY", status: "RUNNING" },
    select: { id: true, pid: true, startedAt: true, statsJson: true },
  });
  if (!running) return false;

  const stats = running.statsJson as Record<string, unknown> | null;
  if (!stats || stats["isPipeline"] !== true) return false;

  // ── Heartbeat-based check (primary) ───────────────────────────────────────
  const heartbeatAt = stats["heartbeatAt"];
  if (typeof heartbeatAt === "string") {
    const ageMs = Date.now() - new Date(heartbeatAt).getTime();
    if (ageMs > STALE_HEARTBEAT_MS) {
      await prisma.ingestionRun.updateMany({
        where: { id: running.id, status: "RUNNING" },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorText: `Stale pipeline run — heartbeat last seen ${Math.round(ageMs / 60000)} min ago. Marked FAILED.`,
        },
      });
      return false;
    }
    return true; // Fresh heartbeat — pipeline is active.
  }

  // ── Fallback: PID check ────────────────────────────────────────────────────
  if (typeof running.pid === "number") {
    try {
      process.kill(running.pid, 0);
      return true;
    } catch {
      await prisma.ingestionRun.updateMany({
        where: { id: running.id, status: "RUNNING" },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorText: `Stale pipeline run (pid ${running.pid} no longer alive). Marked FAILED.`,
        },
      });
      return false;
    }
  }

  // ── Fallback: age-based check ──────────────────────────────────────────────
  const ageMs = Date.now() - new Date(running.startedAt).getTime();
  if (ageMs > STALE_HEARTBEAT_MS) {
    await prisma.ingestionRun.updateMany({
      where: { id: running.id, status: "RUNNING" },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorText: "Stale pipeline run (no heartbeat, no pid, started >10 min ago). Marked FAILED.",
      },
    });
    return false;
  }

  return true;
}

// ─── Core orchestrator ─────────────────────────────────────────────────────────

export async function runFullPipeline(): Promise<FullPipelineStats> {
  const runId =
    process.env.FULL_PIPELINE_RUN_ID ?? (await startPipelineRun());
  const stats = emptyStats();

  // When run was pre-created by API route, claim it by setting our pid.
  if (process.env.FULL_PIPELINE_RUN_ID) {
    await prisma.ingestionRun.updateMany({
      where: { id: runId, status: "RUNNING" },
      data: { pid: process.pid },
    });
  }

  log("=== Full Pipeline starting ===");
  log(`Run ID: ${runId}`);
  log(
    `Limits: OCR max=${LIMITS.ocrMax}, sitemap domains=${LIMITS.sitemapMaxDomains} urls/domain=${LIMITS.sitemapMaxUrlsPerDomain}, enrich max=${LIMITS.enrichMax}`,
  );

  // ── Start heartbeat timer (every 30 s) ──────────────────────────────────────
  const heartbeatInterval = setInterval(() => {
    heartbeat(runId, stats).catch(() => {});
  }, 30_000);

  // ── Stage 1: DSLD label image OCR discovery ──────────────────────────────────
  try {
    log("--- Stage 1/3: DSLD label image OCR discovery ---");
    stats.stages.ocrDiscovery = "running";
    await heartbeat(runId, stats);

    const ocrResult = await runDsldImageDiscovery({
      max: LIMITS.ocrMax,
      maxImagesPerProduct: LIMITS.ocrMaxImagesPerProduct,
    });

    stats.ocr = {
      productsScanned: ocrResult.productsScanned,
      productsSkipped: ocrResult.productsSkipped,
      imagesProcessed: ocrResult.imagesDownloaded,
      imagesCachedHit: ocrResult.imagesCachedHit,
      domainsFound: ocrResult.domainsFound,
      officialListingsCreated: ocrResult.officialListingsCreated,
      errors: ocrResult.errorsCount,
    };
    stats.totalErrors += ocrResult.errorsCount;
    stats.stages.ocrDiscovery = "done";

    log(`Stage 1 done: ${ocrResult.domainsFound} domains found, ${ocrResult.officialListingsCreated} listings created`);
    await heartbeat(runId, stats);
  } catch (err) {
    stats.ocr.errors += 1;
    stats.totalErrors += 1;
    stats.stages.ocrDiscovery = "failed";
    const msg = err instanceof Error ? err.message : String(err);
    log(`Stage 1 FAILED: ${msg}`);
    clearInterval(heartbeatInterval);
    await finishPipelineRun(runId, "FAILED", stats, `Stage 1 (OCR discovery) failed: ${msg}`);
    await prisma.$disconnect();
    throw err;
  }

  // ── Stage 2: Sitemap harvesting ──────────────────────────────────────────────
  try {
    log("--- Stage 2/3: Sitemap harvesting ---");
    stats.stages.sitemapHarvest = "running";
    await heartbeat(runId, stats);

    const sitemapResult = await runSitemapHarvest({
      maxDomains: LIMITS.sitemapMaxDomains,
      maxUrlsPerDomain: LIMITS.sitemapMaxUrlsPerDomain,
      skipCreateRun: true,
    });

    stats.sitemaps = {
      domainsScanned: sitemapResult.domainsScanned,
      sitemapsFetched: sitemapResult.sitemapsFetched,
      productUrlsFound: sitemapResult.productUrlsFound,
      skippedNonShilajit: sitemapResult.skippedNonShilajit,
      skippedAlreadySeen: sitemapResult.skippedAlreadySeen,
      skippedWeakTermNotConfirmed: sitemapResult.skippedWeakTermNotConfirmed,
      titleFetchAttempts: sitemapResult.titleFetchAttempts,
      titleFetchFailures: sitemapResult.titleFetchFailures,
      quarantinedListingsCreated: sitemapResult.quarantinedListingsCreated,
      listingsUpserted: sitemapResult.listingsUpserted,
      placeholdersCreated: sitemapResult.placeholdersCreated,
      mergeCandidatesCreated: sitemapResult.mergeCandidatesCreated,
      errors: sitemapResult.errorsCount,
    };
    stats.totalErrors += sitemapResult.errorsCount;
    stats.stages.sitemapHarvest = "done";

    log(
      `Stage 2 done: ${sitemapResult.productUrlsFound} product URLs, ` +
        `${sitemapResult.skippedNonShilajit} non-shilajit skipped, ` +
        `${sitemapResult.skippedAlreadySeen} already seen, ` +
        `${sitemapResult.listingsUpserted} upserted`,
    );
    await heartbeat(runId, stats);
  } catch (err) {
    stats.sitemaps.errors += 1;
    stats.totalErrors += 1;
    stats.stages.sitemapHarvest = "failed";
    const msg = err instanceof Error ? err.message : String(err);
    log(`Stage 2 FAILED: ${msg}`);
    clearInterval(heartbeatInterval);
    await finishPipelineRun(runId, "FAILED", stats, `Stage 2 (sitemap harvest) failed: ${msg}`);
    await prisma.$disconnect();
    throw err;
  }

  // ── Stage 3: Enrichment ──────────────────────────────────────────────────────
  try {
    log("--- Stage 3/3: Official page enrichment ---");
    stats.stages.enrich = "running";
    await heartbeat(runId, stats);

    const enrichResult = await enrichOfficialCore({
      maxProducts: LIMITS.enrichMax,
      dryRun: false,
    });

    stats.enrich = {
      productsSelected: enrichResult.productsSelected,
      productsProcessed: enrichResult.productsProcessed,
      skippedNoProductUrl: enrichResult.skippedNoProductUrl,
      evidenceAdded: enrichResult.evidenceAdded,
      coaPublicFound: enrichResult.coaPublicFound,
      manufacturingFound: enrichResult.manufacturingClearFound,
      errors: enrichResult.errorsCount,
    };
    stats.totalErrors += enrichResult.errorsCount;
    stats.stages.enrich = "done";

    log(`Stage 3 done: ${enrichResult.productsProcessed} products enriched, ${enrichResult.evidenceAdded} evidence records added`);
    await heartbeat(runId, stats);
  } catch (err) {
    stats.enrich.errors += 1;
    stats.totalErrors += 1;
    stats.stages.enrich = "failed";
    const msg = err instanceof Error ? err.message : String(err);
    log(`Stage 3 FAILED: ${msg}`);
    clearInterval(heartbeatInterval);
    await finishPipelineRun(runId, "FAILED", stats, `Stage 3 (enrich) failed: ${msg}`);
    await prisma.$disconnect();
    throw err;
  }

  clearInterval(heartbeatInterval);
  log("=== Full Pipeline complete ===");
  log(JSON.stringify(stats, null, 2));

  await finishPipelineRun(runId, "SUCCESS", stats);
  return stats;
}

// ─── CLI entry point ───────────────────────────────────────────────────────────

async function main() {
  try {
    await runFullPipeline();
  } finally {
    await prisma.$disconnect();
  }
}

main();
