import "dotenv/config";

import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { resolveListing } from "./resolveListingToProduct";
import type { ListingSource, ProductForm } from "@prisma/client";

function argValue(flag: string) {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

function coerceListingSource(input: unknown): ListingSource {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  const values = ["OFFICIAL", "AMAZON", "WALMART", "OTHER_RETAILER"] as const;
  return (values.includes(s as any) ? (s as ListingSource) : "OTHER_RETAILER") as ListingSource;
}

function coerceProductForm(input: unknown): ProductForm | null {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  if (!s) return null;
  const values = ["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"] as const;
  return values.includes(s as any) ? (s as ProductForm) : null;
}

function coerceBool(input: unknown): boolean | null {
  if (input == null) return null;
  const s = String(input).trim().toLowerCase();
  if (!s) return null;
  if (["true", "t", "1", "yes", "y"].includes(s)) return true;
  if (["false", "f", "0", "no", "n"].includes(s)) return false;
  return null;
}

function coerceInt(input: unknown): number | null {
  if (input == null) return null;
  const n = Number(String(input).trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

async function ingestOne(input: {
  url: string;
  source: ListingSource;
  title?: string | null;
  brandName?: string | null;
  observedGtin?: string | null;
  observedSku?: string | null;
  netQuantityText?: string | null;
  form?: ProductForm | null;
  seller?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  inStock?: boolean | null;
  shipsToUS?: boolean | null;
  imageUrls?: string[] | null;
}) {
  const res = await resolveListing(input);
  return res;
}

async function main() {
  const csvPath = argValue("--csv");

  if (csvPath) {
    const raw = await fs.readFile(csvPath, "utf8");
    const rows = parse(raw, { columns: true, skip_empty_lines: true }) as Array<Record<string, unknown>>;

    let attached = 0;
    let created = 0;
    let manual = 0;
    let skipped = 0;

    for (const r of rows) {
      const url = String(r.url ?? "").trim();
      if (!url) {
        skipped += 1;
        continue;
      }

      const result = await ingestOne({
        url,
        source: coerceListingSource(r.source),
        title: (r.title as string) ?? null,
        brandName: (r.brandName as string) ?? null,
        observedGtin: (r.observedGtin as string) ?? null,
        observedSku: (r.observedSku as string) ?? null,
        netQuantityText: (r.netQuantityText as string) ?? null,
        form: coerceProductForm(r.form),
        seller: (r.seller as string) ?? null,
        priceCents: coerceInt(r.priceCents),
        currency: (r.currency as string) ?? null,
        inStock: coerceBool(r.inStock),
        shipsToUS: coerceBool(r.shipsToUS),
        imageUrls:
          typeof r.imageUrls === "string"
            ? r.imageUrls
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
      });

      if (result.kind === "attached") attached += 1;
      else if (result.kind === "created") created += 1;
      else if (result.kind === "manual_review") manual += 1;
      else skipped += 1;
    }

    console.log(JSON.stringify({ ok: true, rows: rows.length, attached, created, manual, skipped }, null, 2));
    return;
  }

  const url = argValue("--url");
  if (!url) {
    console.error('Missing input. Provide either "--csv <path>" or "--url <url>".');
    process.exit(1);
  }

  const res = await ingestOne({
    url,
    source: coerceListingSource(argValue("--source") ?? "OTHER_RETAILER"),
    title: argValue("--title"),
    brandName: argValue("--brand"),
    observedGtin: argValue("--gtin"),
    observedSku: argValue("--sku"),
    netQuantityText: argValue("--qty"),
    form: coerceProductForm(argValue("--form")),
    seller: argValue("--seller"),
    priceCents: coerceInt(argValue("--priceCents")),
    currency: argValue("--currency"),
    inStock: coerceBool(argValue("--inStock")),
    shipsToUS: coerceBool(argValue("--shipsToUS")),
    imageUrls: argValue("--images")?.split("|").map((s) => s.trim()).filter(Boolean) ?? null,
  });

  console.log(JSON.stringify(res, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

