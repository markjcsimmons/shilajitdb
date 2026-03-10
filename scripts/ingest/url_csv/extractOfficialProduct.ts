import * as cheerio from "cheerio";
import type { ProductForm } from "@prisma/client";
import { inferFormFromTitle, normalizeBrandName } from "@/scripts/ingest/discovery/normalize";
import { findCoa, findManufacturing } from "@/scripts/ingest/web/extract";
import type { FetchedPage } from "./types";
import type { OfficialProductExtract, EvidenceSnippet } from "./types";

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

function extractCoaLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  const text = $("body").text().toLowerCase();
  const hasCoaKeyword = /\bcoa\b|certificate of analysis|lab test|lab results/i.test(text);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().toLowerCase();
    if (!href) return;
    const abs = normalizeUrl(href, baseUrl);
    if (!abs) return;
    if (/pinterest|facebook|twitter|instagram|share|addtoany/i.test(abs)) return;
    const isPdf = abs.toLowerCase().includes(".pdf");
    const hasCoaInLink = /coa|certificate|analysis|lab[- ]?test|lab[- ]?results/.test(abs.toLowerCase());
    const hasCoaInText = /coa|lab test|certificate|analysis|see our.*lab|lab tests here/.test(text);
    if ((isPdf && hasCoaKeyword) || (hasCoaInLink && hasCoaKeyword) || hasCoaInText) {
      links.push(abs);
    }
  });
  const filtered = links.filter((u) => !u.includes("#") || u.includes(".pdf"));
  const preferred = filtered.filter((u) => /\.pdf$/i.test(u) || /coa|certificate|lab|analysis/i.test(u));
  return [...new Set(preferred.length ? preferred : filtered)];
}

function extractGtin(text: string): string | null {
  const match = text.match(/\b(\d{12,14})\b/);
  if (!match) return null;
  const digits = match[1].replace(/\D/g, "");
  if (digits.length >= 12 && digits.length <= 14) return digits;
  return null;
}

function extractNetQuantity(text: string): string | null {
  const patterns = [
    /\b(\d+\s*(?:g|gram|mg|ml|oz|serving|capsule|cap|softgel|gummy|piece)s?)\b/i,
    /\b(\d+\s*×\s*\d+)\s*(?:g|mg|ml|oz)?/i,
    /\bnet\s*(?:wt\.?|weight)?\s*[:\s]*([\d.]+\s*(?:g|oz|ml|mg)[^.]*)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim().slice(0, 80);
  }
  return null;
}

/**
 * Extract product data from an official product page.
 */
export function extractOfficialProduct(
  page: FetchedPage,
  inputName?: string
): OfficialProductExtract {
  const $ = cheerio.load(page.html);
  const text = page.textSnippet;
  const baseUrl = page.finalUrl;

  // Product name: h1, og:title, or input
  let productName =
    collapse($("h1").first().text()) ||
    page.metaTags["og:title"] ||
    page.title ||
    inputName ||
    null;

  // Brand: og:brand, schema, or from domain
  let brand =
    page.metaTags["og:brand"] ??
    page.metaTags["product:brand"] ??
    extractBrandFromSchema($) ??
    null;
  if (brand) brand = normalizeBrandName(brand);

  // Form
  const form: ProductForm =
    inferFormFromTitle(productName ?? "") ??
    inferFormFromTitle(page.title ?? "") ??
    inferForm((productName ?? "") + " " + text);

  // Ingredients
  const ingredientsText = extractIngredients($, text);

  // Manufacturing
  const mfg = findManufacturing(text);
  const manufacturingClaim =
    "quote" in mfg ? mfg.quote : null;

  // COA
  const coaLinks = extractCoaLinks($, baseUrl);
  const coaFinding = findCoa(text, coaLinks);
  const coaUrls = coaLinks.length ? coaLinks : coaFinding.status === "PUBLIC" && coaFinding.coaUrl ? [coaFinding.coaUrl] : [];

  // GTIN
  const gtin = extractGtin(text) ?? extractGtinFromSchema($) ?? null;

  // Net quantity
  const netQuantity = extractNetQuantity(text) ?? null;

  // Evidence snippets
  const evidence: EvidenceSnippet[] = [];
  if (coaUrls.length) {
    evidence.push({
      type: "COA",
      url: coaUrls[0],
      quote: "COA/lab results link found on page.",
    });
  }
  if (manufacturingClaim) {
    evidence.push({
      type: "MANUFACTURING",
      url: baseUrl,
      quote: manufacturingClaim.slice(0, 200),
    });
  }
  if (ingredientsText) {
    evidence.push({
      type: "INGREDIENTS",
      url: baseUrl,
      quote: ingredientsText.slice(0, 300),
    });
  }

  // Canonical creation rule (tightened): require at least one stable identity signal
  const hasProductName = Boolean(productName?.trim());
  const hasBrand = Boolean(brand?.trim());
  const isClearlyProduct = /product|shop|buy|add to cart/i.test(text);
  const hasProductSchema = Boolean(extractGtinFromSchema($) || hasProductTypeInSchema($));

  const stableSignals: string[] = [];
  if (gtin) stableSignals.push("GTIN");
  if (netQuantity?.trim()) stableSignals.push("net_quantity");
  if (hasProductSchema) stableSignals.push("product_schema");
  const urlPath = baseUrl ? new URL(baseUrl).pathname : "";
  const strongUrlTitle = hasProductName && hasBrand && /\/products?\/[^/]+/i.test(urlPath);
  if (strongUrlTitle) stableSignals.push("canonical_url_title");

  const stableIdentitySignal = stableSignals.length ? stableSignals.join("|") : null;
  const hasStableSignal = stableSignals.length >= 1;

  let canonicalSkipReason: string | null = null;
  const canCreateCanonical =
    hasProductName &&
    hasBrand &&
    isClearlyProduct &&
    hasStableSignal;

  if (!canCreateCanonical && hasProductName && hasBrand) {
    if (!hasStableSignal) {
      canonicalSkipReason = "no_stable_identity_signal";
    } else if (!isClearlyProduct) {
      canonicalSkipReason = "page_may_not_be_pdp";
    }
  }

  let confidence = 0.5;
  if (hasProductName) confidence += 0.2;
  if (hasBrand) confidence += 0.2;
  if (ingredientsText || manufacturingClaim || coaUrls.length) confidence += 0.1;
  if (gtin) confidence += 0.1;
  confidence = Math.min(1, confidence);

  const notes: string[] = [];
  if (!hasBrand) notes.push("brand missing");
  if (!hasProductName) notes.push("product name missing");
  if (!isClearlyProduct) notes.push("page may not be product PDP");
  if (!hasStableSignal && canCreateCanonical === false) notes.push("no stable identity signal (GTIN, net qty, schema, or strong URL)");

  return {
    productName,
    brand,
    form,
    ingredientsText,
    manufacturingClaim,
    coaUrls,
    gtin,
    netQuantity,
    pageTitle: page.title,
    evidence,
    canCreateCanonical,
    confidence,
    notes: notes.join("; ") || "ok",
    stableIdentitySignal,
    canonicalSkipReason,
  };
}

function collapse(s: string) {
  return s.replace(/\s+/g, " ").trim() || null;
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
  // Supplement facts / ingredients section
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

function hasProductTypeInSchema($: cheerio.CheerioAPI): boolean {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() ?? "{}");
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        if (item["@type"] === "Product") return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}
