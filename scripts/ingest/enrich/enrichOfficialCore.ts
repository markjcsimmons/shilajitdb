import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import { DomainRateLimiter } from "@/scripts/ingest/web/rateLimit";
import { getRobotsRulesForDomain, isUrlAllowedByRobots } from "@/scripts/ingest/web/robots";
import { fetchSitemapUrls } from "@/scripts/ingest/discovery/sitemaps/fetchSitemap";
import { isLikelyProductUrl } from "@/scripts/ingest/discovery/sitemaps/classifyUrl";
import type { EnrichOfficialStats } from "@/scripts/jobs/jobTypes";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const out: string[] = [];
  $("a[href]").each((_, el) => {
    const href = String($(el).attr("href") ?? "");
    if (!href) return;
    try {
      const u = new URL(href, baseUrl);
      out.push(u.toString());
    } catch {
      // ignore
    }
  });
  return Array.from(new Set(out));
}

function pickCoaLinks(urls: string[]): string[] {
  const out: string[] = [];
  for (const u of urls) {
    const s = u.toLowerCase();
    if (s.includes("coa") || s.includes("certificate-of-analysis") || s.includes("certificate_of_analysis")) {
      out.push(u);
      continue;
    }
    if (s.endsWith(".pdf") && (s.includes("coa") || s.includes("analysis") || s.includes("lab"))) {
      out.push(u);
    }
  }
  return Array.from(new Set(out));
}

function detectRequestOnly(html: string): boolean {
  const t = html.toLowerCase();
  return (
    t.includes("available upon request") ||
    t.includes("coa upon request") ||
    t.includes("certificate of analysis upon request")
  );
}

function detectManufacturingClaim(html: string): string | null {
  const text = html.replace(/\s+/g, " ");
  const m = text.match(/\b(made in|manufactured in|packaged in|sourced from)\b[^.]{0,80}/i);
  return m ? m[0].trim() : null;
}

async function upsertEvidence(
  productId: string,
  type: "COA" | "MANUFACTURING" | "INGREDIENTS",
  url: string,
  quote: string,
): Promise<boolean> {
  const existing = await prisma.evidence.findFirst({
    where: { productId, type, url, sourceName: "Official Enrichment" },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.evidence.create({
    data: { productId, type, url, sourceName: "Official Enrichment", quote, fetchedAt: new Date() },
    select: { id: true },
  });
  return true;
}

/**
 * Return true if a URL looks like a product detail page (not a bare homepage).
 * Bare homepage: pathname is "/" or "" or has no meaningful segments.
 */
function isProductPageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/+$/, "");
    if (!p || p === "") return false; // bare homepage
    return isLikelyProductUrl(url);
  } catch {
    return false;
  }
}

/**
 * Given a homepage URL, try to find product-page links by:
 *   1. Checking the sitemap first (fast, clean).
 *   2. Scanning homepage HTML for /products/ links (max 20 links).
 *
 * Returns up to `maxLinks` product URLs found, or [] if none.
 */
async function findProductLinksFromHomepage(
  homepageUrl: string,
  rate: DomainRateLimiter,
  maxLinks = 20,
): Promise<string[]> {
  try {
    const domain = new URL(homepageUrl).hostname;

    // Try sitemap first.
    const sitemapUrls = await fetchSitemapUrls(domain);
    const fromSitemap = sitemapUrls.filter(isLikelyProductUrl).slice(0, maxLinks);
    if (fromSitemap.length > 0) return fromSitemap;

    // Fall back to scanning homepage HTML.
    await rate.wait(domain);
    const html = await fetchTextWithRetry(homepageUrl, { retries: 1, timeoutMs: 15000 });
    const links = extractLinks(html, homepageUrl);
    return links.filter(isLikelyProductUrl).slice(0, maxLinks);
  } catch {
    return [];
  }
}

// ─── Options & core function ──────────────────────────────────────────────────

export type EnrichOfficialOptions = {
  maxProducts?: number;
  maxPagesPerDomain?: number;
  dryRun?: boolean;
};

/**
 * Enrich products that have at least one OFFICIAL listing.
 *
 * Selection priority (within maxProducts cap):
 *   1. Evidence count == 0 OR dataCompleteness == LOW — most valuable to fix first.
 *   2. lastVerifiedAt IS NULL — never enriched.
 *   3. lastVerifiedAt oldest first.
 *
 * Per-product strategy:
 *   a. If the OFFICIAL listing is a product-detail URL → enrich directly.
 *   b. If it's a bare homepage → attempt to find product URLs via sitemap or
 *      homepage scan, then attach them as OFFICIAL listings before enrichment.
 *   c. Skip if no product URL can be found after the homepage scan.
 */
export async function enrichOfficialCore(opts: EnrichOfficialOptions = {}): Promise<EnrichOfficialStats> {
  const max = Math.max(1, opts.maxProducts ?? 50);
  const dryRun = opts.dryRun ?? false;

  // ── Priority query ──────────────────────────────────────────────────────────
  // Prisma doesn't support NULLS FIRST ordering natively; we fetch a larger
  // pool and sort in JS to put null lastVerifiedAt at the top.
  const pool = await prisma.product.findMany({
    where: { listings: { some: { source: "OFFICIAL" } } },
    orderBy: [
      { dataCompleteness: "asc" }, // LOW comes before MEDIUM and HIGH alphabetically
      { lastVerifiedAt: "asc" },   // oldest first (nulls come first in Postgres asc)
    ],
    take: max * 3, // Overfetch because some will be skipped.
    select: {
      id: true,
      form: true,
      ingredientText: true,
      ingredientsNormalized: true,
      manufacturingCountryClaim: true,
      coaStatus: true,
      dataCompleteness: true,
      lastVerifiedAt: true,
      listings: {
        where: { source: "OFFICIAL" },
        orderBy: { updatedAt: "desc" },
        take: 5, // grab a few in case the first is a homepage
        select: { id: true, url: true },
      },
      evidence: { select: { id: true, type: true } },
    },
  });

  // Sort: null lastVerifiedAt first, then oldest, then evidence count ascending.
  const sorted = pool.sort((a, b) => {
    const aNull = a.lastVerifiedAt === null ? 0 : 1;
    const bNull = b.lastVerifiedAt === null ? 0 : 1;
    if (aNull !== bNull) return aNull - bNull;
    const aTime = a.lastVerifiedAt?.getTime() ?? 0;
    const bTime = b.lastVerifiedAt?.getTime() ?? 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.evidence.length - b.evidence.length;
  });

  const products = sorted.slice(0, max);

  const rate = new DomainRateLimiter(1000);
  let productsSelected = products.length;
  let productsProcessed = 0;
  let skippedNoProductUrl = 0;
  let evidenceAdded = 0;
  let coaPublicFound = 0;
  let manufacturingClearFound = 0;
  let errorsCount = 0;

  for (const p of products) {
    // ── Determine which URL to enrich ────────────────────────────────────────
    let officialUrl: string | undefined;

    // Prefer a listing that is already a product-detail page.
    for (const listing of p.listings) {
      if (isProductPageUrl(listing.url)) {
        officialUrl = listing.url;
        break;
      }
    }

    // If none is a product page, the first OFFICIAL listing is treated as a homepage.
    if (!officialUrl) {
      const homepageUrl = p.listings[0]?.url;
      if (!homepageUrl) {
        skippedNoProductUrl += 1;
        continue;
      }

      // Try to discover product URLs from the homepage.
      if (!dryRun) {
        const productLinks = await findProductLinksFromHomepage(homepageUrl, rate);
        if (productLinks.length > 0) {
          // Attach discovered product URLs as OFFICIAL listings.
          for (const link of productLinks.slice(0, 5)) {
            const existing = await prisma.listing.findUnique({
              where: { url: link },
              select: { id: true },
            });
            if (!existing) {
              await prisma.listing.create({
                data: {
                  productId: p.id,
                  source: "OFFICIAL",
                  url: link,
                  status: "UNKNOWN",
                  lastSeenAt: new Date(),
                },
                select: { id: true },
              });
            }
          }
          officialUrl = productLinks[0];
        } else {
          skippedNoProductUrl += 1;
          continue;
        }
      } else {
        // In dry-run mode, report as skipped.
        skippedNoProductUrl += 1;
        continue;
      }
    }

    productsProcessed += 1;

    try {
      const domain = new URL(officialUrl).hostname;
      const rules = await getRobotsRulesForDomain(domain);
      if (!(await isUrlAllowedByRobots(officialUrl, rules))) continue;

      await rate.wait(domain);
      const html = await fetchTextWithRetry(officialUrl, { retries: 2, timeoutMs: 25000 });

      const links = extractLinks(html, officialUrl);
      const coaLinks = pickCoaLinks(links);
      const requestOnly = detectRequestOnly(html);
      const manufacturingClaim = detectManufacturingClaim(html);

      if (!dryRun) {
        for (const u of coaLinks.slice(0, 5)) {
          const ok = await upsertEvidence(p.id, "COA", u, "COA link found on official product page.");
          if (ok) evidenceAdded += 1;
        }
        if (manufacturingClaim) {
          const ok = await upsertEvidence(p.id, "MANUFACTURING", officialUrl, manufacturingClaim);
          if (ok) evidenceAdded += 1;
        }
      }

      if (coaLinks.length) coaPublicFound += 1;
      if (manufacturingClaim) manufacturingClearFound += 1;

      if (!dryRun) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            coaStatus: coaLinks.length ? "PUBLIC" : requestOnly ? "REQUEST_ONLY" : p.coaStatus,
            coaUrl: coaLinks[0] ?? undefined,
            manufacturingClaimText: manufacturingClaim ?? undefined,
            lastVerifiedAt: new Date(),
          },
          select: { id: true },
        });

        const updated = await prisma.product.findUnique({
          where: { id: p.id },
          include: {
            evidence: { select: { id: true, type: true, sourceName: true } },
            brand: { select: { name: true, slug: true } },
          },
        });
        if (updated) {
          const t = computeTransparencyGrade(
            {
              form: updated.form,
              ingredientText: updated.ingredientText,
              ingredientsNormalized: updated.ingredientsNormalized,
              manufacturingCountryClaim: updated.manufacturingCountryClaim,
              coaStatus: updated.coaStatus,
            },
            { count: updated.evidence.length },
          );
          const q = computeQualityTier(
            {
              form: updated.form,
              ingredientText: updated.ingredientText,
              ingredientsNormalized: updated.ingredientsNormalized,
              manufacturingCountryClaim: updated.manufacturingCountryClaim,
              coaStatus: updated.coaStatus,
              hasOfficialLabels: updated.evidence.length >= 2 || !!updated.sourceDsldLabelId,
              evidenceCount: updated.evidence.length,
            },
            t,
          );
          const hasMeaningfulEvidence = updated.evidence.some(
            (e) =>
              ["COA", "MANUFACTURING", "INGREDIENTS", "TESTING"].includes(e.type) &&
              !/sitemap|ocr|discovery|meta|harvest/i.test(e.sourceName ?? "")
          );
          const brandResolved =
            updated.brand.name !== "Unknown Brand" &&
            !updated.brand.slug.startsWith("domain-");
          const shouldPromoteCanonical = hasMeaningfulEvidence && brandResolved;

          await prisma.product.update({
            where: { id: updated.id },
            data: {
              transparencyGrade: t.grade,
              qualityTier: q.tier,
              ...(shouldPromoteCanonical ? { isCanonical: true } : {}),
            },
            select: { id: true },
          });
        }
      }
    } catch {
      errorsCount += 1;
    }
  }

  return {
    productsSelected,
    productsProcessed,
    skippedNoProductUrl,
    evidenceAdded,
    coaPublicFound,
    manufacturingClearFound,
    errorsCount,
  };
}
