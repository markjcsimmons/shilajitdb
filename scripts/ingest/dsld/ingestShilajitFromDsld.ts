import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { DsldClient } from "@/scripts/ingest/dsld/dsldClient";
import {
  deriveBrandWebsiteDomain,
  deriveManufacturingFromLabelText,
  inferFormFromText,
  normalizeBrandName,
  parseIngredientsFromLabelText,
  stableProductSlug,
} from "@/scripts/ingest/dsld/mapDsld";
import {
  createEmptyStats,
  finishRun,
  startRun,
  type IngestionStats,
} from "@/scripts/ingest/shared/observability";
import { upsertBrandSafe } from "@/scripts/ingest/shared/brand";

// Terms used to CONFIRM a label is actually about shilajit.
const MATCH_TERMS = ["shilajit", "shilajeet", "mumijo", "mumie", "asphaltum", "mineral pitch"] as const;

// Terms used to QUERY DSLD search. Keep this conservative to avoid importing unrelated supplements.
const DEFAULT_SEARCH_TERMS = ["shilajit", "shilajeet", "mumijo", "mumie"] as const;

function parseCsvEnv(name: string): string[] | null {
  const raw = process.env[name];
  if (!raw) return null;
  const xs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xs.length ? xs : null;
}

function uniqueLower(xs: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function labelMentionsShilajit(labelText: string) {
  const t = String(labelText ?? "");
  const patterns = [
    /\bshilajit\b/i,
    /\bshilajeet\b/i,
    /\bmumijo\b/i,
    /\bmumie\b/i,
    /\basphaltum\b/i,
    /\bmineral\s+pitch\b/i,
  ];
  return patterns.some((re) => re.test(t));
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const maxLabelsIdx = argv.findIndex((a) => a === "--max");
  const maxLabels =
    maxLabelsIdx >= 0 && argv[maxLabelsIdx + 1] ? Number(argv[maxLabelsIdx + 1]) : undefined;
  return { dryRun, maxLabels: Number.isFinite(maxLabels) ? (maxLabels as number) : undefined };
}

function extractLabelIdsFromSearchResponse(json: any): string[] {
  const hits = json?.hits ?? json?.result?.hits ?? json?.data?.hits ?? [];
  if (!Array.isArray(hits)) return [];
  const ids: string[] = [];
  for (const h of hits) {
    if (typeof h === "number" || typeof h === "string") {
      ids.push(String(h));
      continue;
    }
    const id =
      h?.dsld_id ??
      h?.dsldId ??
      h?.label_id ??
      h?.labelId ??
      h?.id ??
      h?._id ??
      h?._source?.dsld_id ??
      h?._source?.dsldId ??
      h?._source?.id;
    if (id !== undefined && id !== null) ids.push(String(id));
  }
  return ids;
}

function coerceLabelObject(labelJson: any): any | null {
  if (!labelJson) return null;
  if (Array.isArray(labelJson)) return labelJson[0] ?? null;
  return labelJson;
}

function buildLabelText(label: any): string {
  const parts: string[] = [];
  const push = (x: any) => {
    if (!x) return;
    if (Array.isArray(x)) {
      for (const v of x) if (typeof v === "string" && v.trim()) parts.push(v.trim());
    } else if (typeof x === "string" && x.trim()) {
      parts.push(x.trim());
    }
  };

  push(label?.product_name ?? label?.productName);
  push(label?.brand_name ?? label?.brandName);
  push(label?.label_statements);
  push(label?.supplement_facts);
  push(label?.other_ingredients);
  push(label?.ingredients);
  push(label?.directions);
  push(label?.warnings);
  push(label?.contact_information);
  if (Array.isArray(label?.statementGroups)) {
    for (const g of label.statementGroups) {
      push(g?.groupName);
      push(g?.statements);
    }
  }

  const joined = parts.filter(Boolean).join("\n");
  if (joined.trim().length >= 50) return joined;
  try {
    return JSON.stringify(label, null, 2).slice(0, 5000);
  } catch {
    return String(label).slice(0, 5000);
  }
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

function pickWebsite(label: any): string | null {
  const w =
    label?.website ??
    label?.contact_information?.website ??
    label?.contact_information?.url ??
    label?.contact_information?.web ??
    null;
  if (typeof w !== "string") return null;
  const s = w.trim();
  if (s) return s;

  // v8 labels often store contact info inside statement groups.
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
    // Fallback: scan all statements for a website-like string.
    const all = label.statementGroups
      .flatMap((g: any) => (Array.isArray(g?.statements) ? g.statements : []))
      .map(String)
      .join("\n");
    const found = extractFirstWebsiteLike(all);
    if (found) return found;
  }

  return null;
}

function pickBrandName(label: any): string {
  const name =
    label?.brand_name ??
    label?.brandName ??
    label?.brand ??
    label?.brand?.name ??
    "Unknown brand";
  return normalizeBrandName(String(name));
}

function pickProductName(label: any, dsldId: string): string {
  const n = label?.product_name ?? label?.productName ?? label?.product ?? null;
  const s = typeof n === "string" ? n.trim() : "";
  return s || `DSLD Label ${dsldId}`;
}

async function upsertDsldEvidence(productId: string, dsldUrl: string, quote: string | null, dryRun: boolean, stats: IngestionStats) {
  if (dryRun) return;
  const existing = await prisma.evidence.findFirst({
    where: { productId, url: dsldUrl, sourceName: "DSLD" },
    select: { id: true },
  });
  if (existing) return;
  await prisma.evidence.create({
    data: {
      productId,
      type: "INGREDIENTS",
      url: dsldUrl,
      sourceName: "DSLD",
      quote,
      fetchedAt: new Date(),
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
      manufacturingClarity: p.manufacturingClarity,
      coaStatus: p.coaStatus,
    },
    { count: p.evidence.length }
  );
  const q = computeQualityTier(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingClarity: p.manufacturingClarity,
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

export async function runDsldShilajitIngest(opts: { dryRun: boolean; maxLabels?: number }) {
  const client = new DsldClient();
  const runId = await startRun("DSLD");
  const stats = createEmptyStats();
  const now = new Date();

  try {
    const labelIds = new Set<string>();
    // Smaller page sizes reduce stall risk (DSLD search can be slow under load).
    const defaultSize = Math.max(25, Number(process.env.DSLD_SEARCH_PAGE_SIZE ?? 100));
    const size = Math.min(defaultSize, opts.maxLabels ?? defaultSize);

    async function safeSearchFilter(args: { q: string; from: number; size: number }) {
      try {
        return await client.searchFilter(args);
      } catch (e: any) {
        stats.errorsCount += 1;
        if ((stats.errorsSample?.length ?? 0) < 25) {
          stats.errorsSample?.push({
            message: e?.message ? String(e.message) : String(e),
            context: `searchFilter q=${args.q} from=${args.from} size=${args.size}`,
          });
        }
        return null;
      }
    }

    const searchTerms = uniqueLower(parseCsvEnv("DSLD_SEARCH_TERMS") ?? Array.from(DEFAULT_SEARCH_TERMS));
    stats.notes?.push(`DSLD search terms: ${searchTerms.join(", ")}`);

    for (const term of searchTerms) {
      let from = 0;
      let pages = 0;
      while (pages < 200) {
        const res = await safeSearchFilter({ q: term, from, size });
        if (!res) break;
        const ids = extractLabelIdsFromSearchResponse(res);
        for (const id of ids) labelIds.add(id);
        if (opts.maxLabels && labelIds.size >= opts.maxLabels) break;
        if (ids.length < size) break;
        from += size;
        pages += 1;
      }
      if (opts.maxLabels && labelIds.size >= opts.maxLabels) break;
    }

    const allIds = Array.from(labelIds);
    const limited = opts.maxLabels ? allIds.slice(0, opts.maxLabels) : allIds;
    if (limited.length === 0) {
      stats.notes?.push(
        `No DSLD label IDs found. Check DSLD_API_BASE_URL (currently: ${process.env.DSLD_API_BASE_URL ?? "default"}).`
      );
    }

    for (const dsldId of limited) {
      try {
        const labelRes = await client.getLabel(dsldId);
        const label = coerceLabelObject(labelRes);
        if (!label) {
          stats.skippedCount += 1;
          continue;
        }

        const brandName = pickBrandName(label);
        const productName = pickProductName(label, dsldId);
        const website = pickWebsite(label);
        const websiteDomain = deriveBrandWebsiteDomain(website);
        const dsldUrl = `https://dsld.od.nih.gov/label/${dsldId}`;

        const labelText = buildLabelText(label);
        if (!labelMentionsShilajit(labelText)) {
          stats.skippedCount += 1;
          continue;
        }
        const ingredients = parseIngredientsFromLabelText(labelText);
        const manufacturing = deriveManufacturingFromLabelText(labelText);
        const form = inferFormFromText(`${productName}\n${ingredients.ingredientText}`);

        const brand = await upsertBrandSafe({
          brandName,
          website,
          websiteDomain,
          dryRun: opts.dryRun,
        });
        stats.brandsProcessed += 1;

        const slug = stableProductSlug(brandName, productName, dsldId);
        const product = opts.dryRun
          ? { id: "dry" }
          : await prisma.product.upsert({
              where: { sourceDsldLabelId: dsldId },
              update: {
                brandId: brand.id,
                name: productName,
                slug,
                form,
                ingredientText: ingredients.ingredientText,
                ingredientsNormalized: ingredients.ingredientsNormalized,
                manufacturingCountryClaim: manufacturing.manufacturingCountryClaim,
                manufacturingClarity: manufacturing.manufacturingClarity,
                manufacturingClaimText: manufacturing.manufacturingClaimText,
                coaStatus: "UNKNOWN",
                coaUrl: null,
                sourceDsldLabelId: dsldId,
                sourceDsldUrl: dsldUrl,
                dataCompleteness: "MEDIUM",
                lastVerifiedAt: now,
              },
              create: {
                brandId: brand.id,
                name: productName,
                slug,
                form,
                ingredientText: ingredients.ingredientText,
                ingredientsNormalized: ingredients.ingredientsNormalized,
                manufacturingCountryClaim: manufacturing.manufacturingCountryClaim,
                manufacturingClarity: manufacturing.manufacturingClarity,
                manufacturingClaimText: manufacturing.manufacturingClaimText,
                manufacturingEvidenceUrl: null,
                coaStatus: "UNKNOWN",
                coaUrl: null,
                transparencyGrade: "F",
                qualityTier: "POOR",
                sourceDsldLabelId: dsldId,
                sourceDsldUrl: dsldUrl,
                dataCompleteness: "MEDIUM",
                lastVerifiedAt: now,
              },
              select: { id: true },
            });

        stats.productsProcessed += 1;
        if (manufacturing.manufacturingClarity === "CLEAR") stats.manufacturingClearCount += 1;

        const quote =
          ingredients.ingredientText.length > 20 ? ingredients.ingredientText.slice(0, 240) : null;
        await upsertDsldEvidence(product.id, dsldUrl, quote, opts.dryRun, stats);

        await recomputeAndPersist(product.id, opts.dryRun);
      } catch (e: any) {
        stats.errorsCount += 1;
        if ((stats.errorsSample?.length ?? 0) < 25) {
          stats.errorsSample?.push({
            message: e?.message ? String(e.message) : String(e),
            context: `dsldId=${dsldId}`,
          });
        }
      }
    }

    await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    if ((stats.errorsSample?.length ?? 0) < 25) {
      stats.errorsSample?.push({
        message: e?.message ? String(e.message) : String(e),
        context: "runDsldShilajitIngest",
      });
    }
    await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dryRun, maxLabels } = parseArgs(process.argv.slice(2));
  runDsldShilajitIngest({ dryRun, maxLabels })
    .then(({ runId, stats }) => {
      console.log(`DSLD ingest complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

