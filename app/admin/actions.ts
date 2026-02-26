"use server";

import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { isAdminAuthed } from "@/lib/admin-auth";
import { BrandInputSchema, EvidenceInputSchema, parseCsvList, ProductInputSchema } from "@/lib/admin-validators";
import { slugify } from "@/lib/slug";
import { deriveWebsiteDomain } from "@/lib/url";
import { redirect } from "next/navigation";

async function requireAdmin() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

function toDateOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function adminUpsertBrand(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const parsed = BrandInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    website: formData.get("website"),
    description: formData.get("description"),
  });
  if (!parsed.success) redirect(`/admin/brands${id ? `/${id}` : "/new"}?error=validation`);

  const slug = parsed.data.slug?.trim() ? parsed.data.slug.trim() : slugify(parsed.data.name);
  const data = {
    name: parsed.data.name,
    slug,
    website: parsed.data.website?.trim() || null,
    websiteDomain: deriveWebsiteDomain(parsed.data.website?.trim() || null),
    description: parsed.data.description?.trim() || null,
  };

  try {
    const brand = id
      ? await prisma.brand.update({ where: { id }, data, select: { id: true } })
      : await prisma.brand.create({ data, select: { id: true } });
    redirect(`/admin/brands/${brand.id}?saved=1`);
  } catch {
    redirect(`/admin/brands${id ? `/${id}` : "/new"}?error=unique`);
  }
}

export async function adminDeleteBrand(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/brands");
  await prisma.brand.delete({ where: { id } });
  redirect("/admin/brands?deleted=1");
}

async function recomputeAndSaveProductGrades(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: { evidence: { select: { id: true } } },
  });
  if (!p) return;
  const transparency = computeTransparencyGrade(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingClarity: p.manufacturingClarity,
      coaStatus: p.coaStatus,
    },
    { count: p.evidence.length }
  );
  const quality = computeQualityTier(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingClarity: p.manufacturingClarity,
      coaStatus: p.coaStatus,
    },
    transparency
  );
  await prisma.product.update({
    where: { id: p.id },
    data: {
      transparencyGrade: transparency.grade,
      qualityTier: quality.tier,
    },
  });
}

export async function adminUpsertProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const parsed = ProductInputSchema.safeParse({
    brandId: formData.get("brandId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    form: formData.get("form"),
    ingredientText: formData.get("ingredientText"),
    ingredientsNormalizedCsv: formData.get("ingredientsNormalizedCsv"),
    manufacturingCountryClaim: formData.get("manufacturingCountryClaim"),
    manufacturingClarity: formData.get("manufacturingClarity"),
    manufacturingClaimText: formData.get("manufacturingClaimText"),
    manufacturingEvidenceUrl: formData.get("manufacturingEvidenceUrl"),
    coaStatus: formData.get("coaStatus"),
    coaUrl: formData.get("coaUrl"),
    lastVerifiedAt: formData.get("lastVerifiedAt"),
  });
  if (!parsed.success) redirect(`/admin/products${id ? `/${id}` : "/new"}?error=validation`);

  const slug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugify(parsed.data.name);

  const ingredientsNormalized = parseCsvList(parsed.data.ingredientsNormalizedCsv);

  const baseData = {
    brandId: parsed.data.brandId,
    name: parsed.data.name,
    slug,
    form: parsed.data.form,
    ingredientText: parsed.data.ingredientText,
    ingredientsNormalized,
    manufacturingCountryClaim: parsed.data.manufacturingCountryClaim?.trim() || null,
    manufacturingClarity: parsed.data.manufacturingClarity,
    manufacturingClaimText: parsed.data.manufacturingClaimText?.trim() || null,
    manufacturingEvidenceUrl: parsed.data.manufacturingEvidenceUrl?.trim() || null,
    coaStatus: parsed.data.coaStatus,
    coaUrl: parsed.data.coaUrl?.trim() || null,
    lastVerifiedAt: toDateOrNull(parsed.data.lastVerifiedAt ?? ""),
  } as const;

  try {
    const product = id
      ? await prisma.product.update({
          where: { id },
          data: baseData,
          select: { id: true },
        })
      : await prisma.product.create({
          data: {
            ...baseData,
            transparencyGrade: "F",
            qualityTier: "POOR",
          },
          select: { id: true },
        });

    await recomputeAndSaveProductGrades(product.id);
    redirect(`/admin/products/${product.id}?saved=1`);
  } catch {
    redirect(`/admin/products${id ? `/${id}` : "/new"}?error=unique`);
  }
}

export async function adminDeleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/products");
  await prisma.product.delete({ where: { id } });
  redirect("/admin/products?deleted=1");
}

export async function adminAddEvidence(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  const parsed = EvidenceInputSchema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    quote: formData.get("quote"),
  });
  if (!productId || !parsed.success) redirect(`/admin/products/${productId}?error=evidence`);

  await prisma.evidence.create({
    data: {
      productId,
      type: parsed.data.type,
      url: parsed.data.url,
      quote: parsed.data.quote?.trim() || null,
    },
  });
  await recomputeAndSaveProductGrades(productId);
  redirect(`/admin/products/${productId}?saved=1#evidence`);
}

export async function adminDeleteEvidence(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  const evidenceId = String(formData.get("evidenceId") ?? "").trim();
  if (!productId || !evidenceId) redirect(`/admin/products/${productId}`);

  await prisma.evidence.delete({ where: { id: evidenceId } });
  await recomputeAndSaveProductGrades(productId);
  redirect(`/admin/products/${productId}?saved=1#evidence`);
}

export async function adminRecomputeGrades(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) redirect("/admin/products");
  await recomputeAndSaveProductGrades(productId);
  redirect(`/admin/products/${productId}?recomputed=1`);
}

