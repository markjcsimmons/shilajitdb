import "dotenv/config";

import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { createEmptyStats, finishRun, startRun } from "@/scripts/ingest/shared/observability";
import { resolveListingToProduct } from "./listingResolver";
import type { ListingInput } from "./types";
import type { ListingSource, ProductForm } from "@prisma/client";

function argValue(flag: string) {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

function coerceListingSource(input: unknown): ListingSource {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  const values = ["OFFICIAL", "AMAZON", "WALMART", "IHERB", "OTHER_RETAILER", "GOOGLE_SHOPPING", "MANUAL"] as const;
  return (values.includes(s as any) ? (s as ListingSource) : "OTHER_RETAILER") as ListingSource;
}

function coerceProductForm(input: unknown): ProductForm | null {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  if (!s) return null;
  const values = ["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"] as const;
  return values.includes(s as any) ? (s as ProductForm) : null;
}

function normalizeRow(r: Record<string, unknown>): ListingInput | null {
  const url = String(r.url ?? "").trim();
  if (!url) return null;
  const source = coerceListingSource(r.source);
  const title = typeof r.title === "string" ? r.title.trim() : null;
  const brandName = typeof r.brandName === "string" ? r.brandName.trim() : null;
  const observedGtin = typeof r.observedGtin === "string" ? r.observedGtin.trim() : null;
  const observedSku = typeof r.observedSku === "string" ? r.observedSku.trim() : null;
  const netQuantityText = typeof r.netQuantityText === "string" ? r.netQuantityText.trim() : null;
  const form = coerceProductForm(r.form);
  return { url, source, title, brandName, observedGtin, observedSku, netQuantityText, form, imageUrls: null };
}

export async function importListingsCsv(opts: { csvPath: string; dryRun: boolean; wrapRun?: boolean }) {
  const wrapRun = opts.wrapRun ?? true;
  const runId = wrapRun ? await startRun("DISCOVERY") : "no-run";
  const stats = createEmptyStats();

  try {
    const raw = await fs.readFile(opts.csvPath, "utf8");
    const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true, trim: true }) as Array<
      Record<string, unknown>
    >;

    for (const r of rows) {
      const input = normalizeRow(r);
      if (!input) continue;
      if (opts.dryRun) {
        stats.listingsProcessed = (stats.listingsProcessed ?? 0) + 1;
        continue;
      }
      const res = await resolveListingToProduct(input);
      stats.listingsProcessed = (stats.listingsProcessed ?? 0) + 1;
      if (res.listingCreated) stats.listingsCreated = (stats.listingsCreated ?? 0) + 1;
      stats.mergeCandidatesCreated = (stats.mergeCandidatesCreated ?? 0) + res.mergeCandidatesCreatedCount;
      if (!res.attachedToExistingProduct) stats.productsProcessed += 1;
    }

    if (wrapRun) await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    if (wrapRun) await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  const path = argValue("--path") ?? argValue("--csvPath");
  if (!path) {
    console.error("Missing --path=/path/to/listings.csv");
    process.exit(1);
  }
  importListingsCsv({ csvPath: path, dryRun, wrapRun: true })
    .then(({ runId, stats }) => {
      console.log(`Listings CSV import complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
