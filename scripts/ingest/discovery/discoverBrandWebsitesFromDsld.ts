import "dotenv/config";

import { prisma } from "@/lib/db";
import { deriveWebsiteDomain } from "@/lib/url";
import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";
import { fetchJsonWithRetry, fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import { createEmptyStats, finishRun, heartbeatRun, startRun } from "@/scripts/ingest/shared/observability";
import { DomainRateLimiter, Semaphore } from "@/scripts/ingest/web/rateLimit";
import { getRobotsRulesForDomain, isUrlAllowedByRobots } from "@/scripts/ingest/web/robots";
import * as cheerio from "cheerio";
import type { CompanyRole } from "@prisma/client";

type Args = {
  dryRun: boolean;
  maxBrands?: number;
  maxLabelsPerBrand: number;
};

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");

  const maxBrandsIdx = argv.findIndex((a) => a === "--max-brands");
  const maxBrands =
    maxBrandsIdx >= 0 && argv[maxBrandsIdx + 1] ? Number(argv[maxBrandsIdx + 1]) : undefined;

  const maxLabelsIdx = argv.findIndex((a) => a === "--max-labels-per-brand");
  const maxLabelsPerBrandRaw =
    maxLabelsIdx >= 0 && argv[maxLabelsIdx + 1] ? Number(argv[maxLabelsIdx + 1]) : undefined;

  return {
    dryRun,
    maxBrands: Number.isFinite(maxBrands) ? (maxBrands as number) : undefined,
    maxLabelsPerBrand: Number.isFinite(maxLabelsPerBrandRaw)
      ? Math.max(1, Math.floor(maxLabelsPerBrandRaw as number))
      : 2,
  };
}

function coerceLabelObject(labelJson: any): any | null {
  if (!labelJson) return null;
  if (Array.isArray(labelJson)) return labelJson[0] ?? null;
  return labelJson;
}

function canonicalPhoneDigits(raw: string) {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (digits.length < 7) return null;
  if (digits.length > 16) return null;
  return digits;
}

function extractPhoneCandidatesFromText(text: string) {
  const out: string[] = [];
  const s = String(text ?? "");
  const matches = s.match(/(\+?\d[\d\s().-]{6,}\d)/g) ?? [];
  for (const m of matches) {
    const canon = canonicalPhoneDigits(m);
    if (canon) out.push(canon);
  }
  return Array.from(new Set(out));
}

function extractZipCandidatesFromText(text: string) {
  const out: string[] = [];
  const s = String(text ?? "");
  const matches = s.match(/\b\d{5}(?:-\d{4})?\b/g) ?? [];
  for (const m of matches) out.push(m);
  // Non-US postal codes show up in DSLD; keep 6-digit too (e.g. India).
  const matches6 = s.match(/\b\d{6}\b/g) ?? [];
  for (const m of matches6) out.push(m);
  return Array.from(new Set(out));
}

function normalizeForSearch(s: string) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function extractFirstWebsiteLike(text: string): string | null {
  const t = String(text ?? "");
  const http = t.match(/https?:\/\/[^\s"<>]+/i)?.[0];
  if (http) return http;
  const www = t.match(/\bwww\.[^\s"<>]+/i)?.[0];
  if (www) return `https://${www}`;
  const bare = t.match(/\b[a-z0-9-]+\.[a-z]{2,}\b/i)?.[0];
  if (bare) return `https://${bare}`;
  return null;
}

function pickWebsiteFromLabel(label: any): string | null {
  const w =
    label?.website ??
    label?.contact_information?.website ??
    label?.contact_information?.url ??
    label?.contact_information?.web ??
    label?.contactInformation?.website ??
    label?.contactInformation?.url ??
    label?.contactInformation?.web ??
    null;
  if (typeof w === "string" && w.trim()) return w.trim();

  if (Array.isArray(label?.statementGroups)) {
    for (const g of label.statementGroups) {
      const name = String(g?.groupName ?? "").toLowerCase();
      const stmts: string[] = Array.isArray(g?.statements) ? g.statements.map(String) : [];
      const joined = stmts.join("\n");
      if (name.includes("contact") || name.includes("manufacturer") || name.includes("distributor")) {
        const found = extractFirstWebsiteLike(joined);
        if (found) return found;
      }
    }
    const all = label.statementGroups
      .flatMap((g: any) => (Array.isArray(g?.statements) ? g.statements : []))
      .map(String)
      .join("\n");
    const found = extractFirstWebsiteLike(all);
    if (found) return found;
  }

  if (typeof label?.contact_information === "string") {
    const found = extractFirstWebsiteLike(label.contact_information);
    if (found) return found;
  }
  if (typeof label?.contactInformation === "string") {
    const found = extractFirstWebsiteLike(label.contactInformation);
    if (found) return found;
  }

  return null;
}

type ContactSignals = {
  companyNames: string[];
  phones: string[];
  zips: string[];
  addressLines: string[];
  candidateWebsites: string[];
  skuCodes: string[];
};

function roleFromDsldContact(c: any): CompanyRole {
  const type = String(c?.contactType ?? "").toLowerCase();
  const yn = (v: any) => String(v ?? "").toLowerCase() === "yes";
  if (yn(c?.isManufacturer) || type.includes("manufact")) return "MANUFACTURER";
  if (yn(c?.isDistributor) || type.includes("distribut")) return "DISTRIBUTOR";
  if (type.includes("market")) return "MARKETER";
  if (yn(c?.isPackager) || type.includes("packag")) return "PACKAGER";
  if (yn(c?.isReseller) || type.includes("resell")) return "RESELLER";
  if (yn(c?.isOther) || type.includes("other")) return "OTHER";
  return "UNKNOWN";
}

function extractContactSignals(label: any, brandName: string): ContactSignals {
  const companyNames: string[] = [];
  const phones: string[] = [];
  const zips: string[] = [];
  const addressLines: string[] = [];
  const candidateWebsites: string[] = [];
  const skuCodes: string[] = [];

  const pushCompany = (v: any) => {
    const s = normalizeCompanyName(String(v ?? ""));
    if (s && !looksLikeJunkCompanyName(s)) companyNames.push(s);
  };

  pushCompany(brandName);
  if (typeof label?.brand === "string") pushCompany(label.brand);
  if (typeof label?.brandName === "string") pushCompany(label.brandName);
  if (typeof label?.brand_name === "string") pushCompany(label.brand_name);

  const skuRaw = normalizeForSearch(label?.sku ?? "");
  if (skuRaw) {
    const digits = skuRaw.replace(/[^\d]/g, "");
    if (digits.length >= 10 && digits.length <= 14) skuCodes.push(digits);
  }

  if (Array.isArray(label?.contacts)) {
    for (const c of label.contacts) {
      if (c?.name) pushCompany(c.name);

      // webAddress in v8 is sometimes a phone number; sometimes a domain.
      const web = normalizeForSearch(c?.webAddress ?? "");
      const webLike = extractFirstWebsiteLike(web);
      if (webLike) candidateWebsites.push(webLike);
      phones.push(...extractPhoneCandidatesFromText(web));

      if (c?.phoneNumber) phones.push(...extractPhoneCandidatesFromText(String(c.phoneNumber)));
      if (c?.email && typeof c.email === "string") {
        const email = c.email.trim();
        const domain = email.includes("@") ? email.split("@").pop()?.toLowerCase() : null;
        if (domain && domain.includes(".") && !isBlockedDomain(domain)) candidateWebsites.push(`https://${domain}`);
      }

      const addrParts = [
        c?.streetAddress,
        c?.city,
        c?.state,
        c?.zip,
        c?.country,
      ]
        .map((x) => normalizeForSearch(x))
        .filter(Boolean);
      if (addrParts.length) addressLines.push(addrParts.join(", "));
      if (c?.zip) zips.push(...extractZipCandidatesFromText(String(c.zip)));
    }
  }

  if (Array.isArray(label?.statementGroups)) {
    const joined = label.statementGroups
      .flatMap((g: any) => (Array.isArray(g?.statements) ? g.statements : []))
      .map(String)
      .join("\n");
    phones.push(...extractPhoneCandidatesFromText(joined));
    zips.push(...extractZipCandidatesFromText(joined));
    const fromStatements = extractCompanyCandidates(label, brandName);
    companyNames.push(...fromStatements);
  }

  // Dedupe preserving order.
  const dedupe = (xs: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const x of xs) {
      const s = normalizeForSearch(x);
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  };

  return {
    companyNames: dedupe(companyNames).slice(0, 20),
    phones: Array.from(new Set(phones)).slice(0, 8),
    zips: Array.from(new Set(zips)).slice(0, 8),
    addressLines: dedupe(addressLines).slice(0, 6),
    candidateWebsites: Array.from(new Set(candidateWebsites)).slice(0, 12),
    skuCodes: Array.from(new Set(skuCodes)).slice(0, 3),
  };
}

function normalizeCompanyName(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/^["'“”‘’]+/, "")
    .replace(/["'“”‘’]+$/, "")
    .trim();
}

function looksLikeJunkCompanyName(s: string) {
  const t = s.toLowerCase();
  if (t.length < 3) return true;
  if (t.length > 120) return true;
  if (/\bhttps?:\/\//i.test(t) || /\bwww\./i.test(t)) return true;
  if (/\b(all rights reserved|copyright|warning|directions|supplement facts)\b/i.test(t)) return true;
  const digitRatio = (t.match(/\d/g)?.length ?? 0) / Math.max(1, t.length);
  if (digitRatio > 0.2) return true;
  return false;
}

function extractCompanyNamesFromStatements(text: string): string[] {
  const out: string[] = [];
  const lines = String(text ?? "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const patterns: Array<{ re: RegExp; group: number }> = [
    { re: /\bmanufactured\s+(?:for|by)\b[:\-\s]*([^|]{2,120})/i, group: 1 },
    { re: /\bdistributed\s+by\b[:\-\s]*([^|]{2,120})/i, group: 1 },
    { re: /\bmarketed\s+by\b[:\-\s]*([^|]{2,120})/i, group: 1 },
    { re: /\bmade\s+for\b[:\-\s]*([^|]{2,120})/i, group: 1 },
  ];

  for (const line of lines) {
    for (const { re, group } of patterns) {
      const m = line.match(re);
      if (!m?.[group]) continue;
      const raw = String(m[group]);
      const firstChunk = raw.split(/[,;|]/)[0] ?? raw;
      const name = normalizeCompanyName(firstChunk);
      if (!looksLikeJunkCompanyName(name)) out.push(name);
    }
  }
  return out;
}

function extractCompanyCandidates(label: any, brandName: string): string[] {
  const candidates: string[] = [];
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === "string") {
      const s = normalizeCompanyName(v);
      if (!looksLikeJunkCompanyName(s)) candidates.push(s);
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) push(x);
      return;
    }
  };

  push(brandName);
  push(label?.brand_name);
  push(label?.brandName);
  push(label?.manufacturer_name);
  push(label?.manufacturerName);
  push(label?.manufacturer);
  push(label?.distributor_name);
  push(label?.distributorName);
  push(label?.distributor);
  push(label?.contact_information);
  push(label?.contactInformation);

  if (Array.isArray(label?.statementGroups)) {
    for (const g of label.statementGroups) {
      push(g?.groupName);
      if (Array.isArray(g?.statements)) {
        for (const st of g.statements) push(st);
        candidates.push(...extractCompanyNamesFromStatements(g.statements.join("\n")));
      }
    }
  }

  // Dedupe preserving order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const s = normalizeCompanyName(c);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.slice(0, 12);
}

function companyTokens(name: string) {
  const stop = new Set([
    "inc",
    "incorporated",
    "llc",
    "ltd",
    "co",
    "corp",
    "corporation",
    "company",
    "the",
    "and",
    "usa",
    "us",
    "supplements",
    "nutrition",
    "nutritional",
    "labs",
    "lab",
    "foods",
    "food",
    "store",
  ]);
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stop.has(t))
    .slice(0, 4);
}

const BLOCKED_DOMAINS = new Set([
  "amazon.com",
  "ebay.com",
  "walmart.com",
  "target.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "linkedin.com",
  "google.com",
  "maps.google.com",
  "dsld.od.nih.gov",
]);

function isBlockedDomain(domain: string) {
  if (BLOCKED_DOMAINS.has(domain)) return true;
  for (const d of BLOCKED_DOMAINS) {
    if (domain === d) return true;
    if (domain.endsWith(`.${d}`)) return true;
  }
  return false;
}

async function duckDuckGoInstantAnswerUrls(query: string): Promise<string[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1&t=shilajit-transparency-db`;
  const cached = await getCachedJson<any>("websearch", url);
  if (cached) return extractUrlsFromDdg(cached);

  try {
    const json = await fetchJsonWithRetry<any>(url, { retries: 3, timeoutMs: 20000 });
    await setCachedJson("websearch", url, json);
    return extractUrlsFromDdg(json);
  } catch {
    return [];
  }
}

function extractUrlsFromDdg(json: any): string[] {
  const urls: string[] = [];
  const push = (u: any) => {
    if (typeof u !== "string") return;
    const s = u.trim();
    if (!s) return;
    if (!/^https?:\/\//i.test(s)) return;
    urls.push(s);
  };

  push(json?.AbstractURL);
  if (Array.isArray(json?.Results)) {
    for (const r of json.Results) push(r?.FirstURL);
  }

  const walkRelated = (x: any) => {
    if (!x) return;
    if (Array.isArray(x)) {
      for (const v of x) walkRelated(v);
      return;
    }
    if (typeof x === "object") {
      push(x?.FirstURL);
      if (x?.Topics) walkRelated(x.Topics);
    }
  };
  walkRelated(json?.RelatedTopics);

  // Dedupe.
  return Array.from(new Set(urls));
}

const DEFAULT_DSLD_BASE = "https://dsld-dev-api.app.cloud.gov/api/v9";

function dsldBaseUrl() {
  return String(process.env.DSLD_API_BASE_URL ?? DEFAULT_DSLD_BASE).replace(/\/+$/, "");
}

function dsldWithKey(url: string) {
  const apiKey = process.env.DSLD_API_KEY;
  if (!apiKey) return url;
  const u = new URL(url);
  if (!u.searchParams.get("api_key")) u.searchParams.set("api_key", apiKey);
  return u.toString();
}

async function getDsldLabelFast(dsldId: string): Promise<any> {
  const timeoutMs = Math.max(5000, Number(process.env.DSLD_WEBSITE_DISCOVERY_TIMEOUT_MS ?? 15000));
  const url = dsldWithKey(`${dsldBaseUrl()}/label/${encodeURIComponent(dsldId)}`);
  const cached = await getCachedJson<unknown>("dsld", url);
  if (cached) return cached;
  const json = await fetchJsonWithRetry<unknown>(url, { retries: 1, timeoutMs });
  await setCachedJson("dsld", url, json);
  return json;
}

async function isLikelyLiveWebsite(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) return true;
    if (res.status >= 300 && res.status < 400) return true;
    return false;
  } catch {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }
}

function normalizeWebsiteUrl(raw: string): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    if (!u.hostname) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchHtmlCached(url: string, timeoutMs: number) {
  const cached = await getCachedJson<{ html: string }>("webpage", url);
  if (cached?.html) return cached.html;
  const html = await fetchTextWithRetry(url, { retries: 2, timeoutMs });
  await setCachedJson("webpage", url, { html });
  return html;
}

function pageMatchesSignals(args: {
  html: string;
  brandName: string;
  phones: string[];
  zips: string[];
}) {
  const $ = cheerio.load(args.html);
  $("script,style,noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().toLowerCase();
  const footerText = $("footer").text().replace(/\s+/g, " ").trim().toLowerCase();

  const digitsText = bodyText.replace(/[^\d]/g, "");
  const phoneMatch = args.phones.find((p) => p.length >= 7 && digitsText.includes(p)) ?? null;
  const zipMatch = args.zips.find((z) => bodyText.includes(String(z).toLowerCase())) ?? null;
  const brandFooterMatch = footerText.includes(args.brandName.toLowerCase());

  return { phoneMatch, zipMatch, brandFooterMatch };
}

async function verifyOfficialSiteCandidate(args: {
  candidateUrl: string;
  brandName: string;
  phones: string[];
  zips: string[];
  siteRate: DomainRateLimiter;
}) {
  const normalized = normalizeWebsiteUrl(args.candidateUrl);
  if (!normalized) return null;
  const domain = deriveWebsiteDomain(normalized);
  if (!domain) return null;
  if (isBlockedDomain(domain)) return null;

  const rules = await getRobotsRulesForDomain(domain);

  const toTry: string[] = [];
  const u = new URL(normalized);
  toTry.push(u.origin);
  toTry.push(new URL("/contact", u.origin).toString());
  toTry.push(new URL("/contact-us", u.origin).toString());
  toTry.push(new URL("/about", u.origin).toString());
  toTry.push(new URL("/pages/contact", u.origin).toString());
  toTry.push(new URL("/pages/contact-us", u.origin).toString());

  for (const url of toTry) {
    if (!(await isUrlAllowedByRobots(url, rules))) continue;
    await args.siteRate.wait(domain);
    try {
      const html = await fetchHtmlCached(url, 15000);
      const m = pageMatchesSignals({ html, brandName: args.brandName, phones: args.phones, zips: args.zips });
      const ok = Boolean(m.phoneMatch || m.zipMatch || m.brandFooterMatch);
      if (ok) {
        const reasonParts = [
          m.phoneMatch ? `phone:${m.phoneMatch}` : null,
          m.zipMatch ? `zip:${m.zipMatch}` : null,
          m.brandFooterMatch ? "brand-in-footer" : null,
        ].filter(Boolean);
        return { website: u.origin, evidenceUrl: url, reason: reasonParts.join(", ") };
      }
    } catch {
      // 404/403/timeouts are common for guessed contact URLs; treat as "no match".
      continue;
    }
  }
  return null;
}

async function discoverWebsiteForCompany(company: string, brandName: string, rate: DomainRateLimiter) {
  const relaxed = String(process.env.WEBSITE_SEARCH_RELAXED ?? "").toLowerCase() === "true";
  const tokens = companyTokens(company);

  const queries = [
    `${company} official website`,
    `${company} supplements website`,
    `${brandName} official website`,
    `${brandName} supplements website`,
  ];

  for (const q of queries) {
    await rate.wait("api.duckduckgo.com");
    const urls = await duckDuckGoInstantAnswerUrls(q);
    for (const candidate of urls) {
      const domain = deriveWebsiteDomain(candidate);
      if (!domain) continue;
      if (isBlockedDomain(domain)) continue;
      if (!relaxed && tokens.length) {
        const ok = tokens.some((t) => domain.includes(t));
        if (!ok) continue;
      }
      const normalized = normalizeWebsiteUrl(candidate);
      if (!normalized) continue;
      const live = await isLikelyLiveWebsite(normalized);
      if (!live) continue;
      return normalized;
    }
  }

  return null;
}

async function lookupCompanyByUpcOpenFoodFacts(code: string) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
  const cached = await getCachedJson<any>("upc", url);
  if (cached) return cached as any;
  const json = await fetchJsonWithRetry<any>(url, { retries: 2, timeoutMs: 15000 });
  await setCachedJson("upc", url, json);
  return json;
}

async function extractCompanyNamesFromUpc(code: string): Promise<string[]> {
  try {
    const provider = String(process.env.UPC_LOOKUP_PROVIDER ?? "openfoodfacts").toLowerCase();
    if (provider !== "openfoodfacts") return [];
    const res = await lookupCompanyByUpcOpenFoodFacts(code);
    const p = res?.product ?? null;
    const names: string[] = [];
    const push = (v: any) => {
      if (typeof v !== "string") return;
      const s = normalizeCompanyName(v);
      if (s && !looksLikeJunkCompanyName(s)) names.push(s);
    };
    push(p?.brand_owner);
    push(p?.brands);
    push(p?.manufacturer);
    // brands may be comma-separated
    const split = (s: string) => s.split(",").map((x) => normalizeCompanyName(x)).filter(Boolean);
    const expanded: string[] = [];
    for (const n of names) expanded.push(...split(n));
    return Array.from(new Set(expanded)).slice(0, 6);
  } catch {
    return [];
  }
}

function normalizeCompanyKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function upsertCompanyEntity(name: string, website: string | null) {
  const normalizedName = normalizeCompanyKey(name);
  const websiteDomain = website ? deriveWebsiteDomain(website) : null;
  return await prisma.companyEntity.upsert({
    where: { normalizedName },
    update: {
      name,
      website: website ?? undefined,
      websiteDomain: websiteDomain ?? undefined,
    },
    create: {
      name,
      normalizedName,
      website: website ?? null,
      websiteDomain,
    },
    select: { id: true },
  });
}

async function linkBrandCompany(brandId: string, companyId: string, role: CompanyRole, sourceDsldId: string | null) {
  await prisma.brandCompany.upsert({
    where: { brandId_companyId_role: { brandId, companyId, role } },
    update: { sourceDsldId: sourceDsldId ?? undefined },
    create: { brandId, companyId, role, sourceDsldId },
    select: { id: true },
  });
}

async function upsertBrandAlias(brandId: string, alias: string, source: string) {
  const s = normalizeForSearch(alias);
  if (!s) return;
  await prisma.brandAlias.upsert({
    where: { brandId_alias: { brandId, alias: s } },
    update: { source },
    create: { brandId, alias: s, source },
    select: { id: true },
  });
}

async function upsertEvidence(productId: string, url: string, sourceName: string, quote: string, dryRun: boolean) {
  if (dryRun) return false;
  const existing = await prisma.evidence.findFirst({
    where: { productId, url, sourceName },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.evidence.create({
    data: { productId, type: "OTHER", url, sourceName, quote, fetchedAt: new Date() },
    select: { id: true },
  });
  return true;
}

export async function runDiscoverBrandWebsitesFromDsld(opts: Args) {
  const runId = await startRun("DISCOVERY");
  const stats = createEmptyStats();

  const heartbeatIntervalMs = Math.max(
    3000,
    Number(process.env.INGEST_HEARTBEAT_INTERVAL_MS ?? 10_000)
  );
  let lastHeartbeatAt = 0;
  let heartbeatInFlight: Promise<void> | null = null;
  function kickHeartbeat() {
    const now = Date.now();
    if (now - lastHeartbeatAt < heartbeatIntervalMs) return;
    if (heartbeatInFlight) return;
    lastHeartbeatAt = now;
    heartbeatInFlight = heartbeatRun(runId, stats)
      .catch(() => {})
      .finally(() => {
        heartbeatInFlight = null;
      });
  }

  const concurrency = Math.max(1, Number(process.env.WEBSITE_DISCOVERY_CONCURRENCY ?? 2));
  const sem = new Semaphore(concurrency);
  const rate = new DomainRateLimiter(Math.max(200, Number(process.env.WEBSITE_SEARCH_INTERVAL_MS ?? 1200)));
  const siteRate = new DomainRateLimiter(Math.max(200, Number(process.env.WEBSITE_FETCH_INTERVAL_MS ?? 800)));
  const dbSem = new Semaphore(Math.max(1, Number(process.env.WEBSITE_DISCOVERY_DB_CONCURRENCY ?? 1)));

  async function withDb<T>(fn: () => Promise<T>): Promise<T> {
    await dbSem.acquire();
    try {
      return await fn();
    } finally {
      dbSem.release();
    }
  }

  async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
    const attempts = 3;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await withDb(fn);
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : String(e);
        const transient =
          msg.includes("Timed out fetching a new connection") ||
          msg.includes("Server has closed the connection") ||
          msg.includes("Can't reach database server");
        if (!transient || i === attempts - 1) throw e;
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
      }
    }
    // unreachable
    return await withDb(fn);
  }

  try {
    const brands = await withDbRetry(() =>
      prisma.brand.findMany({
      where: {
        websiteDomain: null,
        products: { some: { sourceDsldLabelId: { not: null } } },
      },
      select: {
        id: true,
        name: true,
        products: {
          where: { sourceDsldLabelId: { not: null } },
          select: { id: true, sourceDsldLabelId: true },
          take: opts.maxLabelsPerBrand,
        },
      },
      orderBy: { updatedAt: "asc" },
      take: opts.maxBrands,
      })
    );

    kickHeartbeat();

    const work = brands.map((b) => async () => {
      await sem.acquire();
      try {
        let discovered: { website: string; evidenceUrl: string; reason: string; productId: string; dsldId: string } | null = null;

        // Try to discover from any of the brand's label IDs.
        for (const p of b.products) {
          const dsldId = String(p.sourceDsldLabelId ?? "").trim();
          if (!dsldId) continue;

          const labelRes = await getDsldLabelFast(dsldId);
          stats.productsProcessed += 1;
          const label = coerceLabelObject(labelRes);
          if (!label) continue;

          // Persist alias/company relationships from structured contacts (evidence-driven).
          const signals = extractContactSignals(label, b.name);
          if (!opts.dryRun) {
            if (typeof label?.brand === "string" && label.brand.trim() && label.brand.trim().toLowerCase() !== b.name.toLowerCase()) {
              await withDbRetry(() => upsertBrandAlias(b.id, label.brand, `DSLD:${dsldId}`));
            }
            if (Array.isArray(label?.contacts)) {
              for (const c of label.contacts) {
                const n = normalizeCompanyName(String(c?.name ?? ""));
                if (!n || looksLikeJunkCompanyName(n)) continue;
                const role = roleFromDsldContact(c);
                const company = await withDbRetry(() => upsertCompanyEntity(n, null));
                await withDbRetry(() => linkBrandCompany(b.id, company.id, role, dsldId));
              }
            }
          }

          // Step 1 (best, if present in structured fields): direct domain in label/contact text.
          const inLabel = pickWebsiteFromLabel(label);
          const directCandidates = [inLabel, ...signals.candidateWebsites].filter(Boolean) as string[];
          for (const cand of directCandidates) {
            const v = await verifyOfficialSiteCandidate({
              candidateUrl: cand,
              brandName: b.name,
              phones: signals.phones,
              zips: signals.zips,
              siteRate,
            });
            if (v) {
              discovered = { ...v, productId: p.id, dsldId };
              break;
            }
          }
          if (discovered) break;

          // Step 2: phone/address-based discovery (more precise than brand name).
          const phoneQueries = signals.phones.slice(0, 3).map((ph) => `"${ph}" ${b.name}`);
          const zipQueries = signals.zips.slice(0, 2).map((z) => `"${z}" ${b.name}`);
          const addrQueries = signals.addressLines.slice(0, 1).map((a) => `"${a}" ${b.name}`);
          const step2Queries = [...phoneQueries, ...zipQueries, ...addrQueries];

          for (const q of step2Queries) {
            await rate.wait("api.duckduckgo.com");
            const urls = await duckDuckGoInstantAnswerUrls(q);
            for (const u of urls) {
              const v = await verifyOfficialSiteCandidate({
                candidateUrl: u,
                brandName: b.name,
                phones: signals.phones,
                zips: signals.zips,
                siteRate,
              });
              if (v) {
                discovered = { ...v, productId: p.id, dsldId };
                break;
              }
            }
            if (discovered) break;
          }
          if (discovered) break;

          // Step 3: UPC/GTIN -> company identification -> website discovery (optional provider).
          for (const code of signals.skuCodes) {
            const upcCompanies = await extractCompanyNamesFromUpc(code);
            for (const companyName of upcCompanies) {
              const found = await discoverWebsiteForCompany(companyName, b.name, rate);
              if (!found) continue;
              const v = await verifyOfficialSiteCandidate({
                candidateUrl: found,
                brandName: b.name,
                phones: signals.phones,
                zips: signals.zips,
                siteRate,
              });
              if (v) {
                discovered = { ...v, productId: p.id, dsldId };
                break;
              }
            }
            if (discovered) break;
          }
          if (discovered) break;

          // Step 4 (fallback): brand/company name search, but ONLY accept if verified by phone/zip OR exact brand in footer.
          for (const c of signals.companyNames.slice(0, 6)) {
            const found = await discoverWebsiteForCompany(c, b.name, rate);
            if (!found) continue;
            const v = await verifyOfficialSiteCandidate({
              candidateUrl: found,
              brandName: b.name,
              phones: signals.phones,
              zips: signals.zips,
              siteRate,
            });
            if (v) {
              discovered = { ...v, productId: p.id, dsldId };
              break;
            }
          }
          if (discovered) break;
        }

        if (!discovered) {
          stats.skippedCount += 1;
          return;
        }

        const websiteDomain = deriveWebsiteDomain(discovered.website);
        if (!websiteDomain) {
          stats.skippedCount += 1;
          return;
        }

        if (!opts.dryRun) {
          await withDbRetry(() =>
            prisma.brand.update({
              where: { id: b.id },
              data: { website: discovered.website, websiteDomain },
            })
          );
        }
        const evidenceUrl = discovered.evidenceUrl || `https://dsld.od.nih.gov/label/${encodeURIComponent(discovered.dsldId)}`;
        const evidenceAdded = await withDbRetry(() =>
          upsertEvidence(
            discovered.productId,
            evidenceUrl,
            "Brand Website Resolver",
            `Selected ${discovered.website} (${discovered.reason}).`,
            opts.dryRun
          )
        );
        if (evidenceAdded) stats.evidenceAdded += 1;
      } catch (e: any) {
        stats.errorsCount += 1;
        if ((stats.errorsSample?.length ?? 0) < 25) {
          stats.errorsSample?.push({
            message: e?.message ? String(e.message) : String(e),
            context: `brand=${b.name}`,
          });
        }
      } finally {
        stats.brandsProcessed += 1;
        kickHeartbeat();
        sem.release();
      }
    });

    // Run with bounded concurrency.
    await Promise.all(work.map((fn) => fn()));

    await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  runDiscoverBrandWebsitesFromDsld(args)
    .then(({ runId, stats }) => {
      console.log(`Website discovery complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .finally(async () => prisma.$disconnect());
}

