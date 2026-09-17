import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { csvRow } from "@/lib/csv-utils";

export const dynamic = "force-dynamic";

const PRODUCT_CSV_HEADERS = [
  "product_id",
  "brand_id",
  "brand_name",
  "brand_slug",
  "brand_website",
  "product_name",
  "product_slug",
  "form",
  "ingredient_text",
  "ingredients_normalized",
  "manufacturing_country_claim",
  "manufacturing_claim_text",
  "manufacturing_evidence_url",
  "coa_status",
  "coa_url",
  "transparency_grade",
  "quality_tier",
  "last_verified_at",
  "is_canonical",
  "official_canonical_url",
  "official_domain",
  "gtin",
  "mpn",
  "brand_sku",
  "net_quantity_text",
  "servings_count",
  "capsule_count",
  "flavor",
  "data_completeness",
  "source_dsld_label_id",
  "source_dsld_url",
];

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  const rows: string[] = [csvRow(PRODUCT_CSV_HEADERS)];

  for (const p of products) {
    rows.push(
      csvRow([
        p.id,
        p.brandId,
        p.brand.name,
        p.brand.slug,
        p.brand.website ?? "",
        p.name,
        p.slug,
        p.form,
        p.ingredientText ?? "",
        (p.ingredientsNormalized ?? []).join("|"),
        p.manufacturingCountryClaim ?? "",
        p.manufacturingClaimText ?? "",
        p.manufacturingEvidenceUrl ?? "",
        p.coaStatus,
        p.coaUrl ?? "",
        p.transparencyGrade,
        p.qualityTier,
        p.lastVerifiedAt ? p.lastVerifiedAt.toISOString().slice(0, 10) : "",
        p.isCanonical ? "1" : "0",
        p.officialCanonicalUrl ?? "",
        p.officialDomain ?? "",
        p.gtin ?? "",
        p.mpn ?? "",
        p.brandSku ?? "",
        p.netQuantityText ?? "",
        p.servingsCount?.toString() ?? "",
        p.capsuleCount?.toString() ?? "",
        p.flavor ?? "",
        p.dataCompleteness,
        p.sourceDsldLabelId ?? "",
        p.sourceDsldUrl ?? "",
      ])
    );
  }

  const csv = rows.join("\n");
  const filename = `shilajit-db-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
