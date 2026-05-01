"use server";

import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { isAdminAuthed } from "@/lib/admin-auth";
import { BrandInputSchema, EvidenceInputSchema, parseCsvList, ProductInputSchema } from "@/lib/admin-validators";
import { slugify } from "@/lib/slug";
import { deriveWebsiteDomain } from "@/lib/url";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";
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
    select: {
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      brand: { select: { slug: true } },
    },
  });
  if (!p) return;

  const productForGrading = {
    form: p.form,
    coaStatus: p.coaStatus,
    manufacturingCountryClaim: p.manufacturingCountryClaim,
    thirdPartyTestingLab: p.thirdPartyTestingLab,
    gmpCertified: p.gmpCertified,
    hasPatentClaim: p.hasPatentClaim,
    brandSlug: p.brand.slug,
  };

  const transparency = computeTransparencyGrade(productForGrading);
  const quality = computeQualityTier(productForGrading);
  const overallGrade = computeOverallGrade(productForGrading);

  await prisma.product.update({
    where: { id: productId },
    data: {
      transparencyGrade: transparency.grade,
      qualityTier: quality.tier,
      overallGrade,
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
    gtin: formData.get("gtin"),
    mpn: formData.get("mpn"),
    brandSku: formData.get("brandSku"),
    netQuantityText: formData.get("netQuantityText"),
    servingsCount: formData.get("servingsCount"),
    capsuleCount: formData.get("capsuleCount"),
    flavor: formData.get("flavor"),
    ingredientText: formData.get("ingredientText"),
    ingredientsNormalizedCsv: formData.get("ingredientsNormalizedCsv"),
    manufacturingCountryClaim: formData.get("manufacturingCountryClaim"),
    manufacturingClaimText: formData.get("manufacturingClaimText"),
    manufacturingEvidenceUrl: formData.get("manufacturingEvidenceUrl"),
    coaStatus: formData.get("coaStatus"),
    coaUrl: formData.get("coaUrl"),
    coaNotes: formData.get("coaNotes"),
    thirdPartyTestingLab: formData.get("thirdPartyTestingLab"),
    hasPatentClaim: formData.get("hasPatentClaim"),
    officialCanonicalUrl: formData.get("officialCanonicalUrl"),
    lastVerifiedAt: formData.get("lastVerifiedAt"),
    metaDescription: formData.get("metaDescription"),
    heavyMetalsTested: formData.get("heavyMetalsTested"),
    gmpCertified: formData.get("gmpCertified"),
    pricePerGramCents: formData.get("pricePerGramCents"),
    pricePerServingCents: formData.get("pricePerServingCents"),
  });
  if (!parsed.success) {
    const metaIssue = parsed.error.issues.find((i) => i.path.includes("metaDescription"));
    const q = new URLSearchParams({ error: "validation" });
    if (metaIssue?.message) q.set("meta_error", metaIssue.message);
    redirect(`/admin/products${id ? `/${id}` : "/new"}?${q.toString()}`);
  }

  // When editing a product, brand name is editable; persist to brand database
  const brandNameRaw = String(formData.get("brandName") ?? "").trim();
  if (brandNameRaw.length >= 2 && brandNameRaw.length <= 120) {
    const brand = await prisma.brand.findUnique({
      where: { id: parsed.data.brandId },
      select: { name: true },
    });
    if (brand && brand.name !== brandNameRaw) {
      await prisma.brand.update({
        where: { id: parsed.data.brandId },
        data: { name: brandNameRaw },
      });
    }
  }

  const rawOfficialUrl = (parsed.data.officialCanonicalUrl ?? "").trim();
  let officialCanonicalUrl: string | null = null;
  let officialDomain: string | null = null;
  if (rawOfficialUrl) {
    try {
      officialCanonicalUrl = canonicalizeUrl(rawOfficialUrl);
      officialDomain = extractDomain(rawOfficialUrl);
    } catch {
      redirect(`/admin/products${id ? `/${id}` : "/new"}?error=validation`);
    }
  }

  let slug = parsed.data.slug?.trim()
    ? parsed.data.slug.trim()
    : slugify(parsed.data.name);

  let currentSlug: string | null = null;
  let currentOfficialUrl: string | null = null;
  if (id) {
    const current = await prisma.product.findUnique({
      where: { id },
      select: { slug: true, officialCanonicalUrl: true },
    });
    if (current) {
      currentSlug = current.slug;
      currentOfficialUrl = current.officialCanonicalUrl;
      if (!parsed.data.slug?.trim()) slug = current.slug; // keep existing when form slug empty
    }
  }

  // Slug must be unique. On update, skip check when slug is unchanged so we don't fail on "re-save"
  const slugChanged = !id || slug !== currentSlug;
  if (slugChanged) {
    const existingWithSlug = await prisma.product.findFirst({
      where: { slug, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
    if (existingWithSlug) redirect(`/admin/products${id ? `/${id}` : "/new"}?error=unique`);
  }

  // Official URL must be unique when set. Skip check when unchanged on update.
  const officialUrlChanged = officialCanonicalUrl !== currentOfficialUrl;
  if (officialCanonicalUrl && officialUrlChanged) {
    const existingWithUrl = await prisma.product.findFirst({
      where: { officialCanonicalUrl, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
    if (existingWithUrl) redirect(`/admin/products${id ? `/${id}` : "/new"}?error=unique`);
  }

  const ingredientsNormalized = parseCsvList(parsed.data.ingredientsNormalizedCsv);

  const baseData = {
    brand: { connect: { id: parsed.data.brandId } },
    name: parsed.data.name,
    slug,
    form: parsed.data.form,
    gtin: parsed.data.gtin?.trim() || null,
    mpn: parsed.data.mpn?.trim() || null,
    brandSku: parsed.data.brandSku?.trim() || null,
    netQuantityText: parsed.data.netQuantityText?.trim() || null,
    servingsCount: parsed.data.servingsCount ?? null,
    capsuleCount: parsed.data.capsuleCount ?? null,
    flavor: parsed.data.flavor?.trim() || null,
    ingredientText: parsed.data.ingredientText ?? "",
    ingredientsNormalized,
    manufacturingCountryClaim: parsed.data.manufacturingCountryClaim?.trim() || null,
    manufacturingClaimText: parsed.data.manufacturingClaimText?.trim() || null,
    manufacturingEvidenceUrl: parsed.data.manufacturingEvidenceUrl?.trim() || null,
    coaStatus: parsed.data.coaStatus,
    coaUrl: parsed.data.coaUrl?.trim() || null,
    coaNotes: parsed.data.coaNotes?.trim() || null,
    thirdPartyTestingLab: parsed.data.thirdPartyTestingLab?.trim() || null,
    hasPatentClaim: parsed.data.hasPatentClaim,
    gmpCertified: parsed.data.gmpCertified === "yes",
    heavyMetalsTested: (parsed.data.heavyMetalsTested || null) as "CONFIRMED" | "CLAIMED" | "NONE" | null,
    pricePerServingCents: parsed.data.pricePerServingCents ?? null,
    pricePerGramCents: parsed.data.pricePerGramCents ?? null,
    officialCanonicalUrl,
    officialDomain,
    lastVerifiedAt: toDateOrNull(parsed.data.lastVerifiedAt ?? ""),
    metaDescription: parsed.data.metaDescription?.trim() || null,
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
  } catch (err: unknown) {
    const isUniqueViolation =
      err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002";
    if (isUniqueViolation) redirect(`/admin/products${id ? `/${id}` : "/new"}?error=unique`);
    throw err;
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

export async function adminRecomputeAllGrades(formData: FormData) {
  await requireAdmin();

  // Fetch all products in one query
  const products = await prisma.product.findMany({
    select: {
      id: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      brand: { select: { slug: true } },
    },
  });

  // Compute all grades in memory
  const updates = products.map((p) => {
    const productForGrading = {
      form: p.form,
      coaStatus: p.coaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };
    return {
      id: p.id,
      transparencyGrade: computeTransparencyGrade(productForGrading).grade,
      qualityTier: computeQualityTier(productForGrading).tier,
      overallGrade: computeOverallGrade(productForGrading),
    };
  });

  // Batch all updates in a single transaction
  await prisma.$transaction(
    updates.map(({ id, transparencyGrade, qualityTier, overallGrade }) =>
      prisma.product.update({
        where: { id },
        data: { transparencyGrade, qualityTier, overallGrade },
      })
    )
  );

  redirect(`/admin?recomputedAll=${updates.length}`);
}

export async function adminPromoteToCanonical(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) redirect("/admin/products");
  await prisma.product.update({
    where: { id: productId },
    data: { isCanonical: true },
    select: { id: true },
  });
  redirect(`/admin/products/${productId}?promoted=1`);
}

export async function adminSetOfficialCanonicalUrl(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!productId || !listingId) redirect(`/admin/products/${productId}`);

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, productId, source: "OFFICIAL" },
    select: { url: true },
  });
  if (!listing) redirect(`/admin/products/${productId}?error=listing`);

  const officialCanonicalUrl = canonicalizeUrl(listing.url);
  const officialDomain = extractDomain(listing.url);

  // Ensure canonical URL is only assigned to ONE product: if another product already has it, do not overwrite.
  const existing = await prisma.product.findFirst({
    where: {
      officialCanonicalUrl,
      id: { not: productId },
    },
    select: { id: true, name: true, slug: true },
  });
  if (existing) {
    redirect(
      `/admin/products/${productId}?error=official_taken&otherId=${encodeURIComponent(existing.id)}&otherName=${encodeURIComponent(existing.name)}#listings`
    );
  }

  await prisma.product.update({
    where: { id: productId },
    data: { officialCanonicalUrl, officialDomain },
    select: { id: true },
  });
  redirect(`/admin/products/${productId}?saved=1#listings`);
}


/** Remove brands that have zero products (keeps DB shilajit-only). Form field: next (redirect path). */
export async function removeBrandsWithNoProductsAction(formData: FormData) {
  await requireAdmin();
  const nextUrl = String(formData.get("next") ?? "").trim();
  const redirectTo = nextUrl && nextUrl.startsWith("/admin") ? nextUrl : "/admin";

  const count = await prisma.brand.count({ where: { products: { none: {} } } });
  if (count > 0) {
    await prisma.brand.deleteMany({ where: { products: { none: {} } } });
  }
  redirect(`${redirectTo}?ran=brands_cleaned&removed=${count}`);
}

export async function adminAddEditorsPick(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) redirect("/admin/editors-picks?error=missing");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { bestForTags: true },
  });
  if (!product) redirect("/admin/editors-picks?error=notfound");

  if (!product.bestForTags.includes("editors_pick")) {
    await prisma.product.update({
      where: { id: productId },
      data: { bestForTags: { push: "editors_pick" } },
    });
  }
  redirect("/admin/editors-picks?saved=1");
}

export async function adminRemoveEditorsPick(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) redirect("/admin/editors-picks?error=missing");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { bestForTags: true },
  });
  if (!product) redirect("/admin/editors-picks?error=notfound");

  await prisma.product.update({
    where: { id: productId },
    data: { bestForTags: product.bestForTags.filter((t) => t !== "editors_pick") },
  });
  redirect("/admin/editors-picks?removed=1");
}


