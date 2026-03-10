/**
 * OCR contact extraction from DSLD label images.
 *
 * Uses tesseract.js (pure Node/WASM, no paid APIs).
 * Install: npm install tesseract.js
 *
 * Strategy:
 *  1. Download label image as Buffer (cached on disk).
 *  2. Run Tesseract OCR (English, sparse-text mode for speed).
 *  3. Normalize OCR output to recover domains split by spaces/newlines.
 *  4. Extract domains, emails, and US phone numbers via regex.
 *  5. Filter through a strict blocklist.
 *  6. Stop early once at least one plausible brand domain is found.
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";

// ─── Image-buffer cache ────────────────────────────────────────────────────────

const IMAGE_CACHE_DIR = path.join(process.cwd(), ".cache", "dsld-images");

async function getImageCachePath(url: string): Promise<string> {
  await fs.mkdir(IMAGE_CACHE_DIR, { recursive: true });
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  return path.join(IMAGE_CACHE_DIR, `${hash}`);
}

// ─── Blocklists ────────────────────────────────────────────────────────────────

/** Marketplace, social, CDN, search-engine, and email-provider domains to ignore. */
const DOMAIN_BLOCKLIST = new Set([
  // Marketplaces
  "amazon.com", "amazon.ca", "amazon.co.uk",
  "walmart.com", "ebay.com", "aliexpress.com", "temu.com",
  "etsy.com", "target.com", "costco.com", "samsclub.com",
  "iherb.com", "vitacost.com", "swansonvitamins.com", "luckyvitamin.com",
  // Social / video
  "facebook.com", "instagram.com", "tiktok.com", "youtube.com",
  "twitter.com", "x.com", "pinterest.com", "linkedin.com",
  // Search
  "google.com", "bing.com", "yahoo.com", "duckduckgo.com",
  // Email providers — OK to store as email, but NOT as brand domain
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "aol.com", "protonmail.com", "icloud.com",
  // Govt / regulatory — never brand sites
  "dsld.od.nih.gov", "nih.gov", "fda.gov", "usda.gov", "ftc.gov",
  // CDN / hosting infrastructure
  "cloudfront.net", "amazonaws.com", "s3.amazonaws.com",
  "fastly.net", "akamaihd.net",
  // Website builders / platforms
  "shopify.com", "myshopify.com",
  "squarespace.com", "wix.com", "weebly.com",
  "wordpress.com", "blogspot.com",
  // Coupon / affiliate
  "honey.com", "rakuten.com", "retailmenot.com",
]);

/** Brands that are only email providers — not brand domains when seen as domain in a URL. */
const EMAIL_ONLY_DOMAINS = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]);

/** TLDs that are nearly never brand primary domains. */
const UNLIKELY_TLDS = new Set(["gov", "edu", "mil"]);

/**
 * TLDs we accept as plausible brand domains.
 * Conservative: don't accept random obscure TLDs from OCR noise.
 */
const ACCEPTED_TLDS = new Set([
  "com", "net", "org", "io", "co", "us", "ca", "ai",
  "shop", "store", "health", "life", "med", "bio", "fit",
  "app", "info", "biz", "uk", "au", "de", "fr", "eu",
  "nu", "me", "tv", "is", "ly", "to",
]);

// ─── OCR text normalization ────────────────────────────────────────────────────

/**
 * Normalize raw OCR text to recover domains that were split by spaces/newlines.
 *
 * Common OCR failure modes:
 *   "brand . com"   → "brand.com"
 *   "www .brand.com" → "www.brand.com"
 *   "brand.c om"    → "brand.com"
 *   "BrandName.COM"  → "brandname.com" (lowercased)
 *
 * We do NOT do aggressive character substitution (0↔o, 1↔l) globally — that
 * creates too many false positives. Instead we recover spaces around dots.
 */
function normalizeOcrText(raw: string): string {
  let t = raw.toLowerCase();

  // Collapse spaces that are immediately adjacent to a dot, both sides:
  //   "brand .com" → "brand.com"
  //   "brand. com" → "brand.com"
  //   "brand . com" → "brand.com"
  t = t.replace(/\s*\.\s*/g, ".");

  // Collapse remaining multi-space runs to single space.
  t = t.replace(/[ \t]+/g, " ");

  return t;
}

/**
 * Secondary pass: for domain-like tokens where OCR split internal chars with a
 * space, try to merge words that together form a plausible domain.
 * e.g. ["bran", "d.com"] → "brand.com" (only if together they form a valid domain)
 *
 * We do this by looking at adjacent tokens and seeing if joining them passes
 * the domain validator.
 */
function mergeAdjacentTokens(text: string): string {
  // Slide a 2-word window: if "A B" → "AB" is a valid domain, emit "AB" in output.
  const words = text.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    const w = words[i]!;
    const next = words[i + 1];
    if (next !== undefined) {
      const merged = w + next;
      // Only merge if the result looks like a domain (contains a dot, short enough)
      if (merged.includes(".") && merged.length <= 64 && /^[a-z0-9][a-z0-9\-\.]+[a-z]$/.test(merged)) {
        out.push(merged);
        i += 2;
        continue;
      }
    }
    out.push(w);
    i += 1;
  }
  return out.join(" ");
}

// ─── Domain validation ─────────────────────────────────────────────────────────

function normalizeDomain(raw: string): string {
  const d = raw.toLowerCase().replace(/\s+/g, "").trim();
  return d.startsWith("www.") ? d.slice(4) : d;
}

function isBlocklistedDomain(domain: string): boolean {
  const d = normalizeDomain(domain);
  if (DOMAIN_BLOCKLIST.has(d)) return true;
  for (const blocked of DOMAIN_BLOCKLIST) {
    if (d.endsWith(`.${blocked}`)) return true;
  }
  const tld = d.split(".").pop() ?? "";
  if (UNLIKELY_TLDS.has(tld)) return true;
  return false;
}

function isPlausibleBrandDomain(domain: string): boolean {
  const d = normalizeDomain(domain);
  if (!d.includes(".")) return false;
  if (isBlocklistedDomain(d)) return false;

  const parts = d.split(".");
  const tld = parts[parts.length - 1] ?? "";
  const sld = parts[0] ?? "";

  // Must have a TLD we accept and a second-level domain with 2+ characters.
  if (!ACCEPTED_TLDS.has(tld)) return false;
  if (sld.length < 2) return false;
  // Must not be purely numeric (IP address fragment).
  if (/^\d+$/.test(sld)) return false;

  return true;
}

// ─── Regex patterns ────────────────────────────────────────────────────────────

/** Matches http(s) URLs containing a domain. Works on already-normalized text. */
const URL_REGEX = /https?:\/\/(?:www\.)?([a-z0-9][a-z0-9\-]{0,61}[a-z0-9]?\.[a-z]{2,})(\/[^\s]*)?/g;

/**
 * Matches bare domains (no scheme) after OCR normalization.
 * The TLD is constrained to our ACCEPTED_TLDS set via a suffix check after match.
 */
const BARE_DOMAIN_REGEX = /\b(?:www\.)?([a-z0-9][a-z0-9\-]{1,61}[a-z0-9]?\.[a-z]{2,10})\b/g;

/** Email pattern. */
const EMAIL_REGEX = /\b([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})\b/g;

/** US phone numbers in common formats. */
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// ─── Image download with disk cache ───────────────────────────────────────────

export async function downloadImageBuffer(url: string, timeoutMs = 20000): Promise<Buffer> {
  const cachePath = await getImageCachePath(url);

  // Check disk cache first.
  try {
    const cached = await fs.readFile(cachePath);
    if (cached.length > 0) return cached;
  } catch {
    // Not cached yet.
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "ShilajitTransparencyDatabaseBot/0.1",
        accept: "image/*,*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Persist to disk cache.
    try {
      await fs.writeFile(cachePath, buf);
    } catch {
      // Cache write failure is non-fatal.
    }

    return buf;
  } finally {
    clearTimeout(t);
  }
}

// ─── OCR extraction ─────────────────────────────────────────────────────────────

export type ContactExtractionResult = {
  domains: string[];
  emails: string[];
  phones: string[];
  rawText: string;
  normalizedText: string;
  imageUrl: string;
  fromCache: boolean;
};

/**
 * Run OCR on a single image URL and extract brand contact signals.
 * Applies two-pass OCR text normalization before regex extraction.
 */
export async function ocrExtractFromImageUrl(
  imageUrl: string,
): Promise<ContactExtractionResult> {
  let fromCache = false;
  const cachePath = await getImageCachePath(imageUrl);
  try {
    const stat = await fs.stat(cachePath);
    fromCache = stat.size > 0;
  } catch {
    // not cached
  }

  const buf = await downloadImageBuffer(imageUrl);

  const worker = await createWorker("eng", 1, { logger: () => {} });
  try {
    // PSM 11 = sparse text, fast, good for label snippets.
    await worker.setParameters({
      tessedit_pageseg_mode: "11" as unknown as number,
    });

    const { data } = await worker.recognize(buf);
    const rawText = data.text ?? "";

    // ── Two-pass normalization ─────────────────────────────────────────────────
    const pass1 = normalizeOcrText(rawText);
    const pass2 = mergeAdjacentTokens(pass1);
    const normalizedText = pass2;

    const domains = new Set<string>();
    const emails = new Set<string>();
    const phones = new Set<string>();

    // ── Pass 1: extract from full URLs (highest confidence) ────────────────────
    for (const match of normalizedText.matchAll(URL_REGEX)) {
      const d = normalizeDomain(match[1] ?? "");
      if (d && isPlausibleBrandDomain(d)) domains.add(d);
    }

    // ── Pass 2: extract emails (also infer domain from email) ──────────────────
    for (const match of normalizedText.matchAll(EMAIL_REGEX)) {
      const email = match[1];
      if (!email) continue;
      emails.add(email);
      const parts = email.split("@");
      const emailDomain = normalizeDomain(parts[1] ?? "");
      // Don't infer brand domain from common email providers.
      if (emailDomain && !EMAIL_ONLY_DOMAINS.has(emailDomain) && isPlausibleBrandDomain(emailDomain)) {
        domains.add(emailDomain);
      }
    }

    // ── Pass 3: bare domain regex (lower confidence, only if nothing found yet) ─
    if (domains.size === 0) {
      for (const match of normalizedText.matchAll(BARE_DOMAIN_REGEX)) {
        const d = normalizeDomain(match[1] ?? "");
        if (d && isPlausibleBrandDomain(d)) domains.add(d);
      }
    }

    // ── Pass 4: phones ─────────────────────────────────────────────────────────
    for (const match of rawText.matchAll(PHONE_REGEX)) {
      const phone = match[0].replace(/\s+/g, " ").trim();
      phones.add(phone);
    }

    return {
      domains: Array.from(domains),
      emails: Array.from(emails),
      phones: Array.from(phones),
      rawText: rawText.slice(0, 2000),
      normalizedText: normalizedText.slice(0, 2000),
      imageUrl,
      fromCache,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Run OCR on multiple image URLs.
 * Stops early once at least 1 plausible brand domain is found (default behaviour).
 */
export async function ocrExtractContacts(
  imageUrls: string[],
  { earlyExit = true }: { earlyExit?: boolean } = {},
): Promise<ContactExtractionResult[]> {
  const results: ContactExtractionResult[] = [];

  for (const url of imageUrls) {
    let result: ContactExtractionResult;
    try {
      result = await ocrExtractFromImageUrl(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result = {
        domains: [],
        emails: [],
        phones: [],
        rawText: `ERROR: ${msg}`,
        normalizedText: "",
        imageUrl: url,
        fromCache: false,
      };
    }
    results.push(result);

    if (earlyExit && result.domains.length > 0) break;
  }

  return results;
}
