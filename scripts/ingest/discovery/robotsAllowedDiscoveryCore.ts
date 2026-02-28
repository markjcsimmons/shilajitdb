import "dotenv/config";

import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { resolveListingToProduct } from "@/scripts/ingest/discovery/listingResolver";
import { importListingsCsv } from "@/scripts/ingest/discovery/importCsv";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import { isAllowedByRobots } from "@/scripts/ingest/discovery/robots";
import type { DiscoveryRobotsAllowedStats } from "@/scripts/jobs/jobTypes";
import type { ListingInput } from "@/scripts/ingest/discovery/types";

type AllowlistEntry = {
  domain: string;
  searchUrlTemplate?: string;
  maxPages?: number;
};

const DEFAULT_QUERIES = ["shilajit", "shilajit resin", "shilajit capsules"];
const CONFIG_PATH = "config/discoveryAllowlist.json";
const INBOX_PATH = "data/inbox/listings.csv";
const SEARCH_PAGE_TIMEOUT_MS = 10000;
const RESOLVE_TIMEOUT_MS = 15000;

function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [discovery] ${msg}`);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function absoluteUrl(href: string, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export type RunRobotsAllowedDiscoveryOptions = {
  queries?: string[];
  maxPages?: number;
  allowlistPath?: string;
  inboxPath?: string;
};

/**
 * 1) If allowlist exists: for each allowlisted domain, fetch search (if template), extract product URLs, resolve to listings.
 * 2) If data/inbox/listings.csv exists: import it and rename to listings.processed.{timestamp}.csv
 * Does NOT scrape Amazon/Walmart/Google Shopping.
 */
export async function runRobotsAllowedDiscovery(
  opts: RunRobotsAllowedDiscoveryOptions = {}
): Promise<DiscoveryRobotsAllowedStats> {
  const stats: DiscoveryRobotsAllowedStats = {
    urlsDiscovered: 0,
    listingsUpserted: 0,
    placeholdersCreated: 0,
    mergeCandidatesCreated: 0,
    errorsCount: 0,
  };

  const allowlistPath = opts.allowlistPath ?? path.join(process.cwd(), CONFIG_PATH);
  const inboxPath = opts.inboxPath ?? path.join(process.cwd(), INBOX_PATH);

  // 1) Process inbox CSV first so it completes even if allowlist crawl is slow or finds nothing
  try {
    await fs.access(inboxPath);
    log(`Inbox found: ${inboxPath}`);
    try {
      const result = await importListingsCsv({ csvPath: inboxPath, dryRun: false, wrapRun: false });
      const s = result.stats;
      stats.listingsUpserted += s.listingsProcessed ?? 0;
      stats.placeholdersCreated += s.productsProcessed ?? 0;
      stats.mergeCandidatesCreated += s.mergeCandidatesCreated ?? 0;
      const inboxDir = path.dirname(inboxPath);
      const processedPath = path.join(inboxDir, `listings.processed.${Date.now()}.csv`);
      await fs.rename(inboxPath, processedPath);
      log(`Inbox imported: ${s.listingsProcessed ?? 0} listings, renamed to ${path.basename(processedPath)}`);
    } catch (e) {
      stats.errorsCount += 1;
      log(`Inbox import failed: ${e instanceof Error ? e.message : String(e)}`);
      throw e;
    }
  } catch {
    // Inbox file missing — continue to allowlist
  }

  // 2) Allowlist crawl (often yields 0 for JS-rendered search pages)
  let allowlist: AllowlistEntry[] = [];
  try {
    const raw = await fs.readFile(allowlistPath, "utf8");
    allowlist = JSON.parse(raw) as AllowlistEntry[];
  } catch {
    allowlist = [];
  }

  if (allowlist.length === 0) {
    log("No allowlist entries (or config missing); skipping crawl.");
    return stats;
  }

  for (const entry of allowlist) {
    if (!entry.searchUrlTemplate) continue;
    const maxPages = Math.min(3, entry.maxPages ?? 1);
    for (let page = 1; page <= maxPages; page += 1) {
      const url = entry.searchUrlTemplate.replace("{{page}}", String(page));
      log(`Checking robots for ${url}`);
      const robots = await isAllowedByRobots(url);
      if (!robots.allowed) {
        log(`Skipping (robots): ${robots.reason}`);
        continue;
      }
      try {
        log(`Fetching search page (timeout ${SEARCH_PAGE_TIMEOUT_MS}ms)...`);
        const html = await fetchTextWithRetry(url, { retries: 2, timeoutMs: SEARCH_PAGE_TIMEOUT_MS });
        const $ = cheerio.load(html);
        const urls: string[] = [];
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          const u = absoluteUrl(href ?? "", url);
          if (u && (u.includes("/pr/") || u.includes("/product/"))) urls.push(u.split("?")[0] as string);
        });
        const unique = Array.from(new Set(urls));
        stats.urlsDiscovered += unique.length;
        log(`Found ${unique.length} product URLs (page may be JS-rendered if 0)`);
        const toResolve = unique.slice(0, 30);
        for (let i = 0; i < toResolve.length; i += 1) {
          const u = toResolve[i];
          try {
            const input: ListingInput = {
              url: u,
              source: "OTHER_RETAILER",
              title: null,
              brandName: null,
              observedGtin: null,
              observedSku: null,
              netQuantityText: null,
              form: null,
              imageUrls: null,
            };
            const res = await withTimeout(
              resolveListingToProduct(input),
              RESOLVE_TIMEOUT_MS,
              `resolve ${i + 1}/${toResolve.length}`
            );
            stats.listingsUpserted += 1;
            if (!res.attachedToExistingProduct) stats.placeholdersCreated += 1;
            stats.mergeCandidatesCreated += res.mergeCandidatesCreatedCount;
          } catch (e) {
            stats.errorsCount += 1;
            if (toResolve.length <= 5) log(`Resolve failed for ${u}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } catch (e) {
        stats.errorsCount += 1;
        log(`Search page failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  log(`Done: urls=${stats.urlsDiscovered} listings=${stats.listingsUpserted} errors=${stats.errorsCount}`);
  return stats;
}
