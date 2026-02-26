import "dotenv/config";

import * as cheerio from "cheerio";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import { createDiscoveryLimiters } from "./rateLimit";
import { isAllowedByRobots } from "./robots";
import { resolveListingToProduct } from "./listingResolver";
import type { ListingInput } from "./types";

type DiscoverIHerbOptions = {
  dryRun: boolean;
  maxPagesPerQuery?: number;
};

function unique<T>(xs: T[]) {
  return Array.from(new Set(xs));
}

function absoluteIHerbUrl(href: string) {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://www.iherb.com${href}`;
  return null;
}

function extractSearchResults(html: string) {
  const $ = cheerio.load(html);
  const urls: string[] = [];

  // iHerb product links commonly contain "/pr/".
  $("a[href]").each((_, el) => {
    const href = String($(el).attr("href") ?? "");
    if (!href) return;
    if (!href.includes("/pr/")) return;
    const u = absoluteIHerbUrl(href);
    if (u) urls.push(u.split("?")[0] as string);
  });

  return unique(urls);
}

async function discoverQuery(query: string, opts: DiscoverIHerbOptions) {
  const maxPages = Math.max(1, Math.min(3, opts.maxPagesPerQuery ?? 3));
  const { perDomain, global } = createDiscoveryLimiters();
  const domain = "www.iherb.com";

  const discovered: ListingInput[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://www.iherb.com/search?kw=${encodeURIComponent(query)}&p=${page}`;

    const robots = await isAllowedByRobots(url);
    if (!robots.allowed) break;

    await global.acquire();
    try {
      await perDomain.wait(domain);
      const html = await fetchTextWithRetry(url, { retries: 2, timeoutMs: 20000 });
      const urls = extractSearchResults(html);
      for (const u of urls) {
        discovered.push({
          url: u,
          source: "IHERB",
          title: null,
          brandName: null,
          observedGtin: null,
          observedSku: null,
          netQuantityText: null,
          form: null,
          imageUrls: null,
        });
      }
      if (!urls.length) break;
    } finally {
      global.release();
    }
  }

  return discovered;
}

export async function discoverIHerb(opts: DiscoverIHerbOptions) {
  const queries = ["shilajit", "shilajit resin", "shilajit capsules"];
  const listingInputs = unique((await Promise.all(queries.map((q) => discoverQuery(q, opts)))).flat());

  if (opts.dryRun) {
    return { discovered: listingInputs.length, ingested: 0 };
  }

  let ingested = 0;
  for (const li of listingInputs) {
    await resolveListingToProduct(li);
    ingested += 1;
  }

  return { discovered: listingInputs.length, ingested };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  discoverIHerb({ dryRun })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

