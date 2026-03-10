import * as cheerio from "cheerio";
import { canonicalizeUrl } from "@/lib/urlCanonicalize";
import type { FetchedPage } from "./types";
import type { CollectionPageExtract } from "./types";

function normalizeUrl(href: string, baseUrl: string): string | null {
  const h = href.trim();
  if (!h || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("javascript:"))
    return null;
  try {
    return new URL(h, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Product-like path patterns */
const PRODUCT_PATH_PATTERNS = [
  /\/products?\/[^/]+/i,
  /\/product\/[^/]+/i,
  /\/p\/[^/]+/i,
  /\/shop\/[^/]+/i,
  /\/item\/[^/]+/i,
  /\/dp\/[A-Z0-9]+/i,
  /\/ip\/[^/]+/i,
];

function looksLikeProductUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return PRODUCT_PATH_PATTERNS.some((p) => p.test(path));
  } catch {
    return false;
  }
}

function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === baseDomain || u.hostname.endsWith("." + baseDomain);
  } catch {
    return false;
  }
}

/**
 * Extract child product URLs from a collection/store page.
 * Returns URLs for second-pass processing; does not create canonical products.
 */
export function extractCollectionPage(
  page: FetchedPage,
  baseDomain?: string
): CollectionPageExtract {
  const $ = cheerio.load(page.html);
  const baseUrl = page.finalUrl;
  const domain = baseDomain ?? new URL(baseUrl).hostname;

  const productUrls = new Set<string>();
  const storeUrls = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = normalizeUrl(href, baseUrl);
    if (!abs) return;

    // Skip non-product links
    if (
      /\/cart|\/checkout|\/account|\/login|\/search|\/blog|\/about|\/contact|\/policy/i.test(abs)
    )
      return;

    if (looksLikeProductUrl(abs)) {
      productUrls.add(canonicalizeUrl(abs));
    }
    // Store/category links for potential further discovery
    if (/\/stores\/|\/collections\/|\/category\//i.test(abs) && isSameDomain(abs, domain)) {
      storeUrls.add(canonicalizeUrl(abs));
    }
  });

  const notes: string[] = [];
  notes.push(`Found ${productUrls.size} product links, ${storeUrls.size} store/collection links`);

  return {
    childProductUrls: Array.from(productUrls),
    childStoreUrls: Array.from(storeUrls),
    notes: notes.join("; "),
  };
}
