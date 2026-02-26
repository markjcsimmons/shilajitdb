import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import { DomainRateLimiter } from "@/scripts/ingest/web/rateLimit";
import { getRobotsRulesForDomain, isUrlAllowedByRobots } from "@/scripts/ingest/web/robots";
import type { EnrichOfficialStats } from "@/scripts/jobs/jobTypes";

function extractLinks(html: string, baseUrl: string) {
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

function pickCoaLinks(urls: string[]) {
  const out: string[] = [];
  for (const u of urls) {
    const s = u.toLowerCase();
    if (s.includes("coa") || s.includes("certificate-of-analysis") || s.includes("certificate_of_analysis")) {
      out.push(u);
      continue;
    }
    if (s.endsWith(".pdf") && (s.includes("coa") || s.includes("analysis") || s.includes("lab"))) out.push(u);
  }
  return Array.from(new Set(out));
}

function detectRequestOnly(html: string) {
  const t = html.toLowerCase();
  if (t.includes("available upon request")) return true;
  if (t.includes("coa upon request")) return true;
  if (t.includes("certificate of analysis upon request")) return true;
  return false;
}

function detectManufacturingClaim(html: string) {
  const text = html.replace(/\s+/g, " ");
  const m = text.match(/\b(made in|manufactured in|packaged in|sourced from)\b[^.]{0,80}/i);
  return m ? m[0].trim() : null;
}

async function upsertEvidence(
  productId: string,
  type: "COA" | "MANUFACTURING" | "INGREDIENTS",
  url: string,
  quote: string
) {
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

export type EnrichOfficialOptions = {
  maxProducts?: number;
  maxPagesPerDomain?: number;
  dryRun?: boolean;
};

/**
 * Core enrichment: products with OFFICIAL listing, prioritize LOW/MEDIUM, missing evidence, oldest lastVerifiedAt.
 * Respects robots.txt and rate limiting. Returns stats for job runner.
 */
export async function enrichOfficialCore(opts: EnrichOfficialOptions = {}): Promise<EnrichOfficialStats> {
  const max = Math.max(1, opts.maxProducts ?? 50);
  const dryRun = opts.dryRun ?? false;

  const products = await prisma.product.findMany({
    where: { listings: { some: { source: "OFFICIAL" } } },
    orderBy: [
      { dataCompleteness: "asc" },
      { lastVerifiedAt: "asc" },
    ],
    take: max,
    select: {
      id: true,
      form: true,
      ingredientText: true,
      ingredientsNormalized: true,
      manufacturingClarity: true,
      coaStatus: true,
      dataCompleteness: true,
      listings: {
        where: { source: "OFFICIAL" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { url: true },
      },
      evidence: { select: { id: true, type: true } },
    },
  });

  const rate = new DomainRateLimiter(1000);
  let productsProcessed = 0;
  let evidenceAdded = 0;
  let coaPublicFound = 0;
  let manufacturingClearFound = 0;
  let errorsCount = 0;

  for (const p of products) {
    const officialUrl = p.listings[0]?.url;
    if (!officialUrl) continue;
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
            manufacturingClarity: manufacturingClaim ? "CLEAR" : p.manufacturingClarity,
            lastVerifiedAt: new Date(),
          },
          select: { id: true },
        });

        const updated = await prisma.product.findUnique({
          where: { id: p.id },
          include: { evidence: { select: { id: true } } },
        });
        if (updated) {
          const t = computeTransparencyGrade(
            {
              form: updated.form,
              ingredientText: updated.ingredientText,
              ingredientsNormalized: updated.ingredientsNormalized,
              manufacturingClarity: updated.manufacturingClarity,
              coaStatus: updated.coaStatus,
            },
            { count: updated.evidence.length }
          );
          const q = computeQualityTier(
            {
              form: updated.form,
              ingredientText: updated.ingredientText,
              ingredientsNormalized: updated.ingredientsNormalized,
              manufacturingClarity: updated.manufacturingClarity,
              coaStatus: updated.coaStatus,
            },
            t
          );
          await prisma.product.update({
            where: { id: updated.id },
            data: { transparencyGrade: t.grade, qualityTier: q.tier },
            select: { id: true },
          });
        }
      }
    } catch {
      errorsCount += 1;
    }
  }

  return {
    productsProcessed,
    evidenceAdded,
    coaPublicFound,
    manufacturingClearFound,
    errorsCount,
  };
}
