import * as cheerio from "cheerio";
import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";

export type ExtractedPage = {
  url: string;
  title: string | null;
  textSnippet: string;
  links: string[];
  pdfLinks: string[];
};

function normalizeUrl(href: string, baseUrl: string) {
  const h = href.trim();
  if (!h) return null;
  if (h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("javascript:")) return null;
  try {
    return new URL(h, baseUrl).toString();
  } catch {
    return null;
  }
}

function collapseWs(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export async function extractFromHtml(url: string, html: string): Promise<ExtractedPage> {
  const cacheKey = `${url}#extract-v1`;
  const cached = await getCachedJson<ExtractedPage>("extract", cacheKey);
  if (cached) return cached;

  const $ = cheerio.load(html);
  const title = collapseWs($("title").first().text()) || null;

  // Avoid archiving pages: keep only a snippet of readable text.
  const bodyText = collapseWs($("body").text());
  const textSnippet = bodyText.slice(0, 2000);

  const links = new Set<string>();
  const pdfLinks = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = String($(el).attr("href") ?? "");
    const abs = normalizeUrl(href, url);
    if (!abs) return;
    links.add(abs);
    if (abs.toLowerCase().includes(".pdf")) pdfLinks.add(abs);
  });

  const extracted: ExtractedPage = {
    url,
    title,
    textSnippet,
    links: Array.from(links),
    pdfLinks: Array.from(pdfLinks),
  };
  await setCachedJson("extract", cacheKey, extracted);
  return extracted;
}

export type CoaFinding =
  | { status: "PUBLIC"; coaUrl?: string | null; evidenceQuote?: string | null }
  | { status: "REQUEST_ONLY"; evidenceQuote?: string | null }
  | { status: "UNKNOWN" };

export function findCoa(text: string, pdfLinks: string[]): CoaFinding {
  const t = text.toLowerCase();
  const hasKeyword = /\bcertificate of analysis\b|\bcoa\b/.test(t);
  const requestOnly = /\b(on request|upon request|email us|contact us for|request a coa)\b/.test(t);

  if (hasKeyword) {
    const preferredPdf =
      pdfLinks.find((u) => /\bcoa\b|certificate|analysis/i.test(u)) ?? pdfLinks[0] ?? null;
    if (preferredPdf) {
      return {
        status: "PUBLIC",
        coaUrl: preferredPdf,
        evidenceQuote: "Mentions COA/Certificate of Analysis and links to a PDF.",
      };
    }
    if (requestOnly) {
      return { status: "REQUEST_ONLY", evidenceQuote: "Mentions COA available upon request." };
    }
  }

  if (requestOnly) {
    return { status: "REQUEST_ONLY", evidenceQuote: "Mentions COA available upon request." };
  }

  return { status: "UNKNOWN" };
}

export type ManufacturingFinding =
  | {
      clarity: "CLEAR";
      country: string | null;
      quote: string;
    }
  | {
      clarity: "AMBIGUOUS";
      country: null;
      quote: string;
    }
  | { clarity: "NOT_STATED" };

const madeRegex =
  /\b(?:made in|manufactured in|product of|made and packaged in)\s+([A-Za-z][A-Za-z\s]{1,40})/i;
const ambiguousRegex = /\bmanufactured for\b|\bdistributed by\b|\bpackaged for\b/i;

export function findManufacturing(text: string): ManufacturingFinding {
  const m = text.match(madeRegex);
  if (m && m[0]) {
    const country = m[1] ? m[1].trim().replace(/\s+/g, " ") : null;
    return { clarity: "CLEAR", country, quote: m[0].trim() };
  }

  const a = text.match(ambiguousRegex);
  if (a && a[0]) return { clarity: "AMBIGUOUS", country: null, quote: a[0].trim() };
  return { clarity: "NOT_STATED" };
}

export function scoreUrlForCrawl(url: string) {
  const u = url.toLowerCase();
  let score = 0;
  const keywords = [
    "coa",
    "certificate",
    "analysis",
    "lab",
    "test",
    "testing",
    "quality",
    "transparency",
    "faq",
    "batch",
    "results",
    "manufactur",
    "made-in",
    "made",
    "origin",
  ];
  for (const k of keywords) if (u.includes(k)) score += 3;
  if (u.includes("blog")) score -= 2;
  if (u.includes("cart") || u.includes("checkout") || u.includes("account")) score -= 5;
  if (u.includes(".pdf")) score += 4;
  return score;
}

