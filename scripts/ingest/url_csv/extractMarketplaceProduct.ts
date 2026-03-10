import * as cheerio from "cheerio";
import { normalizeBrandName } from "@/scripts/ingest/discovery/normalize";
import { normalizeGtin } from "@/scripts/ingest/discovery/normalize";
import type { FetchedPage } from "./types";
import type { MarketplaceProductExtract } from "./types";

function collapse(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Extract ASIN from Amazon URL.
 */
function extractAsin(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m?.[1] ?? null;
}

/**
 * Extract minimal, trustworthy data from a marketplace product page.
 * Does NOT treat as authoritative for COA, manufacturing, or full ingredients.
 */
export function extractMarketplaceProduct(
  page: FetchedPage,
  inputName?: string,
  domain?: string
): MarketplaceProductExtract {
  const $ = cheerio.load(page.html);
  const text = page.textSnippet;

  // Title: from page title or h1
  let title = collapse($("#productTitle").text()) || collapse($("h1#title").text());
  if (!title) {
    title = page.metaTags["og:title"] ?? page.title ?? inputName ?? null;
  }
  if (title) title = collapse(title);

  // Brand: Amazon has "Brand: X", Walmart similar - use text regex (DOM varies)
  let brand: string | null = null;
  const brandMatch = text.match(/\bBrand\s*[:\s]+\s*([^\n]+?)(?:\n|$)/i);
  if (brandMatch?.[1]) brand = collapse(brandMatch[1]);
  if (!brand) {
    $("tr").each((_, tr) => {
      const th = $(tr).find("th").text();
      if (/^Brand\s*$/i.test(collapse(th))) {
        const td = $(tr).find("td").last().text();
        if (td) brand = collapse(td);
        return false; // break
      }
    });
  }
  if (brand) brand = normalizeBrandName(brand);

  // Size / count
  let sizeOrCount: string | null = null;
  const sizeMatch = text.match(/(\d+\s*(?:g|gram|mg|ml|oz|serving|capsule|cap|count)s?)/i);
  if (sizeMatch?.[1]) sizeOrCount = sizeMatch[1];

  // ASIN / product ID
  let asinOrId: string | null = extractAsin(page.finalUrl);
  if (!asinOrId) {
    const asinMatch = text.match(/\bASIN\s*[:\s]+\s*([A-Z0-9]{10})/i);
    if (asinMatch?.[1]) asinOrId = asinMatch[1];
  }

  // Images
  const imageUrls: string[] = [];
  $("img[data-a-dynamic-image], img[src*='images']").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src && !src.includes("spinner") && !src.includes("pixel")) {
      try {
        const abs = new URL(src, page.finalUrl).toString();
        if (abs.includes("images") || abs.includes("media")) imageUrls.push(abs);
      } catch {
        // ignore
      }
    }
  });
  const ogImage = page.metaTags["og:image"];
  if (ogImage && !imageUrls.includes(ogImage)) imageUrls.unshift(ogImage);

  // GTIN only if clearly visible (UPC, EAN)
  let gtin: string | null = null;
  {
    const gtinMatch = text.match(/\b(?:UPC|EAN|GTIN)\s*[:\s]+\s*(\d{12,14})/i);
    if (gtinMatch?.[1]) gtin = normalizeGtin(gtinMatch[1]) ?? gtinMatch[1];
  }

  // Marketplace pages: listing only, no canonical by default
  const canCreateCanonical = false;
  const listingOnly = true;

  // Optional candidate suggestion if title + brand are strong
  const candidateProductSuggestion =
    title && brand
      ? { brand, title }
      : null;

  const notes: string[] = [];
  if (!title) notes.push("title missing");
  if (!brand) notes.push("brand missing");
  notes.push("marketplace page - listing only, not authoritative for COA/manufacturing");

  return {
    title,
    brand,
    sizeOrCount,
    asinOrId,
    imageUrls: imageUrls.slice(0, 5),
    gtin,
    canCreateCanonical,
    listingOnly,
    candidateProductSuggestion,
    notes: notes.join("; "),
  };
}
