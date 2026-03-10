import "dotenv/config";

import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { classifyUrlForCsv } from "./classifyUrl";
import { fetchPage } from "./fetchPage";
import { extractOfficialProduct } from "./extractOfficialProduct";
import { extractMarketplaceProduct } from "./extractMarketplaceProduct";
import { extractRetailerProduct } from "./extractRetailerProduct";
import { extractCollectionPage } from "./extractCollectionPage";
import { extractHomepage } from "./extractHomepage";
import type {
  CsvInputRow,
  EnrichedOutputRow,
  RunSummary,
  UrlKind,
  SourceTrustLevel,
} from "./types";

function argValue(flag: string): string | null {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

function argBool(flag: string, defaultValue: boolean): boolean {
  const v = argValue(flag);
  if (v === null) return defaultValue;
  return v.toLowerCase() === "true" || v === "1";
}

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 10) return false;
  if (/no site found|no stie found|^no\s/i.test(t)) return false;
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  if (/^[a-z0-9][a-z0-9.-]*\.(com|in|ru|org|net|co|io)(\/|$)/i.test(t)) return true;
  return false;
}

function normalizeUrl(s: string): string {
  const t = s.trim();
  if (t.startsWith("http")) return t;
  return `https://${t}`;
}

function parseInputCsv(raw: string): CsvInputRow[] {
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, unknown>[];

  const first = rows[0];
  const hasMultiProductFormat =
    first &&
    typeof first.BRAND === "string" &&
    (typeof first["BRAND URL"] === "string" || Object.keys(first).some((k) => k.startsWith("PRODUCT")));

  if (hasMultiProductFormat) {
    const result: CsvInputRow[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const brand = String(r.BRAND ?? r.brand ?? "").trim();
      for (const [key, val] of Object.entries(r)) {
        if (key === "BRAND" || val == null) continue;
        const s = String(val).trim();
        if (!looksLikeUrl(s)) continue;
        const url = normalizeUrl(s);
        const dedupe = `${brand}|${url}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        result.push({ name: brand || "Unknown", url, source: "" });
      }
    }
    return result;
  }

  return rows
    .map((r) => {
      const url = String(
        r.url ?? r.URL ?? r["BRAND URL"] ?? r["brand url"] ?? r.link ?? r.LINK ?? r.product_url ?? ""
      ).trim();
      if (!url) return null;
      const fullUrl = normalizeUrl(url);
      const name = String(
        r.name ?? r.NAME ?? r.brand ?? r.BRAND ?? r.product ?? r.PRODUCT ?? ""
      ).trim();
      const source = String(r.source ?? r.SOURCE ?? "").trim();
      return { name, url: fullUrl, source } as CsvInputRow;
    })
    .filter((r): r is CsvInputRow => r !== null);
}

function sourceTrustLevel(kind: UrlKind): SourceTrustLevel {
  if (kind === "OFFICIAL_PRODUCT_PAGE") return "OFFICIAL";
  if (kind === "RETAILER_PRODUCT_PAGE") return "RETAILER";
  return "MARKETPLACE";
}

function toOutputRow(
  input: CsvInputRow,
  urlKind: UrlKind,
  canonicalizedUrl: string,
  extracted: {
    brand?: string | null;
    productName?: string | null;
    form?: string;
    ingredientsText?: string | null;
    manufacturingClaim?: string | null;
    coaUrl?: string | string[] | null;
    gtin?: string | null;
    netQuantity?: string | null;
    canCreateCanonical?: boolean;
    confidence?: number;
    notes?: string;
    stableIdentitySignal?: string | null;
    canonicalSkipReason?: string | null;
  },
  diagnostics?: {
    failure_reason?: string;
    robots_blocked?: boolean;
    timed_out?: boolean;
    js_render_required?: boolean;
    missing_title?: boolean;
    missing_brand?: boolean;
  }
): EnrichedOutputRow {
  const coaUrl = Array.isArray(extracted.coaUrl)
    ? extracted.coaUrl[0] ?? ""
    : extracted.coaUrl ?? "";

  return {
    input_name: input.name ?? "",
    input_url: input.url,
    source: input.source ?? "",
    url_kind: urlKind,
    source_trust_level: sourceTrustLevel(urlKind),
    canonicalized_url: canonicalizedUrl,
    extracted_brand: extracted.brand ?? "",
    extracted_product_name: extracted.productName ?? "",
    form: extracted.form ?? "",
    ingredients_text: extracted.ingredientsText ?? "",
    manufacturing_claim: extracted.manufacturingClaim ?? "",
    coa_url: coaUrl,
    gtin: extracted.gtin ?? "",
    net_quantity: extracted.netQuantity ?? "",
    can_create_canonical: extracted.canCreateCanonical ? "true" : "false",
    confidence: String(extracted.confidence ?? 0),
    stable_identity_signal: extracted.stableIdentitySignal ?? "",
    canonical_skip_reason: extracted.canonicalSkipReason ?? "",
    notes: extracted.notes ?? "",
    failure_reason: diagnostics?.failure_reason ?? "",
    robots_blocked: diagnostics?.robots_blocked ? "true" : "false",
    timed_out: diagnostics?.timed_out ? "true" : "false",
    js_render_required: diagnostics?.js_render_required ? "true" : "false",
    missing_title: diagnostics?.missing_title ? "true" : "false",
    missing_brand: diagnostics?.missing_brand ? "true" : "false",
  };
}

async function processRow(
  input: CsvInputRow,
  usePlaywright: boolean
): Promise<{ row: EnrichedOutputRow; kind: UrlKind; failed: boolean }> {
  const classification = classifyUrlForCsv(input.url);

  if (classification.kind === "UNKNOWN") {
    return {
      row: toOutputRow(input, "UNKNOWN", classification.canonicalizedUrl, {
        notes: classification.reason,
      }),
      kind: "UNKNOWN",
      failed: false,
    };
  }

  try {
    const page = await fetchPage(input.url, { usePlaywright });
    if (page.status >= 400) {
      return {
        row: toOutputRow(
          input,
          classification.kind,
          classification.canonicalizedUrl,
          { notes: `HTTP ${page.status}` },
          { failure_reason: `HTTP ${page.status}` }
        ),
        kind: classification.kind,
        failed: true,
      };
    }

    switch (classification.kind) {
      case "OFFICIAL_PRODUCT_PAGE": {
        const ex = extractOfficialProduct(page, input.name);
        const missingTitle = !ex.productName?.trim();
        const missingBrand = !ex.brand?.trim();
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            brand: ex.brand,
            productName: ex.productName,
            form: ex.form,
            ingredientsText: ex.ingredientsText,
            manufacturingClaim: ex.manufacturingClaim,
            coaUrl: ex.coaUrls.length ? ex.coaUrls : null,
            gtin: ex.gtin,
            netQuantity: ex.netQuantity,
            canCreateCanonical: ex.canCreateCanonical,
            confidence: ex.confidence,
            notes: ex.notes,
            stableIdentitySignal: ex.stableIdentitySignal,
            canonicalSkipReason: ex.canonicalSkipReason,
          }, { missing_title: missingTitle, missing_brand: missingBrand }),
          kind: classification.kind,
          failed: false,
        };
      }
      case "RETAILER_PRODUCT_PAGE": {
        const ex = extractRetailerProduct(page, input.name);
        const missingTitle = !ex.title?.trim();
        const missingBrand = !ex.brand?.trim();
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            brand: ex.brand,
            productName: ex.title,
            form: ex.form,
            ingredientsText: ex.ingredientsText,
            netQuantity: ex.sizeOrCount,
            gtin: ex.gtin,
            canCreateCanonical: ex.canCreateCanonical,
            notes: ex.notes,
          }, { missing_title: missingTitle, missing_brand: missingBrand }),
          kind: classification.kind,
          failed: false,
        };
      }
      case "MARKETPLACE_PRODUCT_PAGE": {
        const ex = extractMarketplaceProduct(page, input.name, classification.domain);
        const missingTitle = !ex.title?.trim();
        const missingBrand = !ex.brand?.trim();
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            brand: ex.brand,
            productName: ex.title,
            netQuantity: ex.sizeOrCount,
            gtin: ex.gtin,
            canCreateCanonical: ex.canCreateCanonical,
            notes: ex.notes,
          }, { missing_title: missingTitle, missing_brand: missingBrand }),
          kind: classification.kind,
          failed: false,
        };
      }
      case "COLLECTION_PAGE":
      case "STORE_PAGE": {
        const ex = extractCollectionPage(page, classification.domain);
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            notes: ex.notes,
          }),
          kind: classification.kind,
          failed: false,
        };
      }
      case "HOMEPAGE": {
        const ex = extractHomepage(page);
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            brand: ex.brandName,
            notes: ex.notes,
          }),
          kind: classification.kind,
          failed: false,
        };
      }
      default:
        return {
          row: toOutputRow(input, classification.kind, classification.canonicalizedUrl, {
            notes: classification.reason,
          }),
          kind: classification.kind,
          failed: false,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const timedOut = /timeout|ETIMEDOUT|timed out/i.test(msg);
    const robotsBlocked = /403|forbidden|robots/i.test(msg);
    return {
      row: toOutputRow(
        input,
        classification.kind,
        classification.canonicalizedUrl,
        { notes: `Error: ${msg}` },
        {
          failure_reason: msg,
          timed_out: timedOut,
          robots_blocked: robotsBlocked,
        }
      ),
      kind: classification.kind,
      failed: true,
    };
  }
}

async function main() {
  const inputPath = argValue("--input") ?? argValue("-i");
  const outputPath = argValue("--output") ?? argValue("-o");
  const dryRun = argBool("--dryRun", true);
  const writeDb = argBool("--writeDb", false);
  const jobRunId = argValue("--jobRunId");
  const maxRows = Math.max(1, parseInt(argValue("--maxRows") ?? "0", 10) || 9999);
  const usePlaywrightOfficial = argBool("--usePlaywrightOfficial", true);
  const usePlaywrightAll = argBool("--usePlaywrightAll", false);

  if (!inputPath) {
    console.error("Usage: npx tsx scripts/ingest/url_csv/runUrlCsvExtract.ts --input path/to/in.csv [--output path/to/out.csv] [--dryRun true|false] [--writeDb true|false] [--jobRunId ID] [--maxRows N] [--usePlaywrightOfficial true|false] [--usePlaywrightAll true|false]");
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, "utf8");
  const inputs = parseInputCsv(raw).slice(0, maxRows);

  console.log(`Processing ${inputs.length} rows (dryRun=${dryRun}, writeDb=${writeDb})`);

  const outputRows: EnrichedOutputRow[] = [];
  const summary: RunSummary = {
    rowsProcessed: 0,
    officialProductPages: 0,
    retailerProductPages: 0,
    marketplacePages: 0,
    collectionPages: 0,
    homepages: 0,
    canonicalCandidates: 0,
    listingOnly: 0,
    failed: 0,
  };

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const classification = classifyUrlForCsv(input.url);
    const usePlaywright =
      usePlaywrightAll ||
      (usePlaywrightOfficial && classification.kind === "OFFICIAL_PRODUCT_PAGE");
    process.stdout.write(`[${i + 1}/${inputs.length}] ${input.url.slice(0, 60)}... `);
    const { row, kind, failed } = await processRow(input, usePlaywright);
    outputRows.push(row);
    summary.rowsProcessed += 1;

    if (failed) summary.failed += 1;
    if (kind === "OFFICIAL_PRODUCT_PAGE") summary.officialProductPages += 1;
    if (kind === "RETAILER_PRODUCT_PAGE") summary.retailerProductPages += 1;
    if (kind === "MARKETPLACE_PRODUCT_PAGE") summary.marketplacePages += 1;
    if (kind === "COLLECTION_PAGE" || kind === "STORE_PAGE") summary.collectionPages += 1;
    if (kind === "HOMEPAGE") summary.homepages += 1;
    if (row.can_create_canonical === "true") summary.canonicalCandidates += 1;
    if (
      kind === "MARKETPLACE_PRODUCT_PAGE" ||
      kind === "RETAILER_PRODUCT_PAGE" ||
      (kind === "OFFICIAL_PRODUCT_PAGE" && row.can_create_canonical !== "true")
    ) {
      summary.listingOnly += 1;
    }

    console.log(`${kind}${failed ? " (failed)" : ""}`);
  }

  // Write output CSV
  const outPath = outputPath ?? path.join(path.dirname(inputPath), "url_csv_enriched.csv");
  const columns: (keyof EnrichedOutputRow)[] = [
    "input_name", "input_url", "source", "url_kind", "source_trust_level", "canonicalized_url",
    "extracted_brand", "extracted_product_name", "form", "ingredients_text",
    "manufacturing_claim", "coa_url", "gtin", "net_quantity",
    "can_create_canonical", "confidence", "stable_identity_signal", "canonical_skip_reason", "notes",
    "failure_reason", "robots_blocked", "timed_out", "js_render_required", "missing_title", "missing_brand",
  ];
  const escape = (v: string) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.join(",");
  const body = outputRows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\n");
  const csvContent = header + "\n" + body;
  await fs.writeFile(outPath, csvContent, "utf8");
  console.log(`\nWrote ${outputRows.length} rows to ${outPath}`);

  // Write JSON summary
  const summaryPath = outPath.replace(/\.csv$/i, "_summary.json");
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Wrote summary to ${summaryPath}`);

  console.log("\nSummary:", summary);

  let listingsWritten = 0;
  if (writeDb && !dryRun) {
    const { resolveListingToProduct } = await import("@/scripts/ingest/discovery/listingResolver");
    const { inferFormFromTitle } = await import("@/scripts/ingest/discovery/normalize");
    type ListingSource = "OFFICIAL" | "AMAZON" | "WALMART" | "IHERB" | "OTHER_RETAILER";
    const sourceFromDomain = (domain: string): ListingSource => {
      if (/amazon/i.test(domain)) return "AMAZON";
      if (/walmart/i.test(domain)) return "WALMART";
      if (/iherb/i.test(domain)) return "IHERB";
      return "OTHER_RETAILER";
    };
    const sourceForRow = (row: EnrichedOutputRow): ListingSource =>
      row.url_kind === "OFFICIAL_PRODUCT_PAGE"
        ? "OFFICIAL"
        : row.url_kind === "RETAILER_PRODUCT_PAGE"
          ? sourceFromDomain(new URL(row.input_url).hostname)
          : sourceFromDomain(new URL(row.input_url).hostname);
    for (const row of outputRows) {
      if (
        row.url_kind !== "OFFICIAL_PRODUCT_PAGE" &&
        row.url_kind !== "RETAILER_PRODUCT_PAGE" &&
        row.url_kind !== "MARKETPLACE_PRODUCT_PAGE"
      )
        continue;
      const source: ListingSource = sourceForRow(row);
      await resolveListingToProduct({
        url: row.canonicalized_url || row.input_url,
        source,
        title: row.extracted_product_name || row.input_name,
        brandName: row.extracted_brand,
        observedGtin: row.gtin || null,
        netQuantityText: row.net_quantity || null,
        form: inferFormFromTitle(row.extracted_product_name) ?? undefined,
      });
      listingsWritten += 1;
    }
    console.log(`\nDB write: created/updated ${listingsWritten} listings.`);
  }

  if (jobRunId) {
    const { finishJobRunSuccess } = await import("@/scripts/jobs/jobUtils");
    await finishJobRunSuccess(jobRunId, {
      rowsProcessed: summary.rowsProcessed,
      officialProductPages: summary.officialProductPages,
      retailerProductPages: summary.retailerProductPages,
      marketplacePages: summary.marketplacePages,
      failed: summary.failed,
      listingsWritten: writeDb && !dryRun ? listingsWritten : undefined,
    });
  }
}

main().catch(async (err) => {
  const jobRunId = (() => {
    const idx = process.argv.findIndex((a) => a === "--jobRunId");
    return idx >= 0 ? process.argv[idx + 1] ?? null : null;
  })();
  if (jobRunId) {
    const { finishJobRunFailure } = await import("@/scripts/jobs/jobUtils");
    await finishJobRunFailure(jobRunId, err instanceof Error ? err.message : String(err), null);
  }
  console.error(err);
  process.exit(1);
}).finally(() => {
  import("@/lib/db").then(({ prisma }) => prisma.$disconnect());
});
