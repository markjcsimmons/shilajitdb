import * as cheerio from "cheerio";
import { extractDomain } from "@/lib/urlCanonicalize";
import { DomainRateLimiter, Semaphore } from "@/scripts/ingest/web/rateLimit";
import type { FetchedPage } from "./types";

const TIMEOUT_MS = 30000;
const RETRIES = 2;
const PER_DOMAIN_MS = 2000;

const domainLimiter = new DomainRateLimiter(PER_DOMAIN_MS);
const globalSemaphore = new Semaphore(3);

function collapseWs(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function parseMetaTags($: cheerio.CheerioAPI): Record<string, string> {
  const meta: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name = $(el).attr("name") ?? $(el).attr("property");
    const content = $(el).attr("content");
    if (name && content) meta[name] = content;
  });
  return meta;
}

async function fetchWithFetch(url: string): Promise<FetchedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  clearTimeout(timeout);

  const html = await res.text();
  const $ = cheerio.load(html);
  const title = collapseWs($("title").first().text()) || null;
  const bodyText = collapseWs($("body").text());
  const textSnippet = bodyText.slice(0, 5000);
  const metaTags = parseMetaTags($);

  return {
    html,
    finalUrl: res.url,
    title,
    metaTags,
    textSnippet,
    status: res.status,
  };
}

async function fetchWithPlaywright(url: string): Promise<FetchedPage> {
  let playwright: typeof import("playwright");
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error("Playwright not installed. Run: npm install playwright && npx playwright install chromium");
  }
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });
    const html = await page.content();
    const finalUrl = page.url();
    await browser.close();

    const $ = cheerio.load(html);
    const title = collapseWs($("title").first().text()) || null;
    const bodyText = collapseWs($("body").text());
    const textSnippet = bodyText.slice(0, 5000);
    const metaTags = parseMetaTags($);

    return {
      html,
      finalUrl,
      title,
      metaTags,
      textSnippet,
      status: 200,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Fetch a page with rate limiting, retries, and optional Playwright.
 * Uses fetch+cheerio by default; set usePlaywright=true for JS-rendered pages.
 */
export async function fetchPage(
  url: string,
  options?: { usePlaywright?: boolean }
): Promise<FetchedPage> {
  const domain = extractDomain(url);
  await domainLimiter.wait(domain);
  await globalSemaphore.acquire();

  try {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        if (options?.usePlaywright) {
          return await fetchWithPlaywright(url);
        }
        return await fetchWithFetch(url);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError ?? new Error("Fetch failed");
  } finally {
    globalSemaphore.release();
  }
}
