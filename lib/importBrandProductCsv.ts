import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { deriveWebsiteDomain } from "@/lib/url";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 10) return false;
  if (/no site found|no stie found|^no\s/i.test(t)) return false;
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  if (/^[a-z0-9][a-z0-9.-]*\.(com|in|ru|org|net|co|io)(\/|$)/i.test(t)) return true;
  return false;
}

function normalizeUrl(s: string): string {
  const t = s.trim();
  if (t.startsWith("http")) return t;
  return `https://${t}`;
}

export type ImportBrandProductResult = {
  brandsCreated: number;
  brandsUpdated: number;
  productsCreated: number;
  productsSkipped: number;
  errors: string[];
};

/**
 * Parse CSV with columns BRAND, BRAND URL, PRODUCT 1, PRODUCT 2, ...
 * Create/update brands and create products with officialCanonicalUrl set.
 * Does not crawl; products get minimal data until CRAWL runs.
 */
export async function importBrandProductCsv(csvBuffer: Buffer): Promise<ImportBrandProductResult> {
  const result: ImportBrandProductResult = {
    brandsCreated: 0,
    brandsUpdated: 0,
    productsCreated: 0,
    productsSkipped: 0,
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

  const first = rows[0];
  if (!("BRAND" in first)) {
    result.errors.push("CSV must have a BRAND column");
    return result;
  }

  const productColumns = Object.keys(first).filter(
    (k) => k !== "BRAND" && k !== "BRAND URL" && k.toUpperCase().startsWith("PRODUCT")
  );

  const seenBrandSlug = new Map<string, { id: string; seen: boolean }>();
  for (const b of await prisma.brand.findMany({ select: { id: true, slug: true } })) {
    seenBrandSlug.set(b.slug, { id: b.id, seen: false });
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const brandNameRaw = String(r.BRAND ?? "").trim();
    if (!brandNameRaw) {
      result.errors.push(`Row ${i + 2}: empty BRAND`);
      continue;
    }

    const brandSlug = slugify(brandNameRaw) || `brand-${i}`;
    const brandWebsiteRaw = String(r["BRAND URL"] ?? "").trim();
    const brandWebsite = looksLikeUrl(brandWebsiteRaw) ? normalizeUrl(brandWebsiteRaw) : null;

    let brandId = seenBrandSlug.get(brandSlug)?.id;
    if (!brandId) {
      const existing = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true },
      });
      if (existing) {
        brandId = existing.id;
        seenBrandSlug.set(brandSlug, { id: brandId, seen: false });
      } else {
        const brand = await prisma.brand.create({
          data: {
            name: brandNameRaw,
            slug: brandSlug,
            website: brandWebsite,
            websiteDomain: deriveWebsiteDomain(brandWebsite),
          },
          select: { id: true },
        });
        brandId = brand.id;
        seenBrandSlug.set(brandSlug, { id: brandId, seen: true });
        result.brandsCreated++;
      }
    } else {
      const entry = seenBrandSlug.get(brandSlug)!;
      if (!entry.seen) {
        await prisma.brand.update({
          where: { id: brandId },
          data: {
            name: brandNameRaw,
            website: brandWebsite,
            websiteDomain: deriveWebsiteDomain(brandWebsite),
          },
        });
        entry.seen = true;
        result.brandsUpdated++;
      }
    }

    let productIndex = 0;
    for (const col of productColumns) {
      const urlRaw = String(r[col] ?? "").trim();
      if (!urlRaw || !looksLikeUrl(urlRaw)) continue;

      const url = normalizeUrl(urlRaw);
      const canonicalUrl = canonicalizeUrl(url);
      const domain = extractDomain(url);

      const existingByUrl = await prisma.product.findFirst({
        where: { officialCanonicalUrl: canonicalUrl },
        select: { id: true },
      });
      if (existingByUrl) {
        result.productsSkipped++;
        continue;
      }

      productIndex += 1;
      const fallbackName = `${brandNameRaw} – Product ${productIndex}`;
      const baseSlug = slugify(`${brandSlug}-${productIndex}`).slice(0, 80) || `product-${productIndex}`;
      let slug = baseSlug;
      let attempts = 0;
      while (attempts < 20) {
        const taken = await prisma.product.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (!taken) break;
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
        attempts++;
      }

      await prisma.product.create({
        data: {
          brandId,
          name: fallbackName,
          slug,
          form: "OTHER",
          ingredientText: "",
          ingredientsNormalized: [],
          manufacturingClarity: "NOT_STATED",
          manufacturingCountryClaim: null,
          manufacturingClaimText: null,
          manufacturingEvidenceUrl: null,
          coaStatus: "UNKNOWN",
          coaUrl: null,
          transparencyGrade: "F",
          qualityTier: "POOR",
          officialCanonicalUrl: canonicalUrl,
          officialDomain: domain,
          dataCompleteness: "LOW",
        },
      });
      result.productsCreated++;
    }
  }

  return result;
}
