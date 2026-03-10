/**
 * Fetch and parse XML sitemaps (standard + sitemap index + gzip).
 *
 * Handles:
 *   - Regular sitemap:    <urlset><url><loc>…</loc></url></urlset>
 *   - Sitemap index:      <sitemapindex><sitemap><loc>…</loc></sitemap></sitemapindex>
 *   - Gzip sitemaps:      any URL ending with .gz (decompressed with built-in zlib)
 *   - Multiple alt paths: /sitemap.xml → /sitemap_index.xml → /sitemap.xml.gz → /sitemap-index.xml
 *
 * Respects robots.txt via existing helper.
 * Caches results per-URL so re-runs don't re-fetch.
 */

import { gunzip } from "zlib";
import { promisify } from "util";
import * as cheerio from "cheerio";
import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";
import { isAllowedByRobots } from "@/scripts/ingest/discovery/robots";

const gunzipAsync = promisify(gunzip);

const CACHE_NS = "sitemaps";
const FETCH_TIMEOUT_MS = 20000;
/** Max child sitemaps expanded from a sitemap index (per depth level). */
const MAX_CHILD_SITEMAPS = 25;
/** Max recursion depth: 0 = root, 1 = first-level index, 2 = second-level index. */
const MAX_DEPTH = 2;

/** Canonical sitemap paths tried in order when we don't know the exact URL. */
const SITEMAP_CANDIDATE_PATHS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap.xml.gz",
  "/sitemap-index.xml",
] as const;

function sitemapCacheKey(url: string) {
  return `sitemap:${url}`;
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

// ─── Raw fetch (text or gzip) ─────────────────────────────────────────────────

/**
 * Download a URL as raw bytes.
 * Used for both plain XML and gzip sitemaps.
 */
async function fetchRawBytes(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "ShilajitTransparencyDatabaseBot/0.1 Sitemap-Crawler",
        accept: "application/xml,text/xml,application/x-gzip,*/*",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch a sitemap URL and return its XML text.
 * Automatically decompresses .gz responses.
 */
async function fetchSitemapXml(url: string): Promise<string> {
  const raw = await fetchRawBytes(url);

  // Detect gzip by URL suffix OR by magic bytes (1f 8b).
  const isGzip =
    url.endsWith(".gz") || (raw[0] === 0x1f && raw[1] === 0x8b);
  if (isGzip) {
    const decompressed = await gunzipAsync(raw);
    return decompressed.toString("utf8");
  }
  return raw.toString("utf8");
}

// ─── XML parsing ──────────────────────────────────────────────────────────────

function extractLocsFromXml(xml: string, base: string): { locs: string[]; isIndex: boolean } {
  const $ = cheerio.load(xml, { xmlMode: true });

  // Sitemap index: <sitemapindex><sitemap><loc>
  const indexLocs: string[] = [];
  $("sitemapindex sitemap loc").each((_, el) => {
    const href = $(el).text().trim();
    if (href) indexLocs.push(absoluteUrl(href, base));
  });
  if (indexLocs.length > 0) return { locs: indexLocs, isIndex: true };

  // Regular sitemap: <urlset><url><loc>
  const urlLocs: string[] = [];
  $("urlset url loc").each((_, el) => {
    const href = $(el).text().trim();
    if (href) urlLocs.push(absoluteUrl(href, base));
  });
  return { locs: urlLocs, isIndex: false };
}

// ─── Recursive sitemap fetch ──────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchAndParseSitemap(
  sitemapUrl: string,
  depth: number,
  visited: Set<string>,
): Promise<string[]> {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);

  // Robots check.
  const robots = await isAllowedByRobots(sitemapUrl);
  if (!robots.allowed) return [];

  // Cache check.
  const cacheKey = sitemapCacheKey(sitemapUrl);
  const cached = await getCachedJson<{ urls: string[] }>(CACHE_NS, cacheKey);
  if (cached?.urls) return cached.urls;

  let xml: string;
  try {
    xml = await fetchSitemapXml(sitemapUrl);
  } catch {
    await setCachedJson(CACHE_NS, cacheKey, { urls: [] });
    return [];
  }

  const { locs, isIndex } = extractLocsFromXml(xml, sitemapUrl);
  let allUrls: string[] = [];

  if (isIndex && depth < MAX_DEPTH) {
    const children = locs.slice(0, MAX_CHILD_SITEMAPS);
    for (const childUrl of children) {
      const childUrls = await fetchAndParseSitemap(childUrl, depth + 1, visited);
      allUrls.push(...childUrls);
      await sleep(1000); // ~1 req/sec
    }
  } else {
    allUrls = locs;
  }

  await setCachedJson(CACHE_NS, cacheKey, { urls: allUrls });
  return allUrls;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type SitemapFetchResult = {
  urls: string[];
  /** Which path actually succeeded, or null if none found. */
  successPath: string | null;
};

/**
 * Fetch all URLs from a domain's sitemap.
 *
 * Tries multiple common sitemap paths in order and returns after the first
 * one that returns at least one URL.  Falls back gracefully to an empty list.
 */
export async function fetchSitemapUrls(domain: string): Promise<string[]> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0] ?? domain;

  const visited = new Set<string>();

  for (const candidatePath of SITEMAP_CANDIDATE_PATHS) {
    const sitemapUrl = `https://${cleanDomain}${candidatePath}`;
    try {
      const urls = await fetchAndParseSitemap(sitemapUrl, 0, visited);
      if (urls.length > 0) {
        return Array.from(new Set(urls));
      }
    } catch {
      // Try next path.
    }
    await sleep(500);
  }

  return [];
}
