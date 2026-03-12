import { parse } from "csv-parse/sync";
import type {
  CoaStatus,
  DataCompleteness,
  ManufacturingClarity,
  ProductForm,
  QualityTier,
  TransparencyGrade,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { deriveWebsiteDomain } from "@/lib/url";
import { slugify } from "@/lib/slug";

const VALID_FORM: ProductForm[] = [
  "RESIN",
  "CAPSULE",
  "POWDER",
  "GUMMY",
  "LIQUID",
  "BLEND",
  "OTHER",
];
const VALID_MFG: ManufacturingClarity[] = ["CLEAR", "AMBIGUOUS", "NOT_STATED"];
const VALID_COA: CoaStatus[] = ["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"];
const VALID_GRADE: TransparencyGrade[] = ["F", "D", "C", "B", "A"];
const VALID_TIER: QualityTier[] = ["POOR", "AVERAGE", "PREMIUM", "ULTRA_PREMIUM"];
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
  };

  let rows: Record<string, string>[];
  try {
    const raw = csvBuffer.toString("utf8");
    rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
      relax_column_count: true,
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
    "manufacturing_clarity",
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
        manufacturingClarity: coerce(r.manufacturing_clarity, VALID_MFG),
        manufacturingClaimText: String(r.manufacturing_claim_text ?? "").trim() || null,
        manufacturingEvidenceUrl: String(r.manufacturing_evidence_url ?? "").trim() || null,
        coaStatus: coerce(r.coa_status, VALID_COA),
        coaUrl: String(r.coa_url ?? "").trim() || null,
        lastVerifiedAt: toDateOrNull(r.last_verified_at ?? ""),
        isCanonical: String(r.is_canonical ?? "").trim() === "1",
        officialCanonicalUrl: String(r.official_canonical_url ?? "").trim() || null,
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

  const allProducts = await prisma.product.findMany({
    include: {
      evidence: { select: { id: true } },
      brand: { select: { slug: true } },
    },
  });

  for (const p of allProducts) {
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
    await prisma.product.update({
      where: { id: p.id },
      data: { transparencyGrade: t.grade, qualityTier: q.tier },
    });
  }

  return result;
}
