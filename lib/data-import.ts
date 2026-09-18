import { parse } from "csv-parse/sync";
import type {
  CoaStatus,
  DataCompleteness,
  ProductForm,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { retagBestFor } from "@/lib/best-for-tags";
import { computeAllGrades, GRADING_SELECT, toProductForGrading } from "@/lib/grading";
import { deriveWebsiteDomain } from "@/lib/url";
import { slugify } from "@/lib/slug";
import { isAffiliateTrackingUrl } from "@/lib/affiliate";
import { isFutureVerifiedDate } from "@/lib/verified-date";

const VALID_FORM: ProductForm[] = [
  "RESIN",
  "CAPSULE",
  "POWDER",
  "GUMMY",
  "LIQUID",
  "BLEND",
  "TABLETS",
  "HONEY_STICKS",
  "OTHER",
];
const VALID_COA: CoaStatus[] = ["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"];
const VALID_COMPLETENESS: DataCompleteness[] = ["LOW", "MEDIUM", "HIGH"];

function coerce<T>(value: string, valid: readonly T[]): T {
  const s = String(value ?? "").trim().toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
  return valid.includes(s as T) ? (s as T) : valid[0];
}

function toIntOrNull(v: string): number | null {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isNaN(n) ? null : n;
}

function toDateOrNull(v: string): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ImportResult = {
  brandsCreated: number;
  brandsUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsDeleted: number;
  errors: string[];
  /** Rows that imported, with a value that was ignored or needs a human check. */
  warnings: string[];
};

export async function importDataFromCsv(
  csvBuffer: Buffer,
  replaceMode: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    brandsCreated: 0,
    brandsUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsDeleted: 0,
    errors: [],
    warnings: [],
  };

  let rows: Record<string, string>[];
  try {
    const raw = csvBuffer.toString("utf8");
    rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
      // Strict: a row with a different column count than the header means columns have shifted
      // (the export once wrote a stale header), and importing it would write values into the
      // wrong fields.
    }) as Record<string, string>[];
  } catch (e) {
    result.errors.push(`CSV parse error: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  if (rows.length === 0) {
    result.errors.push("CSV has no data rows");
    return result;
  }

  const requiredCols = [
    "brand_name",
    "brand_slug",
    "product_name",
    "product_slug",
    "form",
    "ingredient_text",
    "coa_status",
  ];
  const first = rows[0];
  for (const col of requiredCols) {
    if (!(col in first)) {
      result.errors.push(`Missing required column: ${col}`);
    }
  }
  if (result.errors.length > 0) return result;

  const productIdsInCsv = new Set<string>();

  await prisma.$transaction(async (tx) => {
    const brandBySlug = new Map<string, { id: string; seen: boolean }>();
    for (const b of await tx.brand.findMany({ select: { id: true, slug: true } })) {
      brandBySlug.set(b.slug, { id: b.id, seen: false });
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const brandName = String(r.brand_name ?? "").trim();
      const brandSlug = String(r.brand_slug ?? "").trim() || slugify(brandName);
      const productName = String(r.product_name ?? "").trim();
      const productSlug = String(r.product_slug ?? "").trim() || slugify(productName);

      if (!brandName || !productName) {
        result.errors.push(`Row ${i + 2}: missing brand_name or product_name`);
        continue;
      }

      let brandId = brandBySlug.get(brandSlug)?.id;
      if (!brandId) {
        const existing = await tx.brand.findUnique({ where: { slug: brandSlug }, select: { id: true } });
        if (existing) {
          brandId = existing.id;
          brandBySlug.set(brandSlug, { id: brandId, seen: false });
        } else {
          const brand = await tx.brand.create({
            data: {
              name: brandName,
              slug: brandSlug,
              website: String(r.brand_website ?? "").trim() || null,
              websiteDomain: deriveWebsiteDomain(String(r.brand_website ?? "").trim() || null),
            },
            select: { id: true },
          });
          brandId = brand.id;
          brandBySlug.set(brandSlug, { id: brandId, seen: true });
          result.brandsCreated++;
        }
      } else {
        const entry = brandBySlug.get(brandSlug)!;
        if (!entry.seen) {
          await tx.brand.update({
            where: { id: brandId },
            data: {
              name: brandName,
              website: String(r.brand_website ?? "").trim() || null,
              websiteDomain: deriveWebsiteDomain(String(r.brand_website ?? "").trim() || null),
            },
          });
          entry.seen = true;
          result.brandsUpdated++;
        }
      }

      const productId = String(r.product_id ?? "").trim();
      const rowLabel = `Row ${i + 2} (${productSlug})`;

      let lastVerifiedAt = toDateOrNull(r.last_verified_at ?? "");
      if (lastVerifiedAt && isFutureVerifiedDate(lastVerifiedAt)) {
        result.warnings.push(
          `${rowLabel}: last_verified_at ${lastVerifiedAt.toISOString().slice(0, 10)} is in the future — ignored`,
        );
        lastVerifiedAt = null;
      }
      const officialCanonicalUrl = String(r.official_canonical_url ?? "").trim() || null;

      const ingredientsNormalized = String(r.ingredients_normalized ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      const baseData = {
        brandId,
        name: productName,
        slug: productSlug,
        form: coerce(r.form, VALID_FORM),
        ingredientText: String(r.ingredient_text ?? "").trim() || productName,
        ingredientsNormalized,
        manufacturingCountryClaim: String(r.manufacturing_country_claim ?? "").trim() || null,
        manufacturingClaimText: String(r.manufacturing_claim_text ?? "").trim() || null,
        manufacturingEvidenceUrl: String(r.manufacturing_evidence_url ?? "").trim() || null,
        coaStatus: coerce(r.coa_status, VALID_COA),
        coaUrl: String(r.coa_url ?? "").trim() || null,
        // undefined leaves an existing product's date untouched when the CSV date was rejected
        lastVerifiedAt: lastVerifiedAt ?? (String(r.last_verified_at ?? "").trim() ? undefined : null),
        isCanonical: String(r.is_canonical ?? "").trim() === "1",
        officialCanonicalUrl,
        officialDomain: String(r.official_domain ?? "").trim() || null,
        gtin: String(r.gtin ?? "").trim() || null,
        mpn: String(r.mpn ?? "").trim() || null,
        brandSku: String(r.brand_sku ?? "").trim() || null,
        netQuantityText: String(r.net_quantity_text ?? "").trim() || null,
        servingsCount: toIntOrNull(r.servings_count ?? ""),
        capsuleCount: toIntOrNull(r.capsule_count ?? ""),
        flavor: String(r.flavor ?? "").trim() || null,
        dataCompleteness: coerce(r.data_completeness ?? "LOW", VALID_COMPLETENESS),
        sourceDsldLabelId: String(r.source_dsld_label_id ?? "").trim() || null,
        sourceDsldUrl: String(r.source_dsld_url ?? "").trim() || null,
      };

      const existingProduct = productId
        ? await tx.product.findUnique({ where: { id: productId }, include: { evidence: { select: { id: true } }, brand: { select: { slug: true } } } })
        : null;

      // Product pages label affiliate links at render time, but a new one still needs a human
      // to confirm the relationship is real and disclosed (see /disclosure).
      if (
        isAffiliateTrackingUrl(officialCanonicalUrl) &&
        officialCanonicalUrl !== existingProduct?.officialCanonicalUrl
      ) {
        result.warnings.push(`${rowLabel}: official_canonical_url is an affiliate tracking link — confirm disclosure`);
      }

      if (existingProduct) {
        await tx.product.update({
          where: { id: productId },
          data: baseData,
        });
        productIdsInCsv.add(productId);
        result.productsUpdated++;
      } else {
        const created = await tx.product.create({
          data: {
            ...baseData,
            transparencyGrade: "F",
            qualityTier: "POOR",
          },
          select: { id: true },
        });
        productIdsInCsv.add(created.id);
        result.productsCreated++;
      }
    }

    if (replaceMode) {
      const toDelete = await tx.product.findMany({
        where: { id: { notIn: Array.from(productIdsInCsv) } },
        select: { id: true },
      });
      if (toDelete.length > 0) {
        await tx.product.deleteMany({ where: { id: { in: toDelete.map((p) => p.id) } } });
        result.productsDeleted = toDelete.length;
      }
      const orphanBrands = await tx.brand.findMany({
        where: { products: { none: {} } },
        select: { id: true },
      });
      if (orphanBrands.length > 0) {
        await tx.brand.deleteMany({ where: { id: { in: orphanBrands.map((b) => b.id) } } });
      }
    }
  });

  // Regrade from stored data. The CSV never carries COA review fields, so they are kept
  // from the database; products created by this import start unreviewed.
  const allProducts = await prisma.product.findMany({
    select: { id: true, ...GRADING_SELECT },
  });

  for (const { id, ...p } of allProducts) {
    await prisma.product.update({
      where: { id },
      data: computeAllGrades(toProductForGrading(p)),
    });
  }
  await retagBestFor(prisma, { apply: true });

  return result;
}
