import type { ProductForm, ManufacturingClarity, CoaStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { inferFormFromTitle } from "@/scripts/ingest/discovery/normalize";
import type { EnrichedOutputRow } from "@/scripts/ingest/url_csv/types";

const FORM_MAP: Record<string, ProductForm> = {
  RESIN: "RESIN",
  CAPSULE: "CAPSULE",
  POWDER: "POWDER",
  GUMMY: "GUMMY",
  LIQUID: "LIQUID",
  BLEND: "BLEND",
  OTHER: "OTHER",
};

function toForm(s: string): ProductForm {
  const u = String(s ?? "").trim().toUpperCase().replaceAll("-", "_");
  return FORM_MAP[u] ?? "OTHER";
}

function toMfg(s: string): ManufacturingClarity {
  const u = String(s ?? "").trim().toUpperCase().replaceAll("-", "_");
  if (u === "CLEAR") return "CLEAR";
  if (u === "AMBIGUOUS") return "AMBIGUOUS";
  return "NOT_STATED";
}

function toCoaStatus(hasCoaUrl: boolean): CoaStatus {
  return hasCoaUrl ? "PUBLIC" : "UNKNOWN";
}

/**
 * Update an existing product from a crawl/enriched row and optionally add COA evidence.
 * Recomputes transparency and quality grades.
 */
export async function updateProductFromCrawlRow(
  productId: string,
  row: EnrichedOutputRow
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { evidence: { select: { id: true } }, brand: { select: { slug: true } } },
  });
  if (!product) return;

  const isProductPage =
    row.url_kind === "OFFICIAL_PRODUCT_PAGE" ||
    row.url_kind === "RETAILER_PRODUCT_PAGE" ||
    row.url_kind === "MARKETPLACE_PRODUCT_PAGE";

  const name = row.extracted_product_name?.trim() || product.name;
  const formFromExtract = toForm(row.form);
  const form = formFromExtract !== "OTHER" ? formFromExtract : inferFormFromTitle(name) ?? "OTHER";
  const ingredientText = row.ingredients_text?.trim() || product.ingredientText || "";
  const manufacturingClaimText = row.manufacturing_claim?.trim() || null;
  const coaUrl = row.coa_url?.trim() || null;
  const coaStatus = toCoaStatus(!!coaUrl);
  const manufacturingClarity = manufacturingClaimText ? "CLEAR" : product.manufacturingClarity;
  const netQuantityText = row.net_quantity?.trim() || product.netQuantityText;
  const gtin = row.gtin?.trim() || product.gtin;

  const updateData: Parameters<typeof prisma.product.update>[0]["data"] = {
    name,
    form,
    ingredientText: ingredientText || product.ingredientText,
    manufacturingClaimText: manufacturingClaimText ?? product.manufacturingClaimText,
    manufacturingClarity,
    coaStatus,
    coaUrl: coaUrl ?? product.coaUrl,
    netQuantityText: netQuantityText ?? product.netQuantityText,
    gtin: gtin ?? product.gtin,
  };

  if (isProductPage && row.canonicalized_url) {
    updateData.officialCanonicalUrl = row.canonicalized_url;
  }

  await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  if (coaUrl) {
    const existingCoa = await prisma.evidence.findFirst({
      where: { productId, type: "COA", url: coaUrl },
      select: { id: true },
    });
    if (!existingCoa) {
      await prisma.evidence.create({
        data: { productId, type: "COA", url: coaUrl },
      });
    }
  }

  const updated = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      evidence: { select: { id: true } },
      brand: { select: { slug: true } },
    },
  });
  if (!updated) return;

  const transparency = computeTransparencyGrade(
    {
      form: updated.form,
      ingredientText: updated.ingredientText,
      ingredientsNormalized: updated.ingredientsNormalized,
      manufacturingClarity: updated.manufacturingClarity,
      coaStatus: updated.coaStatus,
    },
    { count: updated.evidence.length }
  );
  const quality = computeQualityTier(
    {
      form: updated.form,
      ingredientText: updated.ingredientText,
      ingredientsNormalized: updated.ingredientsNormalized,
      manufacturingClarity: updated.manufacturingClarity,
      coaStatus: updated.coaStatus,
      brandSlug: updated.brand.slug,
      hasOfficialLabels: updated.evidence.length >= 2 || !!updated.sourceDsldLabelId,
    },
    transparency
  );
  await prisma.product.update({
    where: { id: productId },
    data: { transparencyGrade: transparency.grade, qualityTier: quality.tier },
  });
}
