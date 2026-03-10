import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";
import type { UrlClassificationResult, UrlKind } from "./types";

/** Retailer domains: structured supplement retailers with richer PDP data (but NOT authoritative for COA/manufacturing) */
const RETAILER_DOMAINS = new Set([
  "iherb.com",
  "www.iherb.com",
  "vitacost.com",
  "www.vitacost.com",
  "swansonvitamins.com",
  "www.swansonvitamins.com",
  "vitaminshoppe.com",
  "www.vitaminshoppe.com",
]);

/** Marketplace domains that host third-party product listings (minimal extraction) */
const MARKETPLACE_DOMAINS = new Set([
  "amazon.com",
  "www.amazon.com",
  "amzn.to",
  "walmart.com",
  "www.walmart.com",
  "ebay.com",
  "www.ebay.com",
  "etsy.com",
  "www.etsy.com",
  "target.com",
  "www.target.com",
  "costco.com",
  "www.costco.com",
  "cvs.com",
  "www.cvs.com",
  "walgreens.com",
  "www.walgreens.com",
]);

/** PDP path patterns for retailers (iHerb, Vitacost, etc.) */
const RETAILER_PDP_PATTERNS = [
  /\/[^/]+\/p\/\d+/i, // iHerb: /brand/product-name/p/12345
  /\/p\/[^/]+/i, // Vitacost, Swanson
  /\/products?\/[^/]+/i,
];

/** PDP (product detail page) path patterns for marketplaces */
const MARKETPLACE_PDP_PATTERNS = [
  /\/dp\/[A-Z0-9]+/i, // Amazon: /dp/B0BDRPMQPP
  /\/gp\/product\/[A-Z0-9]+/i, // Amazon alt
  /\/product\/[^/]+/i, // Walmart, others
  /\/ip\/[^/]+/i, // Walmart /ip/Product-Name/123
  /\/p\/[^/]+/i, // Target
  /\/itm\/[^/]+/i, // eBay
  /\/listing\/\d+/i, // Etsy
];

/** Collection/category/search patterns */
const COLLECTION_PATTERNS = [
  /\/collections?\//i,
  /\/search\b/i,
  /\/category\//i,
  /\/shop\/(?:page\/|category\/|tag\/)/i,
  /\/stores\/[^/]+\/page\//i, // Amazon store
  /\/stores\/[^/]+\/search\b/i,
  /\/c\/[^/]+/i, // /c/category
];

/** Store page patterns (Amazon storefront, etc.) */
const STORE_PATTERNS = [
  /\/stores\/[^/]+\/?$/i,
  /\/stores\/[^/]+\/page\/[^/]+/i,
];

/** Official product page path patterns (non-marketplace, non-retailer). /shop/ removed - often collection. */
const OFFICIAL_PRODUCT_PATTERNS = [
  /\/products\/[^/]+/i,
  /\/product\/[^/]+/i,
  /\/p\/[^/]+/i,
  /\/item\/[^/]+/i,
  /\/buy\/[^/]+/i,
  /\/pd\/[^/]+/i,
  /\/supplement\/[^/]+/i,
  /\/vitamins?\/[^/]+/i,
  /\/collections\/[^/]+\/products\/[^/]+/i, // Shopify collection PDP
];

/** Exclude patterns (not product pages) */
const EXCLUDE_PATTERNS = [
  { pattern: /\/blogs?\//i, reason: "blog" },
  { pattern: /\/pages\//i, reason: "pages" },
  { pattern: /\/polic(?:y|ies)\//i, reason: "policy" },
  { pattern: /\/account\b|\/login\b|\/register\b|\/profile\b/i, reason: "account" },
  { pattern: /\/cart\b|\/checkout\b/i, reason: "cart" },
  { pattern: /\/about\b|\/faq\b|\/contact\b|\/help\b/i, reason: "info" },
  { pattern: /\.(xml|json|pdf|zip|css|js|svg|png|jpg|jpeg|gif|webp)(\?|#|$)/i, reason: "file" },
];

function isRetailerDomain(domain: string): boolean {
  const base = domain.replace(/^www\./, "");
  return RETAILER_DOMAINS.has(base) || RETAILER_DOMAINS.has(domain);
}

function isMarketplaceDomain(domain: string): boolean {
  const base = domain.replace(/^www\./, "");
  return MARKETPLACE_DOMAINS.has(base) || MARKETPLACE_DOMAINS.has(domain);
}

function isPdpOnRetailer(pathname: string): boolean {
  return RETAILER_PDP_PATTERNS.some((p) => p.test(pathname));
}

function isPdpOnMarketplace(pathname: string): boolean {
  return MARKETPLACE_PDP_PATTERNS.some((p) => p.test(pathname));
}

function isCollectionOrStore(pathname: string): { collection: boolean; store: boolean } {
  const collection = COLLECTION_PATTERNS.some((p) => p.test(pathname));
  const store = STORE_PATTERNS.some((p) => p.test(pathname));
  return { collection, store };
}

function isOfficialProductPath(pathname: string): boolean {
  return OFFICIAL_PRODUCT_PATTERNS.some((p) => p.test(pathname));
}

function isExcluded(pathname: string): string | null {
  for (const { pattern, reason } of EXCLUDE_PATTERNS) {
    if (pattern.test(pathname)) return reason;
  }
  return null;
}

function isHomepage(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/" || p === "";
}

/**
 * Classify a URL into one of the UrlKind types.
 */
export function classifyUrlForCsv(url: string): UrlClassificationResult {
  const canonicalizedUrl = canonicalizeUrl(url);
  const domain = extractDomain(url);

  if (!url.trim()) {
    return {
      kind: "UNKNOWN",
      domain: "",
      canonicalizedUrl: "",
      confidence: 0,
      reason: "empty URL",
    };
  }

  let pathname: string;
  try {
    pathname = new URL(url.startsWith("http") ? url : `https://${url}`).pathname;
  } catch {
    return {
      kind: "UNKNOWN",
      domain,
      canonicalizedUrl,
      confidence: 0,
      reason: "invalid URL",
    };
  }

  const excluded = isExcluded(pathname);
  if (excluded) {
    return {
      kind: "UNKNOWN",
      domain,
      canonicalizedUrl,
      confidence: 0.9,
      reason: `excluded: ${excluded}`,
    };
  }

  // Retailer PDP (iHerb, Vitacost, etc.) - richer extraction, but NOT authoritative for COA/manufacturing
  if (isRetailerDomain(domain) && isPdpOnRetailer(pathname)) {
    return {
      kind: "RETAILER_PRODUCT_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.9,
      reason: "retailer PDP (iHerb/Vitacost/etc)",
    };
  }

  // Collection or store on retailer
  if (isRetailerDomain(domain)) {
    const { collection, store } = isCollectionOrStore(pathname);
    if (store) {
      return { kind: "STORE_PAGE", domain, canonicalizedUrl, confidence: 0.9, reason: "retailer store page" };
    }
    if (collection) {
      return { kind: "COLLECTION_PAGE", domain, canonicalizedUrl, confidence: 0.9, reason: "retailer collection/search" };
    }
    return { kind: "UNKNOWN", domain, canonicalizedUrl, confidence: 0.5, reason: "retailer domain but path not recognized" };
  }

  // Marketplace PDP
  if (isMarketplaceDomain(domain) && isPdpOnMarketplace(pathname)) {
    return {
      kind: "MARKETPLACE_PRODUCT_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.95,
      reason: "marketplace PDP (amazon/walmart/etc)",
    };
  }

  // Collection or store on marketplace
  if (isMarketplaceDomain(domain)) {
    const { collection, store } = isCollectionOrStore(pathname);
    if (store) {
      return {
        kind: "STORE_PAGE",
        domain,
        canonicalizedUrl,
        confidence: 0.9,
        reason: "marketplace store page",
      };
    }
    if (collection) {
      return {
        kind: "COLLECTION_PAGE",
        domain,
        canonicalizedUrl,
        confidence: 0.9,
        reason: "marketplace collection/search",
      };
    }
    // Marketplace but not PDP/store/collection — treat as unknown
    return {
      kind: "UNKNOWN",
      domain,
      canonicalizedUrl,
      confidence: 0.5,
      reason: "marketplace domain but path not recognized",
    };
  }

  // Non-marketplace: homepage
  if (isHomepage(pathname)) {
    return {
      kind: "HOMEPAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.95,
      reason: "root or near-root path",
    };
  }

  // Non-marketplace: collection/store
  const { collection, store } = isCollectionOrStore(pathname);
  if (store) {
    return {
      kind: "STORE_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.85,
      reason: "store page pattern",
    };
  }
  if (collection) {
    return {
      kind: "COLLECTION_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.9,
      reason: "collection/search/category",
    };
  }

  // Non-marketplace: official product page
  if (isOfficialProductPath(pathname)) {
    return {
      kind: "OFFICIAL_PRODUCT_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.9,
      reason: "product path (/products/, /product/, etc)",
    };
  }

  // Deep path on non-marketplace — might be product
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return {
      kind: "OFFICIAL_PRODUCT_PAGE",
      domain,
      canonicalizedUrl,
      confidence: 0.6,
      reason: "deep path, possible product",
    };
  }

  return {
    kind: "UNKNOWN",
    domain,
    canonicalizedUrl,
    confidence: 0.3,
    reason: "no matching pattern",
  };
}
