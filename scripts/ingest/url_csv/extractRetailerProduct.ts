import * as cheerio from "cheerio";
import type { ProductForm } from "@prisma/client";
import { inferFormFromTitle, normalizeBrandName } from "@/scripts/ingest/discovery/normalize";
import { normalizeGtin } from "@/scripts/ingest/discovery/normalize";
import type { FetchedPage } from "./types";
import type { RetailerProductExtract } from "./types";

function collapse(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

const FORM_KEYWORDS: Array<{ pattern: RegExp; form: ProductForm }> = [
  { pattern: /\bresin\b/i, form: "RESIN" },
  { pattern: /\bcapsule(s)?\b/i, form: "CAPSULE" },
  { pattern: /\bpowder\b/i, form: "POWDER" },
  { pattern: /\bgumm(y|ies)\b/i, form: "GUMMY" },
  { pattern: /\bdrops?\b|\bliquid\b|\btincture\b/i, form: "LIQUID" },
  { pattern: /\bblend\b/i, form: "BLEND" },
];

function inferForm(text: string): ProductForm {
  for (const { pattern, form } of FORM_KEYWORDS) {
    if (pattern.test(text)) return form;
  }
  return "OTHER";
}

/**
 * Extract richer product data from retailer pages (iHerb, Vitacost, Swanson, Vitamin Shoppe).
 * Does NOT treat as authoritative for COA or manufacturing claims.
 */
export function extractRetailerProduct(
  page: FetchedPage,
  inputName?: string
): RetailerProductExtract {
  const $ = cheerio.load(page.html);
  const text = page.textSnippet;

  // Title
  let title =
    collapse($("h1").first().text()) ||
    page.metaTags["og:title"] ||
    page.title ||
    inputName ||
    null;
  if (title) title = collapse(title);

  // Brand
  let brand =
    page.metaTags["og:brand"] ??
    page.metaTags["product:brand"] ??
    extractBrandFromSchema($) ??
    null;
  const brandMatch = text.match(/\bBrand\s*[:\s]+\s*([^\n]+?)(?:\n|$)/i);
  if (!brand && brandMatch?.[1]) brand = collapse(brandMatch[1]);
  if (brand) brand = normalizeBrandName(brand);

  // Form
  const form: ProductForm =
    inferFormFromTitle(title ?? "") ??
    inferFormFromTitle(page.title ?? "") ??
    inferForm((title ?? "") + " " + text);

  // Ingredients / supplement facts (richer extraction allowed)
  const ingredientsText = extractIngredients($, text);

  // Net quantity / size
  let sizeOrCount: string | null = null;
  const patterns = [
    /\b(\d+\s*(?:g|gram|mg|ml|oz|serving|capsule|cap|softgel|gummy|piece)s?)\b/i,
    /\bnet\s*(?:wt\.?|weight)?\s*[:\s]*([\d.]+\s*(?:g|oz|ml|mg)[^.]*)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      sizeOrCount = m[1].trim().slice(0, 80);
      break;
    }
  }

  // GTIN
  let gtin: string | null = extractGtinFromSchema($);
  if (!gtin) {
    const gtinMatch = text.match(/\b(?:UPC|EAN|GTIN)\s*[:\s]+\s*(\d{12,14})/i);
    if (gtinMatch?.[1]) gtin = normalizeGtin(gtinMatch[1]) ?? gtinMatch[1];
  }

  // Images
  const imageUrls: string[] = [];
  const ogImage = page.metaTags["og:image"];
  if (ogImage) imageUrls.push(ogImage);

  const notes =
    "Retailer product page: extracted product data, but COA/manufacturing must be verified from official source.";

  return {
    title,
    brand,
    form,
    ingredientsText,
    sizeOrCount,
    gtin,
    imageUrls,
    canCreateCanonical: false,
    notes,
  };
}

function extractBrandFromSchema($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() ?? "{}");
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        if (item["@type"] === "Product" && item.brand) {
          const b = item.brand;
          return typeof b === "string" ? b : b.name ?? null;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function extractIngredients($: cheerio.CheerioAPI, text: string): string | null {
  const headings = $("h2, h3, h4, dt, strong, .ingredients, .supplement-facts, [class*='ingredient']");
  for (let i = 0; i < headings.length; i++) {
    const h = $(headings[i]);
    const label = h.text().toLowerCase();
    if (/ingredient|supplement fact|what'?s inside/i.test(label)) {
      const next = h.next().text() || h.parent().text();
      const match = next.match(/[:]\s*([\s\S]{20,500})/);
      if (match?.[1]) return collapse(match[1]).slice(0, 1000);
    }
  }
  const match = text.match(/(?:ingredients?|supplement facts?)\s*[:\s]+([^\n]{20,500})/i);
  return match?.[1] ? collapse(match[1]).slice(0, 1000) : null;
}

function extractGtinFromSchema($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() ?? "{}");
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        if (item["@type"] === "Product" && item.gtin) {
          const g = String(item.gtin).replace(/\D/g, "");
          if (g.length >= 12 && g.length <= 14) return g;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}
