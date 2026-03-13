/**
 * Harvest product URLs from official brand sitemaps.
 *
 * Sources of official domains (checked in order, deduplicated):
 *   1. Brand.websiteDomain (non-null)
 *   2. Product.officialDomain (non-null)
 *   3. Listing.url where source=OFFICIAL (extract hostname)
 *
 * For each domain:
 *   1. Fetch sitemap.xml (fetchSitemap).
 *   2. Classify URLs → product URLs (classifyUrl).
 *   3. For each product URL (capped at maxUrlsPerDomain):
 *      a. FIX 1 / REF A — relevance filter:
 *           STRONG terms → accept immediately.
 *           WEAK terms  → confirm with a page-title fetch if confirmWeakTerms=true.
 *           No match    → skip (skippedNonShilajit).
 *      b. FIX 3 — skip if a Listing for that URL already exists (idempotent).
 *      c. FIX 2 / REF B — derive brand via ensureOrFindDomainBrand (creates a stable
 *         Brand row keyed by websiteDomain if none exists).
 *      d. REF D — if page-title fetch failed for a WEAK URL, quarantine the listing
 *         instead of creating a placeholder product.
 *      e. resolveListingToProduct → attaches to existing Product or creates a
 *         URL-keyed stable placeholder + MergeCandidate (REF C in resolver).
 *      f. Create Evidence referencing sitemap.xml.
 *   4. Respect robots.txt + 1-req/sec rate limiting.
 *
 * Run: npm run discover:sitemaps -- --maxDomains 50 --maxUrlsPerDomain 200
 * Flags:
 *   --no-strictSlugFilter       Allow all classified product URLs through (no shilajit check).
 *   --no-confirmWeakTerms       Accept weak-term URLs without fetching the page title.
 *   --dry-run                   Print what would be ingested without writing.
 */

import "dotenv/config";
import pLimit from "p-limit";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";
import { startRun, finishRun } from "@/scripts/ingest/shared/observability";
import { resolveListingToProduct } from "@/scripts/ingest/discovery/listingResolver";
import { fetchSitemapUrls } from "./fetchSitemap";
import { classifyUrls } from "./classifyUrl";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DOMAIN_CONCURRENCY = 3;
const DEFAULT_MAX_DOMAINS = 50;
const DEFAULT_MAX_URLS_PER_DOMAIN = 200;
const RATE_LIMIT_MS = 1100; // ~1 req/sec per domain.
const TITLE_FETCH_TIMEOUT_MS = 8000;

// ─── REF A: Split relevance terms ─────────────────────────────────────────────

/**
 * Strong terms: any of these in the URL slug → definitively a shilajit product.
 * No secondary confirmation needed.
 */
const STRONG_TERMS = [
  "shilajit",
  "shilajeet",
  "mumio",
  "mumijo",
  "asphaltum",
  "mineral-pitch",
  "mineral_pitch",
] as const;

/**
 * Weak terms: these can appear in non-shilajit products (greens blends, minerals).
 * A page-title fetch is required to confirm a STRONG_TERMS hit in the metadata.
 */
const WEAK_TERMS = ["fulvic", "humic", "live-resin"] as const;

type RelevanceLevel = "strong" | "weak" | "none";

function checkUrlRelevance(url: string): RelevanceLevel {
  const lower = url.toLowerCase();
  if (STRONG_TERMS.some((t) => lower.includes(t))) return "strong";
  if (WEAK_TERMS.some((t) => lower.includes(t))) return "weak";
  return "none";
}

// ─── REF A: Lightweight page-title fetch ──────────────────────────────────────

/**
 * Fetch HTML for a URL and return a lowercase string that concatenates
 * <title>, og:title and meta[name=description].
 * Returns null on timeout, HTTP error, or network failure.
 */
async function fetchPageMetaText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TITLE_FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "user-agent":
          "ShilajitTransparencyDatabaseBot/0.1 (+contact via NEXT_PUBLIC_REPORT_EMAIL)",
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    // Read only the first 32 KB — the meta tags are always in <head>.
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (totalBytes < 32768) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      totalBytes += value.byteLength;
    }
    reader.cancel().catch(() => {});
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']og:title["']/i)?.[1] ??
      "";
    const desc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i)?.[1] ??
      "";

    return [title, ogTitle, desc].join(" ").toLowerCase();
  } catch {
    return null;
  }
}

function metaConfirmsShilajit(metaText: string): boolean {
  return STRONG_TERMS.some((t) => metaText.includes(t));
}

// ─── REF B: Domain → Brand (stable, persisted) ────────────────────────────────

/**
 * Resolve a canonical Brand for a domain.
 *
 * Lookup order:
 *   1. Brand.websiteDomain == domain
 *   2. Product.officialDomain == domain (reuse that product's brand)
 *   3. Create a new Brand keyed by slug "domain-{slugified-hostname}"
 *      and store websiteDomain so future runs find it in step 1.
 *
 * This guarantees every domain maps to a single, stable Brand row and prevents
 * "humanised hostname" name collisions.
 */
async function ensureOrFindDomainBrand(domain: string): Promise<{ id: string; name: string }> {
  // 1. Fast path: Brand already keyed by websiteDomain.
  const byDomain = await prisma.brand.findFirst({
    where: { websiteDomain: domain },
    select: { id: true, name: true },
  });
  if (byDomain) return byDomain;

  // 2. Brand reachable via a product on this domain.
  const prod = await prisma.product.findFirst({
    where: { officialDomain: domain },
    select: { brand: { select: { id: true, name: true } } },
  });
  if (prod?.brand) return prod.brand;

  // 3. Create a domain-keyed Brand placeholder.
  const hostname = domain.replace(/^www\./, "");
  const name = hostname; // e.g. "healthforcesuperfoods.com"
  const domainSlug = `domain-${slugify(hostname)}`;

  // Check by slug first to handle concurrent runs gracefully.
  const bySlug = await prisma.brand.findUnique({
    where: { slug: domainSlug },
    select: { id: true, name: true },
  });
  if (bySlug) return bySlug;

  // Check by name (Brand.name is @unique).
  const byName = await prisma.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (byName) return byName;

  try {
    return await prisma.brand.create({
      data: {
        name,
        slug: domainSlug,
        websiteDomain: domain,
        website: `https://${domain}`,
      },
      select: { id: true, name: true },
    });
  } catch {
    // Unique constraint race — another parallel domain task created it first.
    const fallback = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (fallback) return fallback;
    throw new Error(`Failed to create or find brand for domain "${domain}"`);
  }
}

// ─── REF D: Per-domain quarantine product ─────────────────────────────────────

/**
 * Find-or-create a special "Quarantine – {domain}" Product.
 * OFFICIAL Listings that cannot be confirmed as shilajit (page fetch fails or
 * is blocked) are attached here so discovered URLs are preserved for manual
 * admin review without polluting the main product list.
 */
async function ensureQuarantineProduct(domain: string, brandId: string): Promise<string> {
  const slug = `quarantine-${slugify(domain)}`;
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.product.create({
    data: {
      brandId,
      name: `Quarantine \u2013 ${domain}`,
      slug,
      form: "OTHER",
      ingredientText: "",
      ingredientsNormalized: [],
      manufacturingCountryClaim: null,
      manufacturingClaimText: null,
      manufacturingEvidenceUrl: null,
      coaStatus: "UNKNOWN",
      coaUrl: null,
      transparencyGrade: "F",
      qualityTier: "POOR",
      sourceDsldLabelId: null,
      sourceDsldUrl: null,
      dataCompleteness: "LOW",
      isCanonical: false,
      officialDomain: domain,
      lastVerifiedAt: null,
    },
    select: { id: true },
  });
  return created.id;
}

async function quarantineListing(
  url: string,
  domain: string,
  brandId: string,
  stats: SitemapHarvestStats,
): Promise<void> {
  try {
    const quarantineId = await ensureQuarantineProduct(domain, brandId);
    const existing = await prisma.listing.findUnique({ where: { url }, select: { id: true } });
    if (!existing) {
      await prisma.listing.create({
        data: {
          productId: quarantineId,
          source: "OFFICIAL",
          url,
          title: null,
          status: "UNKNOWN",
          lastSeenAt: new Date(),
          imageUrls: [],
        },
        select: { id: true },
      });
      stats.quarantinedListingsCreated += 1;
    }
  } catch (err) {
    log(`  QUARANTINE ERROR for ${url}: ${err instanceof Error ? err.message : err}`);
    stats.errorsCount += 1;
  }
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export type SitemapHarvestStats = {
  domainsScanned: number;
  sitemapsFetched: number;
  productUrlsFound: number;
  /** FIX 1 / REF A — URLs skipped because slug contains no shilajit term. */
  skippedNonShilajit: number;
  /** FIX 3 — URLs skipped because a Listing for that URL already exists. */
  skippedAlreadySeen: number;
  /** REF A — Weak-term URLs rejected after page-title check found no strong term. */
  skippedWeakTermNotConfirmed: number;
  /** REF A — Number of page-title HTTP fetches attempted. */
  titleFetchAttempts: number;
  /** REF A — Fetch attempts that returned null (timeout / blocked / error). */
  titleFetchFailures: number;
  /** REF D — Listings attached to per-domain quarantine products. */
  quarantinedListingsCreated: number;
  listingsUpserted: number;
  placeholdersCreated: number;
  mergeCandidatesCreated: number;
  errorsCount: number;
};

function emptyStats(): SitemapHarvestStats {
  return {
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
    errorsCount: 0,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] [sitemaps] ${msg}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function titleFromUrlSlug(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    return (
      last
        .replace(/\.[a-z]{2,4}$/i, "")
        .replace(/[-_]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Shilajit Product"
    );
  } catch {
    return "Shilajit Product";
  }
}

function parseArgs(argv: string[]) {
  const get = (flag: string, fallback: number) => {
    const idx = argv.findIndex((a) => a === flag);
    const val = idx >= 0 ? Number(argv[idx + 1]) : NaN;
    return Number.isFinite(val) ? val : fallback;
  };
  return {
    maxDomains: get("--maxDomains", DEFAULT_MAX_DOMAINS),
    maxUrlsPerDomain: get("--maxUrlsPerDomain", DEFAULT_MAX_URLS_PER_DOMAIN),
    dryRun: argv.includes("--dry-run"),
    strictSlugFilter: !argv.includes("--no-strictSlugFilter"),
    confirmWeakTerms: !argv.includes("--no-confirmWeakTerms"),
  };
}

// ─── Collect official domains ──────────────────────────────────────────────────

async function collectOfficialDomains(maxDomains: number): Promise<string[]> {
  const domains = new Set<string>();

  const brands = await prisma.brand.findMany({
    where: { websiteDomain: { not: null } },
    select: { websiteDomain: true },
  });
  for (const b of brands) {
    if (b.websiteDomain) domains.add(b.websiteDomain.toLowerCase());
  }

  const products = await prisma.product.findMany({
    where: { officialDomain: { not: null } },
    select: { officialDomain: true },
  });
  for (const p of products) {
    if (p.officialDomain) domains.add(p.officialDomain.toLowerCase());
  }

  const officialListings = await prisma.listing.findMany({
    where: { source: "OFFICIAL" },
    select: { url: true },
  });
  for (const l of officialListings) {
    const d = extractDomain(l.url);
    if (d) domains.add(d);
  }

  const result = Array.from(domains);
  log(`Collected ${result.length} unique official domain(s).`);
  return result.slice(0, maxDomains);
}

// ─── Per-domain processor ──────────────────────────────────────────────────────

async function processDomain(
  domain: string,
  maxUrls: number,
  stats: SitemapHarvestStats,
  dryRun: boolean,
  strictSlugFilter: boolean,
  confirmWeakTerms: boolean,
): Promise<void> {
  log(`Processing domain: ${domain}`);
  stats.domainsScanned += 1;

  let rawUrls: string[];
  try {
    rawUrls = await fetchSitemapUrls(domain);
    stats.sitemapsFetched += 1;
  } catch (err) {
    stats.errorsCount += 1;
    log(`  ERROR fetching sitemap for ${domain}: ${err instanceof Error ? err.message : err}`);
    return;
  }

  const { productUrls } = classifyUrls(rawUrls);
  const capped = productUrls.slice(0, maxUrls);
  stats.productUrlsFound += capped.length;
  log(`  ${rawUrls.length} sitemap URLs → ${productUrls.length} product URLs → capped at ${capped.length}`);

  if (dryRun) {
    log(`  DRY-RUN: would evaluate ${capped.length} product URLs for ${domain}`);
    return;
  }

  // FIX 3: bulk-load all existing Listing URLs for this domain so we can skip in O(1).
  const existingUrls = new Set(
    (
      await prisma.listing.findMany({
        where: { url: { startsWith: `https://${domain}` } },
        select: { url: true },
      })
    ).map((x) => x.url),
  );
  log(`  ${existingUrls.size} listing URL(s) already in DB for ${domain} — will skip those.`);

  // REF B: resolve/create the domain Brand once per domain.
  const brand = await ensureOrFindDomainBrand(domain);
  // Brand name is passed to the resolver; it will find the same row via ensureBrand().

  const sitemapEvidenceUrl = `https://${domain}/sitemap.xml`;

  for (const rawUrl of capped) {
    const url = canonicalizeUrl(rawUrl);
    if (!url) continue;

    // FIX 1 / REF A — relevance gate.
    if (strictSlugFilter) {
      const relevance = checkUrlRelevance(url);

      if (relevance === "none") {
        stats.skippedNonShilajit += 1;
        continue;
      }

      if (relevance === "weak" && confirmWeakTerms) {
        // Weak term found in slug — fetch page title to confirm.
        stats.titleFetchAttempts += 1;
        const metaText = await fetchPageMetaText(url);

        if (metaText === null) {
          // Network failure / blocked / JS-only — quarantine the listing.
          stats.titleFetchFailures += 1;
          if (!existingUrls.has(url)) {
            await quarantineListing(url, domain, brand.id, stats);
            existingUrls.add(url); // prevent double-quarantine if URL appears twice
          }
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        if (!metaConfirmsShilajit(metaText)) {
          stats.skippedWeakTermNotConfirmed += 1;
          await sleep(RATE_LIMIT_MS);
          continue;
        }
        // Confirmed: fall through to normal ingest below.
      }
      // relevance === "strong", OR weak + !confirmWeakTerms: fall through.
    }

    // FIX 3 — idempotency: skip URLs already in the Listing table.
    if (existingUrls.has(url)) {
      stats.skippedAlreadySeen += 1;
      continue;
    }

    // FIX 2 / REF B — derive a stable title from the URL slug.
    const title = titleFromUrlSlug(url);

    try {
      const result = await resolveListingToProduct({
        url,
        source: "OFFICIAL",
        brandName: brand.name, // always the domain-keyed brand — never undefined
        title,                 // always derived from slug — never undefined
      });

      stats.listingsUpserted += 1;
      if (!result.attachedToExistingProduct) stats.placeholdersCreated += 1;
      stats.mergeCandidatesCreated += result.mergeCandidatesCreatedCount;

      // Dedup Evidence by (productId, evidenceUrl, sourceName).
      const existingEvidence = await prisma.evidence.findFirst({
        where: {
          productId: result.productId,
          url: sitemapEvidenceUrl,
          sourceName: "Sitemap Harvest",
        },
        select: { id: true },
      });
      if (!existingEvidence) {
        await prisma.evidence.create({
          data: {
            productId: result.productId,
            type: "OTHER",
            url: sitemapEvidenceUrl,
            sourceName: "Sitemap Harvest",
            quote: `Found product URL from ${domain} sitemap`,
          },
          select: { id: true },
        });
      }
    } catch (err) {
      stats.errorsCount += 1;
      log(`  ERROR resolving ${url}: ${err instanceof Error ? err.message : err}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  log(
    `  Done ${domain}: seen=${existingUrls.size} nonShilajit=${stats.skippedNonShilajit} ` +
      `weakNotConfirmed=${stats.skippedWeakTermNotConfirmed} ` +
      `alreadySeen=${stats.skippedAlreadySeen} ` +
      `quarantined=${stats.quarantinedListingsCreated} ` +
      `upserted=${stats.listingsUpserted}`,
  );
}

// ─── Core (callable from runJob.ts) ───────────────────────────────────────────

export type SitemapHarvestOptions = {
  maxDomains?: number;
  maxUrlsPerDomain?: number;
  dryRun?: boolean;
  /** Skip URLs whose slug contains no shilajit term. Default: true. */
  strictSlugFilter?: boolean;
  /**
   * For weak-term URLs, fetch the page title to confirm a strong shilajit term
   * appears in the page metadata before ingesting. Default: true.
   */
  confirmWeakTerms?: boolean;
  /** When true (from runFullPipeline), skip creating a separate IngestionRun to reduce DB load. */
  skipCreateRun?: boolean;
};

/**
 * Exported core function — called by runJob.ts for job-based execution.
 * Creates its own IngestionRun record; returns stats for JobRun.statsJson.
 */
export async function runSitemapHarvest(opts: SitemapHarvestOptions = {}): Promise<SitemapHarvestStats> {
  const maxDomains = opts.maxDomains ?? DEFAULT_MAX_DOMAINS;
  const maxUrlsPerDomain = opts.maxUrlsPerDomain ?? DEFAULT_MAX_URLS_PER_DOMAIN;
  const dryRun = opts.dryRun ?? false;
  const strictSlugFilter = opts.strictSlugFilter ?? true;
  const confirmWeakTerms = opts.confirmWeakTerms ?? true;
  const skipCreateRun = opts.skipCreateRun ?? false;

  log(
    `Starting sitemap harvest. maxDomains=${maxDomains} maxUrlsPerDomain=${maxUrlsPerDomain} ` +
      `dryRun=${dryRun} strictSlugFilter=${strictSlugFilter} confirmWeakTerms=${confirmWeakTerms}`,
  );

  const runId = skipCreateRun ? null : await startRun("DISCOVERY");
  const stats = emptyStats();
  const limit = pLimit(DOMAIN_CONCURRENCY);

  try {
    const domains = await collectOfficialDomains(maxDomains);

    if (domains.length === 0) {
      log("No official domains found. Run DSLD import or OCR discovery first.");
      await finishRun(runId, "SUCCESS", stats as unknown as Parameters<typeof finishRun>[2], null);
      return stats;
    }

    const tasks = domains.map((domain) =>
      limit(async () => {
        try {
          await processDomain(domain, maxUrlsPerDomain, stats, dryRun, strictSlugFilter, confirmWeakTerms);
        } catch (err) {
          stats.errorsCount += 1;
          log(`ERROR: domain ${domain}: ${err instanceof Error ? err.message : err}`);
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
  const { maxDomains, maxUrlsPerDomain, dryRun, strictSlugFilter, confirmWeakTerms } =
    parseArgs(process.argv.slice(2));
  try {
    await runSitemapHarvest({ maxDomains, maxUrlsPerDomain, dryRun, strictSlugFilter, confirmWeakTerms });
  } finally {
    await prisma.$disconnect();
  }
}

const __filename = fileURLToPath(import.meta.url);
const isEntry = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isEntry) main();
