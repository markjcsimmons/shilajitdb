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

  let allowlist: AllowlistEntry[] = [];
  try {
    const raw = await fs.readFile(allowlistPath, "utf8");
    allowlist = JSON.parse(raw) as AllowlistEntry[];
  } catch {
    allowlist = [];
  }

  for (const entry of allowlist) {
    if (!entry.searchUrlTemplate) continue;
    const maxPages = Math.min(3, entry.maxPages ?? 1);
    for (let page = 1; page <= maxPages; page += 1) {
      const url = entry.searchUrlTemplate.replace("{{page}}", String(page));
      const robots = await isAllowedByRobots(url);
      if (!robots.allowed) continue;
      try {
        const html = await fetchTextWithRetry(url, { retries: 2, timeoutMs: 15000 });
        const $ = cheerio.load(html);
        const urls: string[] = [];
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          const u = absoluteUrl(href ?? "", url);
          if (u && (u.includes("/pr/") || u.includes("/product/"))) urls.push(u.split("?")[0] as string);
        });
        const unique = Array.from(new Set(urls));
        stats.urlsDiscovered += unique.length;
        for (const u of unique.slice(0, 30)) {
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
            const res = await resolveListingToProduct(input);
            stats.listingsUpserted += 1;
            if (!res.attachedToExistingProduct) stats.placeholdersCreated += 1;
            stats.mergeCandidatesCreated += res.mergeCandidatesCreatedCount;
          } catch {
            stats.errorsCount += 1;
          }
        }
      } catch {
        stats.errorsCount += 1;
      }
    }
  }

  try {
    await fs.access(inboxPath);
  } catch {
    return stats;
  }

  const inboxDir = path.dirname(inboxPath);
  const processedName = `listings.processed.${Date.now()}.csv`;
  const processedPath = path.join(inboxDir, processedName);

  try {
    const result = await importListingsCsv({ csvPath: inboxPath, dryRun: false, wrapRun: false });
    const s = result.stats;
    stats.listingsUpserted += s.listingsProcessed ?? 0;
    stats.placeholdersCreated += s.productsProcessed ?? 0;
    stats.mergeCandidatesCreated += s.mergeCandidatesCreated ?? 0;
    await fs.rename(inboxPath, processedPath);
  } catch (e) {
    stats.errorsCount += 1;
    throw e;
  }

  return stats;
}
