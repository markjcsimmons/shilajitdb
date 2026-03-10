/**
 * Classify sitemap URLs as likely product pages vs. non-product pages.
 *
 * Returns a ClassifyResult (productUrls / otherUrls) for batch classification,
 * and exports classifyUrl() for per-URL classification with confidence + reason.
 *
 * Product signals (include):
 *   /products/{slug}           – Shopify / generic
 *   /product/{slug}            – generic
 *   /collections/{c}/products/{slug}  – Shopify PDP within a collection
 *   /p/{id}                    – many platforms
 *   /shop/{slug}               – NOT /shop/page/N
 *   /item/{id}                 – generic
 *   /buy/{slug}                – generic
 *   /pd/{id}                   – common
 *   /supplement/{slug}         – health niche
 *   /vitamins/{slug}           – health niche
 *
 * Exclude signals (reject even when a product pattern is present):
 *   /blog/ /blogs/ /news/
 *   /pages/
 *   /policies/ /policy/
 *   /account/ /login/ /register/ /profile/
 *   /cart /checkout
 *   /search
 *   /collections (bare) — but NOT /collections/{c}/products/{slug}
 *   /shop/page/ or /shop/category/
 *   /wp-json /wp-admin /wp-content
 *   /tag/ /category/
 *   /about /faq /contact /help
 *   /cdn/ /assets/ /static/
 *   Files: .xml .json .pdf .zip .css .js .svg image types
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type UrlClassification = {
  isProduct: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type ClassifyResult = {
  productUrls: string[];
  otherUrls: string[];
};

// ─── Include patterns ─────────────────────────────────────────────────────────

type IncludeRule = { pattern: RegExp; confidence: "high" | "medium"; label: string };

const INCLUDE_RULES: IncludeRule[] = [
  // Shopify PDP inside a collection — highest confidence
  { pattern: /\/collections\/[^/]+\/products\/[^/]+/i, confidence: "high", label: "Shopify collection PDP" },
  // Bare /products/{slug} — very common
  { pattern: /\/products\/[^/]+/i, confidence: "high", label: "/products/{slug}" },
  // /product/{slug}
  { pattern: /\/product\/[^/]+/i, confidence: "high", label: "/product/{slug}" },
  // /p/{id-or-slug} — single segment after /p/
  { pattern: /\/p\/[^/]+/i, confidence: "high", label: "/p/{id}" },
  // /item/{id}
  { pattern: /\/item\/[^/]+/i, confidence: "medium", label: "/item/{id}" },
  // /buy/{slug}
  { pattern: /\/buy\/[^/]+/i, confidence: "medium", label: "/buy/{slug}" },
  // /pd/{id}
  { pattern: /\/pd\/[^/]+/i, confidence: "medium", label: "/pd/{id}" },
  // /shop/{slug} (but NOT /shop/page/N or /shop/category/)
  { pattern: /\/shop\/(?!page\/|category\/|tag\/)[^/]+/i, confidence: "medium", label: "/shop/{slug}" },
  // Health-supplement niche
  { pattern: /\/supplement\/[^/]+/i, confidence: "medium", label: "/supplement/{slug}" },
  { pattern: /\/vitamins?\/[^/]+/i, confidence: "medium", label: "/vitamins/{slug}" },
];

// ─── Exclude patterns ─────────────────────────────────────────────────────────

type ExcludeRule = { pattern: RegExp; reason: string };

const EXCLUDE_RULES: ExcludeRule[] = [
  { pattern: /\/blogs?\//i,             reason: "blog" },
  { pattern: /\/news\//i,               reason: "news" },
  { pattern: /\/pages\//i,              reason: "pages" },
  { pattern: /\/polic(?:y|ies)\//i,     reason: "policy" },
  { pattern: /\/account\b/i,            reason: "account" },
  { pattern: /\/login\b/i,              reason: "login" },
  { pattern: /\/register\b/i,           reason: "register" },
  { pattern: /\/profile\b/i,            reason: "profile" },
  { pattern: /\/cart\b/i,               reason: "cart" },
  { pattern: /\/checkout\b/i,           reason: "checkout" },
  { pattern: /\/search\b/i,             reason: "search" },
  { pattern: /\/tag\//i,                reason: "tag" },
  { pattern: /\/category\//i,           reason: "category" },
  { pattern: /\/about\b/i,              reason: "about" },
  { pattern: /\/faq\b/i,                reason: "faq" },
  { pattern: /\/contact\b/i,            reason: "contact" },
  { pattern: /\/help\b/i,               reason: "help" },
  { pattern: /\/cdn\//i,                reason: "cdn" },
  { pattern: /\/assets\//i,             reason: "assets" },
  { pattern: /\/static\//i,             reason: "static" },
  { pattern: /\/wp-json\b/i,            reason: "wp-json" },
  { pattern: /\/wp-admin\b/i,           reason: "wp-admin" },
  { pattern: /\/wp-content\//i,         reason: "wp-content" },
  // Shopify bare collection index (no /products/ segment)
  { pattern: /\/collections\/?$/i,      reason: "collections index" },
  // Paginated collections e.g. /collections/all?page=2
  { pattern: /\/collections\/[^/]+\/?(\\?|$)/i, reason: "bare collection" },
  // File extensions
  { pattern: /\.(xml|json|pdf|zip|css|js|ts|svg|png|jpg|jpeg|gif|webp|ico)(\?|#|$)/i, reason: "file extension" },
];

// ─── Core classifier ──────────────────────────────────────────────────────────

/**
 * Classify a single URL.
 * Returns { isProduct, confidence, reason }.
 */
export function classifyUrl(url: string): UrlClassification {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return { isProduct: false, confidence: "low", reason: "invalid URL" };
  }

  // Check exclude rules first (order matters — /collections/.*/products/... is an include,
  // but bare /collections/ is an exclude; include rules are checked after excludes except
  // for the Shopify collection PDP which must take priority).

  // Special-case: Shopify collection PDP must win over the bare-collection exclude.
  const shopifyPdpMatch = /\/collections\/[^/]+\/products\/[^/]+/i.test(pathname);

  if (!shopifyPdpMatch) {
    for (const rule of EXCLUDE_RULES) {
      if (rule.pattern.test(pathname)) {
        return { isProduct: false, confidence: "high", reason: `excluded: ${rule.reason}` };
      }
    }
  }

  for (const rule of INCLUDE_RULES) {
    if (rule.pattern.test(pathname)) {
      return { isProduct: true, confidence: rule.confidence, reason: rule.label };
    }
  }

  return { isProduct: false, confidence: "low", reason: "no product pattern matched" };
}

/**
 * Heuristic: URL path looks like a product detail page.
 * Backward-compatible wrapper used by harvestOfficialProductUrlsFromSitemaps.ts.
 */
export function isLikelyProductUrl(url: string): boolean {
  return classifyUrl(url).isProduct;
}

/**
 * Split a list of sitemap URLs into product and non-product groups.
 */
export function classifyUrls(urls: string[]): ClassifyResult {
  const productUrls: string[] = [];
  const otherUrls: string[] = [];

  for (const url of urls) {
    if (isLikelyProductUrl(url)) {
      productUrls.push(url);
    } else {
      otherUrls.push(url);
    }
  }

  return { productUrls, otherUrls };
}
