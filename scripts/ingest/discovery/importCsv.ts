import "dotenv/config";

import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { deriveWebsiteDomain } from "@/lib/url";
import { createEmptyStats, finishRun, startRun } from "@/scripts/ingest/shared/observability";
import { upsertBrandSafe } from "@/scripts/ingest/shared/brand";
import { ProductForm } from "@prisma/client";

type DiscoveryRow = {
  brandName: string;
  website?: string;
  productName?: string;
  form?: string;
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const pathIdx = argv.findIndex((a) => a === "--path");
  const path = pathIdx >= 0 ? argv[pathIdx + 1] : undefined;
  return { dryRun, path };
}

function normalizeRow(r: any): DiscoveryRow | null {
  const brandName = String(r.brandName ?? r.brand_name ?? r.brand ?? "").trim();
  if (!brandName) return null;
  const website = String(r.website ?? r.site ?? r.url ?? "").trim() || undefined;
  const productName = String(r.productName ?? r.product_name ?? r.product ?? "").trim() || undefined;
  const form = String(r.form ?? "").trim() || undefined;
  return { brandName, website, productName, form };
}

function coerceProductForm(input: unknown): ProductForm {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  const values = Object.values(ProductForm) as string[];
  return values.includes(s) ? (s as ProductForm) : ProductForm.OTHER;
}

export async function importDiscoveryCsv(opts: { csvPath: string; dryRun: boolean }) {
  const runId = await startRun("DISCOVERY");
  const stats = createEmptyStats();

  try {
    const raw = await fs.readFile(opts.csvPath, "utf8");
    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    }) as unknown[];

    for (const rec of records) {
      const row = normalizeRow(rec);
      if (!row) continue;

      const websiteDomain = deriveWebsiteDomain(row.website);

      const brand = await upsertBrandSafe({
        brandName: row.brandName,
        website: row.website ?? null,
        websiteDomain,
        dryRun: opts.dryRun,
      });
      stats.brandsProcessed += 1;

      if (!row.productName) continue;

      const productSlug = slugify(`${row.brandName} ${row.productName}`);
      const form = coerceProductForm(row.form);
      if (!opts.dryRun) {
        await prisma.product.upsert({
          where: { slug: productSlug },
          update: {
            brandId: brand.id,
            name: row.productName,
            form,
            dataCompleteness: "LOW",
            lastVerifiedAt: new Date(),
          },
          create: {
            brandId: brand.id,
            name: row.productName,
            slug: productSlug,
            form,
            ingredientText: "Ingredients: Unknown (placeholder from discovery import).",
            ingredientsNormalized: [],
            manufacturingCountryClaim: "Unknown",
            manufacturingClarity: "NOT_STATED",
            manufacturingClaimText: null,
            manufacturingEvidenceUrl: row.website ?? null,
            coaStatus: "UNKNOWN",
            coaUrl: null,
            transparencyGrade: "F",
            qualityTier: "POOR",
            sourceDsldLabelId: null,
            sourceDsldUrl: null,
            dataCompleteness: "LOW",
            lastVerifiedAt: new Date(),
          },
          select: { id: true },
        });
      }
      stats.productsProcessed += 1;
    }

    await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dryRun, path } = parseArgs(process.argv.slice(2));
  if (!path) {
    console.error("Missing --path=/path/to/file.csv");
    process.exit(1);
  }
  importDiscoveryCsv({ csvPath: path, dryRun })
    .then(({ runId, stats }) => {
      console.log(`Discovery CSV import complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .finally(async () => prisma.$disconnect());
}

