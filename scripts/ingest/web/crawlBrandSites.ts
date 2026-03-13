import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { deriveWebsiteDomain } from "@/lib/url";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";
import {
  createEmptyStats,
  finishRun,
  startRun,
  type IngestionStats,
} from "@/scripts/ingest/shared/observability";
import { extractFromHtml, findCoa, findManufacturing, scoreUrlForCrawl } from "@/scripts/ingest/web/extract";
import { getRobotsRulesForDomain, isUrlAllowedByRobots } from "@/scripts/ingest/web/robots";
import { DomainRateLimiter, Semaphore } from "@/scripts/ingest/web/rateLimit";
import type { CoaStatus, Product } from "@prisma/client";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const maxBrandsIdx = argv.findIndex((a) => a === "--max-brands");
  const maxBrands =
    maxBrandsIdx >= 0 && argv[maxBrandsIdx + 1] ? Number(argv[maxBrandsIdx + 1]) : undefined;
  return { dryRun, maxBrands: Number.isFinite(maxBrands) ? (maxBrands as number) : undefined };
}

function shouldUpdateCoa(current: CoaStatus, next: CoaStatus) {
  const rank: Record<CoaStatus, number> = { UNKNOWN: 0, NONE: 0, REQUEST_ONLY: 1, PUBLIC: 2 };
  return rank[next] > rank[current];
}

async function upsertEvidenceIfMissing(params: {
  productId: string;
  type: "COA" | "MANUFACTURING";
  url: string;
  quote?: string | null;
  sourceName: string;
  fetchedAt: Date;
  dryRun: boolean;
  stats: IngestionStats;
}) {
  const { productId, type, url, sourceName, quote, fetchedAt, dryRun, stats } = params;
  if (dryRun) return;
  const existing = await prisma.evidence.findFirst({
    where: { productId, type, url, sourceName },
    select: { id: true },
  });
  if (existing) return;
  await prisma.evidence.create({
    data: {
      productId,
      type,
      url,
      quote: quote ?? null,
      sourceName,
      fetchedAt,
    },
  });
  stats.evidenceAdded += 1;
}

async function recomputeAndPersist(productId: string, dryRun: boolean) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      evidence: { select: { id: true } },
      brand: { select: { slug: true } },
    },
  });
  if (!p) return;
  const t = computeTransparencyGrade(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus,
    },
    { count: p.evidence.length }
  );
  const q = computeQualityTier(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus,
      brandSlug: p.brand.slug,
      hasOfficialLabels: p.evidence.length >= 2 || !!p.sourceDsldLabelId,
    },
    t
  );
  if (dryRun) return;
  await prisma.product.update({
    where: { id: p.id },
    data: { transparencyGrade: t.grade, qualityTier: q.tier },
  });
}

function computeCompleteness(p: Product, evidenceCount: number, coaStatus: CoaStatus, hasMfgCountry: boolean) {
  const hasCoa = coaStatus !== "UNKNOWN";
  const hasIngredients = p.ingredientsNormalized.length > 0;
  const hasEvidence = evidenceCount >= 2;
  if (hasCoa && hasMfgCountry && hasIngredients && hasEvidence) return "HIGH" as const;
  return p.dataCompleteness === "LOW" ? ("LOW" as const) : ("MEDIUM" as const);
}

export async function runBrandCrawl(opts: { dryRun: boolean; maxBrands?: number }) {
  const runId = await startRun("BRAND_CRAWL");
  const stats = createEmptyStats();
  const fetchedAt = new Date();

  const semaphore = new Semaphore(4);
  const perDomain = new DomainRateLimiter(1000);

  try {
    const brands = await prisma.brand.findMany({
      where: {
        OR: [{ websiteDomain: { not: null } }, { website: { not: null } }],
      },
      orderBy: { updatedAt: "desc" },
      take: opts.maxBrands ?? 5000,
      select: { id: true, name: true, website: true, websiteDomain: true },
    });

    const work = brands.map((b) => async () => {
      const domain = b.websiteDomain ?? deriveWebsiteDomain(b.website);
      if (!domain) {
        stats.skippedCount += 1;
        return;
      }
      if (!opts.dryRun && !b.websiteDomain) {
        await prisma.brand.update({
          where: { id: b.id },
          data: { websiteDomain: domain },
        });
      }

      const robots = await getRobotsRulesForDomain(domain);
      const base = b.website?.startsWith("http") ? b.website : `https://${domain}`;

      const highSignalPaths = [
        "/coa",
        "/certificate-of-analysis",
        "/lab-results",
        "/testing",
        "/quality",
        "/transparency",
        "/faq",
      ];

      const queue: string[] = [];
      const visited = new Set<string>();

      for (const p of highSignalPaths) queue.push(new URL(p, base).toString());
      queue.push(new URL("/", base).toString());

      let coaFinding: { status: CoaStatus; coaUrl?: string | null; quote?: string | null; evidenceUrl?: string | null } | null = null;
      let mfgFinding: { clarity: "CLEAR" | "AMBIGUOUS" | "NOT_STATED"; country: string | null; quote?: string; evidenceUrl?: string | null } | null = null;

      const maxPages = 50;
      while (queue.length && visited.size < maxPages) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);

        if (!(await isUrlAllowedByRobots(url, robots))) {
          continue;
        }

        const u = new URL(url);
        if (u.hostname.toLowerCase() !== domain.toLowerCase() && !u.hostname.toLowerCase().endsWith(`.${domain.toLowerCase()}`)) {
          continue;
        }

        await perDomain.wait(domain);
        let html: string;
        try {
          html = await fetchTextWithRetry(url, { retries: 2, timeoutMs: 20000 });
        } catch {
          continue;
        }

        const extracted = await extractFromHtml(url, html);
        const text = extracted.textSnippet;

        if (!coaFinding || coaFinding.status !== "PUBLIC") {
          const coa = findCoa(text, extracted.pdfLinks);
          if (coa.status === "PUBLIC") {
            coaFinding = { status: "PUBLIC", coaUrl: coa.coaUrl ?? null, quote: coa.evidenceQuote ?? null, evidenceUrl: url };
          } else if (coa.status === "REQUEST_ONLY" && (!coaFinding || coaFinding.status === "UNKNOWN")) {
            coaFinding = { status: "REQUEST_ONLY", coaUrl: null, quote: coa.evidenceQuote ?? null, evidenceUrl: url };
          }
        }

        if (!mfgFinding || mfgFinding.clarity !== "CLEAR") {
          const m = findManufacturing(text);
          if (m.clarity === "CLEAR") {
            mfgFinding = { clarity: "CLEAR", country: m.country ?? null, quote: m.quote, evidenceUrl: url };
          } else if (m.clarity === "AMBIGUOUS" && (!mfgFinding || mfgFinding.clarity === "NOT_STATED")) {
            mfgFinding = { clarity: "AMBIGUOUS", country: null, quote: m.quote, evidenceUrl: url };
          }
        }

        const candidates = extracted.links
          .filter((l) => l.startsWith("http"))
          .filter((l) => {
            try {
              const lu = new URL(l);
              return lu.hostname.toLowerCase() === domain.toLowerCase() || lu.hostname.toLowerCase().endsWith(`.${domain.toLowerCase()}`);
            } catch {
              return false;
            }
          })
          .filter((l) => !visited.has(l));

        candidates.sort((a, b) => scoreUrlForCrawl(b) - scoreUrlForCrawl(a));
        for (const c of candidates.slice(0, 15)) queue.push(c);

        if (coaFinding?.status === "PUBLIC" && mfgFinding?.clarity === "CLEAR") break;
      }

      const products = await prisma.product.findMany({
        where: { brand: { id: b.id } },
        include: { evidence: { select: { id: true } } },
      });

      stats.brandsProcessed += 1;

      for (const p of products) {
        const nextCoaStatus: CoaStatus = coaFinding?.status ?? "UNKNOWN";
        const nextCoaUrl = coaFinding?.coaUrl ?? null;
        const nextCountry =
          mfgFinding?.clarity === "CLEAR" && mfgFinding?.country?.trim()
            ? mfgFinding.country.trim()
            : null;
        const updatedCountry = nextCountry ?? p.manufacturingCountryClaim ?? null;

        const newCoaStatus = shouldUpdateCoa(p.coaStatus, nextCoaStatus) ? nextCoaStatus : p.coaStatus;
        const newCoaUrl = newCoaStatus === "PUBLIC" ? (nextCoaUrl ?? p.coaUrl ?? null) : p.coaUrl ?? null;

        const nextEvidenceCount = p.evidence.length
          + (coaFinding ? 1 : 0)
          + (mfgFinding ? 1 : 0);

        const hasMfgCountry = !!(updatedCountry?.trim());
        const dataCompleteness = computeCompleteness(p, nextEvidenceCount, newCoaStatus, hasMfgCountry);

        if (!opts.dryRun) {
          await prisma.product.update({
            where: { id: p.id },
            data: {
              coaStatus: newCoaStatus,
              coaUrl: newCoaUrl,
              manufacturingCountryClaim: updatedCountry || null,
              manufacturingClaimText:
                mfgFinding && mfgFinding.clarity !== "NOT_STATED"
                  ? (mfgFinding.quote ?? p.manufacturingClaimText ?? null)
                  : p.manufacturingClaimText,
              manufacturingEvidenceUrl:
                mfgFinding && mfgFinding.clarity !== "NOT_STATED"
                  ? (mfgFinding.evidenceUrl ?? p.manufacturingEvidenceUrl ?? null)
                  : p.manufacturingEvidenceUrl,
              dataCompleteness,
              lastVerifiedAt: new Date(),
            },
          });
        }

        if (coaFinding && coaFinding.evidenceUrl) {
          if (coaFinding.status === "PUBLIC") stats.coaPublicCount += 1;
          if (coaFinding.status === "REQUEST_ONLY") stats.coaRequestCount += 1;
          await upsertEvidenceIfMissing({
            productId: p.id,
            type: "COA",
            url: coaFinding.coaUrl ?? coaFinding.evidenceUrl,
            quote: coaFinding.quote ?? null,
            sourceName: "Brand Site",
            fetchedAt,
            dryRun: opts.dryRun,
            stats,
          });
        }

        if (mfgFinding && mfgFinding.evidenceUrl && mfgFinding.clarity !== "NOT_STATED") {
          if (mfgFinding.clarity === "CLEAR") stats.manufacturingClearCount += 1;
          await upsertEvidenceIfMissing({
            productId: p.id,
            type: "MANUFACTURING",
            url: mfgFinding.evidenceUrl,
            quote: mfgFinding.quote ?? null,
            sourceName: "Brand Site",
            fetchedAt,
            dryRun: opts.dryRun,
            stats,
          });
        }

        stats.productsProcessed += 1;
        await recomputeAndPersist(p.id, opts.dryRun);
      }
    });

    await Promise.all(
      work.map(async (job) => {
        await semaphore.acquire();
        try {
          await job();
        } catch (e: any) {
          stats.errorsCount += 1;
          if ((stats.errorsSample?.length ?? 0) < 25) {
            stats.errorsSample?.push({ message: e?.message ? String(e.message) : String(e) });
          }
        } finally {
          semaphore.release();
        }
      })
    );

    await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dryRun, maxBrands } = parseArgs(process.argv.slice(2));
  runBrandCrawl({ dryRun, maxBrands })
    .then(({ runId, stats }) => {
      console.log(`Brand crawl complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .finally(async () => prisma.$disconnect());
}

