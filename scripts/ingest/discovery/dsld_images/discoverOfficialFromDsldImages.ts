/**
 * Discover official brand domains by OCR-scanning DSLD label images.
 *
 * Pipeline per product:
 *   1. Skip if product already has Evidence from "DSLD Label Image OCR" (already processed).
 *   2. Fetch up to --maxImagesPerProduct label image URLs.
 *   3. Run OCR — stop as soon as 1 plausible domain is found (earlyExit).
 *   4. For each plausible brand domain:
 *      a. Create Listing (source=OFFICIAL, url=https://{domain}) if new.
 *      b. Create Evidence record pointing to the label image URL.
 *      c. Optionally back-fill Brand.websiteDomain if currently empty.
 *
 * Image buffers are cached on disk under .cache/dsld-images/ (sha1 of URL).
 *
 * Run: npm run discover:dsld-images -- --max 200 --maxImagesPerProduct 3
 */

import "dotenv/config";
import pLimit from "p-limit";

import { prisma } from "@/lib/db";
import { DsldClient } from "@/scripts/ingest/dsld/dsldClient";
import { startRun, finishRun } from "@/scripts/ingest/shared/observability";
import { getLabelImageUrls } from "./dsldLabelImagesClient";
import { ocrExtractContacts } from "./ocrExtractContacts";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CONCURRENCY = 2; // Max simultaneous image downloads + OCR runs.
const DEFAULT_MAX = 200;
const DEFAULT_MAX_IMAGES_PER_PRODUCT = 3;

/** Domains that are not brand primary sites — mirrors the list in ocrExtractContacts. */
const DOMAIN_BLOCKLIST = new Set([
  "amazon.com", "amazon.ca", "amazon.co.uk",
  "walmart.com", "ebay.com", "aliexpress.com", "temu.com",
  "etsy.com", "target.com", "costco.com", "iherb.com",
  "facebook.com", "instagram.com", "tiktok.com", "youtube.com",
  "twitter.com", "x.com", "google.com", "pinterest.com",
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
  "dsld.od.nih.gov", "nih.gov", "fda.gov", "usda.gov",
  "shopify.com", "myshopify.com", "squarespace.com", "wix.com",
]);

// ─── Stats ─────────────────────────────────────────────────────────────────────

export type DsldImageDiscoveryStats = {
  productsScanned: number;
  productsSkipped: number;
  imagesDownloaded: number;
  imagesCachedHit: number;
  domainsFound: number;
  officialListingsCreated: number;
  evidenceCreated: number;
  errorsCount: number;
};

function emptyStats(): DsldImageDiscoveryStats {
  return {
    productsScanned: 0,
    productsSkipped: 0,
    imagesDownloaded: 0,
    imagesCachedHit: 0,
    domainsFound: 0,
    officialListingsCreated: 0,
    evidenceCreated: 0,
    errorsCount: 0,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] [dsld-images] ${msg}`);
}

function isBlocklisted(domain: string): boolean {
  const d = domain.toLowerCase();
  if (DOMAIN_BLOCKLIST.has(d)) return true;
  for (const b of DOMAIN_BLOCKLIST) {
    if (d.endsWith(`.${b}`)) return true;
  }
  return false;
}

function parseArgs(argv: string[]) {
  function flag(name: string, fallback: number): number {
    const idx = argv.findIndex((a) => a === name);
    const val = idx >= 0 && argv[idx + 1] ? Number(argv[idx + 1]) : fallback;
    return Number.isFinite(val) ? val : fallback;
  }
  return {
    max: flag("--max", DEFAULT_MAX),
    maxImagesPerProduct: flag("--maxImagesPerProduct", DEFAULT_MAX_IMAGES_PER_PRODUCT),
    dryRun: argv.includes("--dry-run") || argv.includes("--dryRun"),
  };
}

// ─── Per-product processor ─────────────────────────────────────────────────────

async function processProduct(
  product: {
    id: string;
    sourceDsldLabelId: string;
    sourceDsldUrl: string | null;
    brand: { id: string; name: string; websiteDomain: string | null };
    evidence: { id: string }[];
  },
  dsldClient: DsldClient,
  stats: DsldImageDiscoveryStats,
  dryRun: boolean,
  maxImagesPerProduct: number,
): Promise<void> {
  const dsldId = product.sourceDsldLabelId;

  // ── Skip if already processed (has OCR evidence) ──────────────────────────
  const alreadyProcessed = product.evidence.length > 0;
  if (alreadyProcessed) {
    stats.productsSkipped += 1;
    log(`  SKIP: Product ${product.id} already has DSLD OCR evidence — skipping`);
    return;
  }

  let labelJson: unknown = null;
  try {
    labelJson = await dsldClient.getLabel(dsldId);
  } catch (err) {
    log(`  WARN: Could not fetch label JSON for DSLD ${dsldId}: ${err instanceof Error ? err.message : err}`);
  }

  const imageUrls = await getLabelImageUrls(dsldId, labelJson, maxImagesPerProduct);
  if (imageUrls.length === 0) {
    log(`  SKIP: No label images found for DSLD ${dsldId}`);
    return;
  }

  log(`  OCR: ${imageUrls.length} image(s) for DSLD ${dsldId} (brand: ${product.brand.name})`);

  const ocrResults = await ocrExtractContacts(imageUrls, { earlyExit: true });

  for (const result of ocrResults) {
    stats.imagesDownloaded += 1;
    if (result.fromCache) stats.imagesCachedHit += 1;

    for (const domain of result.domains) {
      if (isBlocklisted(domain)) continue;

      stats.domainsFound += 1;
      const officialUrl = `https://${domain}`;

      log(`  DOMAIN: ${domain} (from ${result.imageUrl})`);

      if (dryRun) {
        log(`  DRY-RUN: would create Listing url=${officialUrl} and Evidence`);
        continue;
      }

      // Check if this domain is already the Brand's websiteDomain.
      const brandDomainMatch =
        product.brand.websiteDomain?.toLowerCase() === domain.toLowerCase();

      // Upsert Listing (source=OFFICIAL). Url uniqueness is enforced by schema.
      const existingListing = await prisma.listing.findUnique({
        where: { url: officialUrl },
        select: { id: true },
      });

      if (!existingListing) {
        await prisma.listing.create({
          data: {
            productId: product.id,
            source: "OFFICIAL",
            url: officialUrl,
            status: "UNKNOWN",
            lastSeenAt: new Date(),
          },
          select: { id: true },
        });
        stats.officialListingsCreated += 1;
        log(`  LISTING: Created OFFICIAL listing for ${officialUrl}`);
      }

      // Create Evidence record referencing the label image that contained this domain.
      const evidenceUrl = result.imageUrl;
      const existingEvidence = await prisma.evidence.findFirst({
        where: {
          productId: product.id,
          url: evidenceUrl,
          sourceName: "DSLD Label Image OCR",
        },
        select: { id: true },
      });

      if (!existingEvidence) {
        await prisma.evidence.create({
          data: {
            productId: product.id,
            type: "OTHER",
            url: evidenceUrl,
            sourceName: "DSLD Label Image OCR",
            quote: `Extracted domain: ${domain} (OCR)`,
          },
          select: { id: true },
        });
        stats.evidenceCreated += 1;
      }

      // Back-fill Brand.websiteDomain if empty and domain not already set.
      if (!brandDomainMatch && !product.brand.websiteDomain) {
        await prisma.brand.update({
          where: { id: product.brand.id },
          data: {
            websiteDomain: domain,
            website: officialUrl,
          },
        });
        log(`  BRAND: Updated ${product.brand.name} websiteDomain → ${domain}`);
      }
    }
  }
}

// ─── Core (callable from runJob.ts / runFullPipeline.ts) ──────────────────────

export type DsldImageDiscoveryOptions = {
  max?: number;
  maxImagesPerProduct?: number;
  dryRun?: boolean;
};

/**
 * Exported core function — called by runJob.ts for job-based execution.
 * Creates its own IngestionRun record; returns stats for JobRun.statsJson.
 */
export async function runDsldImageDiscovery(opts: DsldImageDiscoveryOptions = {}): Promise<DsldImageDiscoveryStats> {
  const max = opts.max ?? DEFAULT_MAX;
  const maxImagesPerProduct = opts.maxImagesPerProduct ?? DEFAULT_MAX_IMAGES_PER_PRODUCT;
  const dryRun = opts.dryRun ?? false;

  log(`Starting DSLD label image OCR discovery. max=${max} maxImagesPerProduct=${maxImagesPerProduct} dryRun=${dryRun}`);

  const runId = await startRun("DISCOVERY");
  const stats = emptyStats();
  const dsldClient = new DsldClient();
  const limit = pLimit(CONCURRENCY);

  try {
    const products = await prisma.product.findMany({
      where: { sourceDsldLabelId: { not: null } },
      select: {
        id: true,
        sourceDsldLabelId: true,
        sourceDsldUrl: true,
        brand: { select: { id: true, name: true, websiteDomain: true } },
        // Pre-fetch OCR evidence so we can skip already-processed products.
        evidence: {
          where: { sourceName: "DSLD Label Image OCR" },
          select: { id: true },
          take: 1,
        },
      },
      take: max,
      orderBy: { createdAt: "asc" },
    });

    log(`Found ${products.length} product(s) with DSLD label IDs.`);

    const tasks = products.map((product) =>
      limit(async () => {
        stats.productsScanned += 1;
        try {
          await processProduct(
            product as {
              id: string;
              sourceDsldLabelId: string;
              sourceDsldUrl: string | null;
              brand: { id: string; name: string; websiteDomain: string | null };
              evidence: { id: string }[];
            },
            dsldClient,
            stats,
            dryRun,
            maxImagesPerProduct,
          );
        } catch (err) {
          stats.errorsCount += 1;
          log(`ERROR: Product ${product.id} / DSLD ${product.sourceDsldLabelId}: ${err instanceof Error ? err.message : err}`);
        }
      }),
    );

    await Promise.all(tasks);

    log(`Done. Stats: ${JSON.stringify(stats)}`);
    if (runId) await finishRun(runId, "SUCCESS", stats as unknown as Parameters<typeof finishRun>[2], null);
    return stats;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${msg}`);
    if (runId) await finishRun(runId, "FAILED", stats as unknown as Parameters<typeof finishRun>[2], msg);
    throw err;
  }
}

// ─── CLI entry point (only when run directly, not when imported) ─────────────────

import { fileURLToPath } from "node:url";
import path from "node:path";

async function main() {
  const { max, maxImagesPerProduct, dryRun } = parseArgs(process.argv.slice(2));
  try {
    await runDsldImageDiscovery({ max, maxImagesPerProduct, dryRun });
  } finally {
    await prisma.$disconnect();
  }
}

const __filename = fileURLToPath(import.meta.url);
const isEntry = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isEntry) main();
