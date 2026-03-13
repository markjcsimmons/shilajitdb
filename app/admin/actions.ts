"use server";

import { prisma } from "@/lib/db";
import { computeOverallGrade, computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { isAdminAuthed } from "@/lib/admin-auth";
import { cancelIngestionRun } from "@/lib/ingestion/cancelIngestionRun";
import { isPidAlive } from "@/lib/ingestion/pid";
import { cancelJobRun } from "@/lib/jobs/cancelJobRun";
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
    include: {
      evidence: { select: { id: true } },
      brand: { select: { slug: true } },
    },
  });
  if (!p) return;
  const transparency = computeTransparencyGrade(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus,
    },
    { count: p.evidence.length }
  );
  const hasCoa = p.coaStatus === "PUBLIC" || p.coaStatus === "REQUEST_ONLY";
  const hasOfficialLabels =
    p.evidence.length >= 2 ||
    !!p.sourceDsldLabelId ||
    (p.evidence.length >= 1 && hasCoa);
  const quality = computeQualityTier(
    {
      form: p.form,
      ingredientText: p.ingredientText,
      ingredientsNormalized: p.ingredientsNormalized,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus,
      brandSlug: p.brand.slug,
      hasOfficialLabels,
    },
    transparency
  );
  const overallGrade = computeOverallGrade({
    form: p.form,
    ingredientText: p.ingredientText,
    ingredientsNormalized: p.ingredientsNormalized ?? [],
    manufacturingCountryClaim: p.manufacturingCountryClaim,
    coaStatus: p.coaStatus,
    brandSlug: p.brand.slug,
  });
  await prisma.product.update({
    where: { id: p.id },
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
    thirdPartyTestingLab: formData.get("thirdPartyTestingLab"),
    hasPatentClaim: formData.get("hasPatentClaim"),
    officialCanonicalUrl: formData.get("officialCanonicalUrl"),
    lastVerifiedAt: formData.get("lastVerifiedAt"),
  });
  if (!parsed.success) redirect(`/admin/products${id ? `/${id}` : "/new"}?error=validation`);

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
    thirdPartyTestingLab: parsed.data.thirdPartyTestingLab?.trim() || null,
    hasPatentClaim: parsed.data.hasPatentClaim,
    officialCanonicalUrl,
    officialDomain,
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

/** Cancel a running ingestion or job run. Form fields: runId, kind (ingestion | job_run), next (redirect path). */
export async function cancelRunAction(formData: FormData) {
  await requireAdmin();
  const runId = String(formData.get("runId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim();
  const nextUrl = String(formData.get("next") ?? "").trim();
  const redirectTo = nextUrl && nextUrl.startsWith("/admin") ? nextUrl : "/admin/populate";

  if (!runId) redirect(`${redirectTo}?error=cancel_no_run_id`);
  if (kind !== "ingestion" && kind !== "job_run") redirect(`${redirectTo}?error=cancel_invalid_kind`);

  try {
    if (kind === "ingestion") {
      await cancelIngestionRun(runId);
      redirect(`${redirectTo}?ran=canceled_ingestion`);
    }
    await cancelJobRun(runId);
    redirect(`${redirectTo}?ran=canceled_job`);
  } catch (e) {
    // Next.js redirect() throws; don't treat it as a failure
    const err = e as { digest?: string };
    if (typeof err?.digest === "string" && err.digest.includes("NEXT_REDIRECT")) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    redirect(`${redirectTo}?error=${encodeURIComponent(`cancel_failed: ${msg}`)}`);
  }
}

/** Mark all stale RUNNING runs (process dead or no pid and >10 min) as FAILED. Form field: next (redirect path). */
export async function clearStaleRunsAction(formData: FormData) {
  await requireAdmin();
  const nextUrl = String(formData.get("next") ?? "").trim();
  const redirectTo = nextUrl && nextUrl.startsWith("/admin") ? nextUrl : "/admin/populate";

  const STALE_MS = 10 * 60 * 1000;
  let cleared = 0;

  const jobRuns = await prisma.jobRun.findMany({
    where: { status: "RUNNING" },
    select: { id: true, pid: true, startedAt: true },
  });
  for (const r of jobRuns) {
    const ageMs = Date.now() - new Date(r.startedAt).getTime();
    const stale =
      (typeof r.pid === "number" && !isPidAlive(r.pid)) || (r.pid == null && ageMs > STALE_MS);
    if (stale) {
      await prisma.jobRun.updateMany({
        where: { id: r.id, status: "RUNNING" },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorText: r.pid == null
            ? "Marked failed (stale run: no process id after 10+ min)."
            : `Marked failed (stale run: process ${r.pid} no longer running).`,
        },
      });
      cleared++;
    }
  }

  const ingestionRuns = await prisma.ingestionRun.findMany({
    where: { status: "RUNNING" },
    select: { id: true, pid: true, startedAt: true },
  });
  for (const r of ingestionRuns) {
    const ageMs = Date.now() - new Date(r.startedAt).getTime();
    const stale =
      (typeof r.pid === "number" && !isPidAlive(r.pid)) || (r.pid == null && ageMs > STALE_MS);
    if (stale) {
      await prisma.ingestionRun.updateMany({
        where: { id: r.id, status: "RUNNING" },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          errorText: r.pid == null
            ? "Marked failed (stale run: no process id after 10+ min)."
            : `Marked failed (stale run: process ${r.pid} no longer running).`,
        },
      });
      cleared++;
    }
  }

  redirect(`${redirectTo}?ran=stale_cleared&count=${cleared}`);
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

/** Import CSV (BRAND, BRAND URL, PRODUCT 1, PRODUCT 2, …). Form field: file (File). */
export async function importCsvAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/populate?error=No+CSV+file+provided");
  }
  const { importBrandProductCsv } = await import("@/lib/importBrandProductCsv");
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await importBrandProductCsv(buf);
  if (result.errors.length > 0) {
    redirect(`/admin/populate?error=${encodeURIComponent(result.errors.slice(0, 3).join("; "))}`);
  }
  const msg = [
    result.brandsCreated && `${result.brandsCreated} brands created`,
    result.brandsUpdated && `${result.brandsUpdated} brands updated`,
    result.productsCreated && `${result.productsCreated} products created`,
    result.productsSkipped && `${result.productsSkipped} products skipped (already exist)`,
  ]
    .filter(Boolean)
    .join(", ");
  redirect(`/admin/populate?ran=import&imported=${encodeURIComponent(msg || "Done")}`);
}

