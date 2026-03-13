import type { ProductForm, CoaStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
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
  const netQuantityText = row.net_quantity?.trim() || product.netQuantityText;
  const desiredGtin = row.gtin?.trim() || product.gtin;

  // Only set gtin if it won't violate unique (another product may already have this gtin)
  let gtinToSet: string | null = desiredGtin ?? product.gtin;
  if (gtinToSet) {
    const other = await prisma.product.findFirst({
      where: { gtin: gtinToSet, id: { not: productId } },
      select: { id: true },
    });
    if (other) gtinToSet = product.gtin; // leave unchanged to avoid unique constraint
  }

  const updateData: Parameters<typeof prisma.product.update>[0]["data"] = {
    name,
    form,
    ingredientText: ingredientText || product.ingredientText,
    manufacturingClaimText: manufacturingClaimText ?? product.manufacturingClaimText,
    coaStatus,
    coaUrl: coaUrl ?? product.coaUrl,
    netQuantityText: netQuantityText ?? product.netQuantityText,
    gtin: gtinToSet ?? undefined,
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
      manufacturingCountryClaim: updated.manufacturingCountryClaim,
      coaStatus: updated.coaStatus,
    },
    { count: updated.evidence.length }
  );
  const hasCoa = updated.coaStatus === "PUBLIC" || updated.coaStatus === "REQUEST_ONLY";
  const hasOfficialLabels =
    updated.evidence.length >= 2 ||
    !!updated.sourceDsldLabelId ||
    (updated.evidence.length >= 1 && hasCoa);
  const quality = computeQualityTier(
    {
      form: updated.form,
      ingredientText: updated.ingredientText,
      ingredientsNormalized: updated.ingredientsNormalized,
      manufacturingCountryClaim: updated.manufacturingCountryClaim,
      coaStatus: updated.coaStatus,
      brandSlug: updated.brand.slug,
      hasOfficialLabels,
    },
    transparency
  );
  const overallGrade = computeOverallGrade({
    form: updated.form,
    ingredientText: updated.ingredientText,
    ingredientsNormalized: updated.ingredientsNormalized ?? [],
    manufacturingCountryClaim: updated.manufacturingCountryClaim,
    coaStatus: updated.coaStatus,
    brandSlug: updated.brand.slug,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      transparencyGrade: transparency.grade,
      qualityTier: quality.tier,
      overallGrade,
    },
  });
}
