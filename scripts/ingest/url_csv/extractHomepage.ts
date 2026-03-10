import * as cheerio from "cheerio";
import { extractDomain } from "@/lib/urlCanonicalize";
import type { FetchedPage } from "./types";
import type { HomepageExtract } from "./types";

function collapse(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Extract brand/domain identity from a homepage.
 * No canonical product creation; optionally queue sitemap/site-search discovery.
 */
export function extractHomepage(page: FetchedPage): HomepageExtract {
  const $ = cheerio.load(page.html);
  const domain = extractDomain(page.finalUrl);

  // Brand name: og:site_name, og:title, or first h1
  let brandName: string | null =
    page.metaTags["og:site_name"] ??
    page.metaTags["og:title"] ??
    null;
  if (!brandName) {
    brandName = collapse($("h1").first().text()) || null;
  }
  if (brandName) {
    // Strip common suffixes
    brandName = brandName
      .replace(/\s*[-–|]\s*(home|official site|website|store)$/i, "")
      .trim();
  }

  const websiteUrl = page.finalUrl;

  const notes: string[] = [];
  notes.push("homepage - brand/domain identity only");
  if (!brandName) notes.push("brand name not found");

  return {
    brandName,
    domain,
    websiteUrl,
    notes: notes.join("; "),
  };
}
