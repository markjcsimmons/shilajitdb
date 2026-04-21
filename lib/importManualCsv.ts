import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { deriveWebsiteDomain } from "@/lib/url";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";
import {
  computeTransparencyGrade,
  computeQualityTier,
  computeOverallGrade,
} from "@/lib/grading";
import type { CoaStatus, ListingSource, ProductForm } from "@prisma/client";

export type ImportManualCsvResult = {
  brandsCreated: number;
  brandsUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  listingsCreated: number;
  listingsUpdated: number;
  errors: string[];
};

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 10) return false;
  if (/^n\/?a$/i.test(t) || /^none$/i.test(t) || /^not\s/i.test(t)) return false;
  return t.startsWith("http://") || t.startsWith("https://");
}

function mapForm(raw: string): ProductForm {
  const s = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const valid: ProductForm[] = ["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "TABLETS", "HONEY_STICKS", "OTHER"];
  return valid.includes(s as ProductForm) ? (s as ProductForm) : "OTHER";
}

function mapCoaStatus(raw: string): CoaStatus {
  const s = raw.trim().toUpperCase();
  if (s === "PUBLIC") return "PUBLIC";
  if (s === "REQUEST_ONLY") return "REQUEST_ONLY";
  if (s === "NONE") return "NONE";
  return "UNKNOWN";
}

function parseVerifiedDate(raw: string): Date | null {
  const m = (raw ?? "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
}

function classifyUrl(url: string): ListingSource {
  const lower = url.toLowerCase();
  if (lower.includes("amazon.com") || lower.includes("amzn.com")) return "AMAZON";
  if (lower.includes("walmart.com")) return "WALMART";
  if (lower.includes("iherb.com")) return "IHERB";
  return "OFFICIAL";
}

function canonicalAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}`;
}

function extractAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function cleanAsin(raw: string): string | null {
  // Strip invisible chars (e.g. U+200E left-to-right mark), keep alphanumeric only
  const cleaned = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return cleaned.length === 10 ? cleaned : null;
}

export async function importManualCsv(csvBuffer: Buffer): Promise<ImportManualCsvResult> {
  const result: ImportManualCsvResult = {
    brandsCreated: 0,
    brandsUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsSkipped: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    errors: [],
  };

  let rows: Record<string, string>[];
  try {
    rows = parse(csvBuffer.toString("utf8"), {
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

  if (!Object.prototype.hasOwnProperty.call(rows[0], "brand_name")) {
    result.errors.push("CSV must have a brand_name column");
    return result;
  }

  const brandCache = new Map<string, string>(); // slug → id

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const brandNameRaw = (r.brand_name ?? "").trim();
    const productNameRaw = (r.product_name ?? "").trim();

    // Skip comment lines
    if (brandNameRaw.startsWith("#")) continue;

    if (!brandNameRaw) {
      result.errors.push(`Row ${rowNum}: empty brand_name`);
      continue;
    }
    if (!productNameRaw) {
      result.errors.push(`Row ${rowNum}: empty product_name`);
      continue;
    }

    // Parse fields
    const form = mapForm(r.form ?? "");
    const countryRaw = (r.country_of_manufacture ?? "").trim();
    const countryOfManufacture = /not\s*specified/i.test(countryRaw) ? null : countryRaw || null;
    const coaStatus = mapCoaStatus(r.coa_status ?? "");
    const coaUrlRaw = (r.coa_url ?? "").trim();
    const coaUrl = looksLikeUrl(coaUrlRaw) ? coaUrlRaw : null;
    const labRaw = (r.third_party_lab ?? "").trim();
    const thirdPartyLab = /^n\/?a$/i.test(labRaw) ? null : labRaw || null;
    const hasPatentClaim = (r.has_patent_claim ?? "").trim().toUpperCase() === "YES";
    const gmpCertified = (r.gmp_certified ?? "").trim().toUpperCase() === "YES";
    const sourceRegion = (r.source_region ?? "").trim() || null;
    const metaDescription = (r.meta_description ?? "").trim().slice(0, 160) || null;
    const officialUrlRaw = (r.official_url ?? "").trim();
    const amazonAsinRaw = (r.amazon_asin ?? "").trim();
    const lastVerifiedAt = parseVerifiedDate(r.last_verified_date ?? "");
    const bbbGradeRaw = (r.bbb_grade ?? "").trim();

    // Price: stored in cents on the listing
    const priceRaw = parseFloat((r.price ?? "").replace(/[^0-9.]/g, ""));
    const priceCents = Number.isFinite(priceRaw) && priceRaw > 0 ? Math.round(priceRaw * 100) : null;

    // Classify official_url
    const officialUrlSource = looksLikeUrl(officialUrlRaw) ? classifyUrl(officialUrlRaw) : null;
    let officialCanonicalUrl: string | null = null;
    let officialDomain: string | null = null;

    if (officialUrlSource === "OFFICIAL") {
      try {
        officialCanonicalUrl = canonicalizeUrl(officialUrlRaw);
        officialDomain = extractDomain(officialUrlRaw);
      } catch {
        result.errors.push(`Row ${rowNum}: invalid official_url`);
      }
    }

    // Brand upsert
    const brandSlug = slugify(brandNameRaw) || `brand-${i}`;
    let brandId = brandCache.get(brandSlug);

    if (!brandId) {
      const brandWebsite = officialDomain ? `https://${officialDomain}` : null;
      const brandWebsiteDomain = officialDomain ? deriveWebsiteDomain(officialUrlRaw) : null;

      try {
        // Check by name first (name has a unique constraint) to avoid conflicts
        const existingByName = await prisma.brand.findFirst({
          where: { OR: [{ slug: brandSlug }, { name: brandNameRaw }] },
          select: { id: true, slug: true },
        });

        let brand: { id: string };
        if (existingByName) {
          // Update website if we have one, reuse the existing brand
          if (brandWebsite) {
            brand = await prisma.brand.update({
              where: { id: existingByName.id },
              data: { website: brandWebsite, websiteDomain: brandWebsiteDomain },
              select: { id: true },
            });
          } else {
            brand = existingByName;
          }
          brandCache.set(existingByName.slug, brand.id);
          result.brandsUpdated++;
        } else {
          brand = await prisma.brand.create({
            data: {
              name: brandNameRaw,
              slug: brandSlug,
              website: brandWebsite,
              websiteDomain: brandWebsiteDomain,
            },
            select: { id: true },
          });
          result.brandsCreated++;
        }
        brandId = brand.id;
        brandCache.set(brandSlug, brandId);
      } catch (err) {
        result.errors.push(`Row ${rowNum}: brand upsert failed — ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    const productForGrading = {
      form,
      manufacturingCountryClaim: countryOfManufacture,
      coaStatus,
      thirdPartyTestingLab: thirdPartyLab,
      gmpCertified,
      hasPatentClaim,
      brandSlug,
    };

    const transparencyResult = computeTransparencyGrade(productForGrading);
    const qualityResult = computeQualityTier(productForGrading);
    const overallGrade = computeOverallGrade(productForGrading);

    const productData = {
      brandId,
      name: productNameRaw,
      form,
      manufacturingCountryClaim: countryOfManufacture,
      coaStatus,
      coaUrl,
      thirdPartyTestingLab: thirdPartyLab,
      hasPatentClaim,
      gmpCertified,
      sourceRegion,
      metaDescription,
      officialCanonicalUrl,
      officialDomain,
      lastVerifiedAt,
      transparencyGrade: transparencyResult.grade,
      qualityTier: qualityResult.tier,
      overallGrade,
      dataCompleteness: "HIGH" as const,
      isCanonical: true,
    };

    // Check if product already exists (by officialCanonicalUrl or slug)
    let product: { id: string };
    const existingByUrl = officialCanonicalUrl
      ? await prisma.product.findFirst({ where: { officialCanonicalUrl }, select: { id: true } })
      : null;

    if (existingByUrl) {
      // Update existing product with latest data from CSV
      try {
        product = await prisma.product.update({
          where: { id: existingByUrl.id },
          data: productData,
          select: { id: true },
        });
        result.productsUpdated++;
      } catch (err) {
        result.errors.push(`Row ${rowNum}: product update failed — ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    } else {
      // Create new product — resolve unique slug first
      const baseSlug = slugify(`${brandSlug}-${productNameRaw}`).slice(0, 96);
      let productSlug = baseSlug;
      const existingBySlug = await prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
      if (existingBySlug) {
        let found = false;
        for (let n = 2; n <= 9; n++) {
          const candidate = `${baseSlug}-${n}`;
          const ex = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
          if (!ex) { productSlug = candidate; found = true; break; }
        }
        if (!found) {
          result.errors.push(`Row ${rowNum}: could not find unique slug for "${productNameRaw}"`);
          continue;
        }
      }

      try {
        product = await prisma.product.create({
          data: { ...productData, slug: productSlug, ingredientText: "", ingredientsNormalized: [] },
          select: { id: true },
        });
        result.productsCreated++;
      } catch (err) {
        result.errors.push(`Row ${rowNum}: product create failed — ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    // Evidence
    try {
      if (coaUrl) {
        await prisma.evidence.create({
          data: { productId: product.id, type: "COA", url: coaUrl, sourceName: thirdPartyLab ?? undefined },
        });
      }
      if (looksLikeUrl(bbbGradeRaw)) {
        await prisma.evidence.create({
          data: { productId: product.id, type: "OTHER", url: bbbGradeRaw, sourceName: "BBB" },
        });
      }
    } catch (err) {
      result.errors.push(`Row ${rowNum}: evidence create failed — ${err instanceof Error ? err.message : String(err)}`);
    }

    // Collect listings to create (deduplicate by URL)
    const listingsToCreate: Array<{ source: ListingSource; url: string; observedSku?: string }> = [];

    if (looksLikeUrl(officialUrlRaw)) {
      if (officialUrlSource === "OFFICIAL" && officialCanonicalUrl) {
        listingsToCreate.push({ source: "OFFICIAL", url: officialCanonicalUrl });
      } else if (officialUrlSource === "AMAZON") {
        const asinFromUrl = extractAsin(officialUrlRaw);
        const url = asinFromUrl ? canonicalAmazonUrl(asinFromUrl) : canonicalizeUrl(officialUrlRaw);
        listingsToCreate.push({ source: "AMAZON", url, observedSku: asinFromUrl ?? undefined });
      } else if (officialUrlSource) {
        try {
          listingsToCreate.push({ source: officialUrlSource, url: canonicalizeUrl(officialUrlRaw) });
        } catch { /* ignore */ }
      }
    }

    // Amazon ASIN listing
    const asin = cleanAsin(amazonAsinRaw);
    if (asin) {
      const url = canonicalAmazonUrl(asin);
      if (!listingsToCreate.some((l) => l.url === url)) {
        listingsToCreate.push({ source: "AMAZON", url, observedSku: asin });
      }
    }

    for (const listing of listingsToCreate) {
      try {
        const existing = await prisma.listing.findUnique({
          where: { url: listing.url },
          select: { id: true },
        });
        if (existing) {
          // Update price if we now have it
          if (priceCents !== null) {
            await prisma.listing.update({
              where: { id: existing.id },
              data: { priceCents, currency: "USD", status: "ACTIVE" },
            });
            result.listingsUpdated++;
          }
        } else {
          await prisma.listing.create({
            data: {
              productId: product.id,
              source: listing.source,
              url: listing.url,
              observedSku: listing.observedSku,
              priceCents,
              currency: priceCents ? "USD" : null,
              status: "ACTIVE",
            },
          });
          result.listingsCreated++;
        }
      } catch (err) {
        result.errors.push(`Row ${rowNum}: listing upsert failed (${listing.url}) — ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return result;
}
