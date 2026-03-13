import "dotenv/config";
import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";
import { slugify } from "@/lib/slug";
import { normalizeBrandName, normalizeGtin, normalizeProductTitle, parseNetQuantityText, inferFormFromTitle } from "./normalize";
import type { ListingInput, ListingResolverResult } from "./types";
import type { ListingSource, ProductForm } from "@prisma/client";

function uniq<T>(xs: T[]) {
  return Array.from(new Set(xs));
}

async function ensureBrand(nameRaw: string) {
  const name = normalizeBrandName(nameRaw || "Unknown Brand") || "Unknown Brand";
  const existing = await prisma.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true, slug: true },
  });
  if (existing) return existing;

  const base = slugify(name) || "brand";
  let slug = base;
  for (let i = 0; i < 8; i += 1) {
    const taken = await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) break;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return await prisma.brand.create({ data: { name, slug }, select: { id: true, name: true, slug: true } });
}

/**
 * Derive a short, URL-safe key from a canonical URL's path.
 * "https://vitalibis.com/products/shilajit-resin-30g" → "products-shilajit-resin-30g"
 * Truncated to 64 chars so composite slugs stay within Postgres limits.
 */
function urlKeyFromListing(url: string): string {
  try {
    const canonical = canonicalizeUrl(url);
    const u = new URL(canonical);
    const pathKey = u.pathname.split("/").filter(Boolean).join("-");
    return slugify(pathKey).slice(0, 64) || "product";
  } catch {
    return "product";
  }
}

/** 6-character deterministic hash of a canonical URL. */
function urlHash6(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 6);
}

/**
 * Derive a human-readable product title from the last path segment of a URL.
 * "/products/shilajit-resin-30g" → "Shilajit Resin 30g"
 * Used as a fallback when the caller supplies no title.
 */
function titleFromUrlSlug(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    return (
      last
        .replace(/\.[a-z]{2,4}$/i, "")
        .replace(/[-_]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || ""
    );
  } catch {
    return "";
  }
}

function titleSimilarity(a: string, b: string) {
  const na = normalizeProductTitle(a);
  const nb = normalizeProductTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  // Simple token overlap (explainable, not fancy).
  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = new Set(nb.split(" ").filter(Boolean));
  const inter = Array.from(ta).filter((t) => tb.has(t)).length;
  const denom = Math.max(1, Math.min(ta.size, tb.size));
  return inter / denom;
}

function confidenceScore(args: {
  gtinExact: boolean;
  brandExact: boolean;
  formMatch: boolean;
  netQtyMatch: boolean;
  titleStrong: boolean;
}) {
  let score = 0;
  if (args.gtinExact) score += 0.6;
  if (args.brandExact) score += 0.2;
  if (args.formMatch) score += 0.1;
  if (args.netQtyMatch) score += 0.1;
  if (args.titleStrong) score += 0.1;
  return Math.min(1, score);
}

function normalizeSource(input: ListingSource): ListingSource {
  return input;
}

async function upsertListing(args: {
  productId: string;
  input: ListingInput;
  observedGtin: string | null;
}): Promise<{ id: string; created: boolean }> {
  const now = new Date();
  const input = args.input;
  const imageUrls = Array.isArray(input.imageUrls) ? uniq(input.imageUrls.filter(Boolean)) : [];

  const existing = await prisma.listing.findUnique({
    where: { url: input.url },
    select: { id: true },
  });

  const data = {
    productId: args.productId,
    source: normalizeSource(input.source),
    url: input.url,
    title: input.title?.trim() || null,
    seller: null,
    priceCents: null,
    currency: null,
    inStock: null,
    shipsToUS: null,
    observedGtin: args.observedGtin,
    observedSku: input.observedSku?.trim() || null,
    imageUrls,
    status: "UNKNOWN" as const,
    lastSeenAt: now,
  };

  if (existing) {
    const updated = await prisma.listing.update({
      where: { url: input.url },
      data,
      select: { id: true },
    });
    return { id: updated.id, created: false };
  }

  const created = await prisma.listing.create({
    data,
    select: { id: true },
  });
  return { id: created.id, created: true };
}

/**
 * Find-or-create a placeholder Product.
 *
 * Slug strategy (REF C):
 *   primary slug = slugify("{brand.slug}-{urlKey}")  ← URL-content-addressed
 *   If the primary slug is taken by the SAME brand → reuse the product.
 *   If the primary slug is taken by a DIFFERENT brand → append a 6-char URL hash.
 *
 * This guarantees that:
 *   - Re-runs for the same URL always land on the same product (idempotent).
 *   - Two brands with structurally identical URL paths do not collide.
 *   - Changing the page title does NOT create a new product (slug is URL-based,
 *     not name-based).
 *
 * Name format:  "{Brand} – {Title}"  (en dash separator)
 * Examples:
 *   "Vitalibis – Shilajit Resin 30g"
 *   "healthforcesuperfoods.com – Shilajit Extreme Capsules"
 */
async function createPlaceholderProduct(args: {
  listing: ListingInput;
  observedGtin: string | null;
  netQty: string | null;
  form: ProductForm;
}) {
  const domain = extractDomain(args.listing.url);
  const brandNameRaw = args.listing.brandName?.trim() || domain || "Unknown Brand";
  const brand = await ensureBrand(brandNameRaw);

  const titlePart =
    args.listing.title?.trim() ||
    titleFromUrlSlug(args.listing.url) ||
    "Shilajit Product";

  const name = `${brand.name} \u2013 ${titlePart}`;

  // REF C: URL-keyed primary slug — collision-resistant across domains.
  const urlKey = urlKeyFromListing(args.listing.url);
  const primarySlug = slugify(`${brand.slug}-${urlKey}`).slice(0, 96) || "product";

  const occupant = await prisma.product.findUnique({
    where: { slug: primarySlug },
    select: { id: true, brandId: true },
  });

  if (occupant) {
    // Same brand → definitely the same product (same brand, same URL path).
    if (occupant.brandId === brand.id) return { id: occupant.id };

    // Different brand collision (rare) → append a 6-char URL hash to distinguish.
    const canonical = canonicalizeUrl(args.listing.url);
    const hashSuffix = urlHash6(canonical);
    const fallbackSlug = `${primarySlug.slice(0, 89)}-${hashSuffix}`;

    const occupant2 = await prisma.product.findUnique({
      where: { slug: fallbackSlug },
      select: { id: true },
    });
    if (occupant2) return occupant2;

    return await prisma.product.create({
      data: {
        brandId: brand.id,
        name,
        slug: fallbackSlug,
        form: args.form,
        gtin: args.observedGtin,
        brandSku: args.listing.observedSku?.trim() || null,
        netQuantityText: args.netQty,
        ingredientText: "",
        ingredientsNormalized: [],
        manufacturingCountryClaim: null,
        manufacturingClaimText: null,
        manufacturingEvidenceUrl: null,
        coaStatus: "UNKNOWN",
        coaUrl: null,
        transparencyGrade: "F",
        qualityTier: "POOR",
        sourceDsldLabelId: null,
        sourceDsldUrl: null,
        dataCompleteness: "LOW",
        isCanonical: false,
        lastVerifiedAt: null,
      },
      select: { id: true },
    });
  }

  // Primary slug is free — create the product (discovery placeholder; isCanonical=false).
  return await prisma.product.create({
    data: {
      brandId: brand.id,
      name,
      slug: primarySlug,
      form: args.form,
      gtin: args.observedGtin,
      brandSku: args.listing.observedSku?.trim() || null,
      netQuantityText: args.netQty,
      ingredientText: "",
      ingredientsNormalized: [],
      manufacturingCountryClaim: null,
      manufacturingClaimText: null,
      manufacturingEvidenceUrl: null,
      coaStatus: "UNKNOWN",
      coaUrl: null,
      transparencyGrade: "F",
      qualityTier: "POOR",
      sourceDsldLabelId: null,
      sourceDsldUrl: null,
      dataCompleteness: "LOW",
      isCanonical: false,
      lastVerifiedAt: null,
    },
    select: { id: true },
  });
}

export async function resolveListingToProduct(listingInput: ListingInput): Promise<ListingResolverResult> {
  const url = String(listingInput.url ?? "").trim();
  if (!url) throw new Error("Missing url");
  listingInput.url = url;

  const observedGtin = normalizeGtin(listingInput.observedGtin);
  const netQty = parseNetQuantityText(listingInput.netQuantityText);
  const form = listingInput.form ?? inferFormFromTitle(listingInput.title) ?? ("OTHER" as ProductForm);

  const inputBrand = normalizeBrandName(listingInput.brandName ?? "");
  const inputTitle = listingInput.title?.trim() ?? "";
  const inputTitleNorm = normalizeProductTitle(inputTitle);
  const inputQtyNorm = parseNetQuantityText(netQty ?? "");
  const candidates: Array<{ productId: string; confidence: number; reasons: string[] }> = [];

  // Step 1: observedGtin matches Product.gtin
  if (observedGtin) {
    const p = await prisma.product.findFirst({ where: { gtin: observedGtin }, select: { id: true } });
    if (p) {
      const listing = await upsertListing({ productId: p.id, input: listingInput, observedGtin });
      return {
        productId: p.id,
        listingId: listing.id,
        mergeCandidatesCreatedCount: 0,
        attachedToExistingProduct: true,
        listingCreated: listing.created,
      };
    }
  }

  // Step 2: source=OFFICIAL — match by canonical URL or by officialDomain + title (MergeCandidate)
  if (listingInput.source === "OFFICIAL") {
    const canonicalUrl = canonicalizeUrl(url);
    const domain = extractDomain(url);

    // If a product has this exact canonical URL as its official, attach here.
    if (canonicalUrl) {
      const byCanonical = await prisma.product.findFirst({
        where: { officialCanonicalUrl: canonicalUrl },
        select: { id: true },
      });
      if (byCanonical) {
        const listing = await upsertListing({ productId: byCanonical.id, input: listingInput, observedGtin });
        return {
          productId: byCanonical.id,
          listingId: listing.id,
          mergeCandidatesCreatedCount: 0,
          attachedToExistingProduct: true,
          listingCreated: listing.created,
        };
      }
    }

    // Existing: exact same OFFICIAL listing url already stored → attach to same product
    const existingOfficial = await prisma.listing.findFirst({
      where: { url, source: "OFFICIAL" },
      select: { id: true, productId: true },
    });
    if (existingOfficial) {
      const listing = await upsertListing({ productId: existingOfficial.productId, input: listingInput, observedGtin });
      return {
        productId: existingOfficial.productId,
        listingId: listing.id,
        mergeCandidatesCreatedCount: 0,
        attachedToExistingProduct: true,
        listingCreated: listing.created,
      };
    }

    // Same domain + strong title similarity → add as MergeCandidate (confidence boost). We'll add these to candidates below.
    if (domain && inputTitleNorm) {
      const byDomain = await prisma.product.findMany({
        where: { officialDomain: domain },
        select: { id: true, name: true, brand: { select: { name: true } }, form: true, netQuantityText: true },
        take: 20,
      });
      for (const p of byDomain) {
        const sim = titleSimilarity(inputTitle, p.name);
        if (sim >= 0.9) {
          const reasons = ["official domain match", `title similarity ${sim.toFixed(2)}`];
          const existingInCandidates = candidates.some((c) => c.productId === p.id);
          if (!existingInCandidates) {
            candidates.push({
              productId: p.id,
              confidence: Math.min(0.98, 0.7 + sim * 0.25),
              reasons,
            });
          }
        }
      }
    }
  }

  // Candidate search for Step 3: strong match on (brand normalized + title normalized + form + netQuantityText)
  let mergeCandidatesCreatedCount = 0;

  if (inputBrand && inputTitleNorm) {
    const products = await prisma.product.findMany({
      where: {
        brand: { name: { equals: inputBrand, mode: "insensitive" } },
      },
      select: {
        id: true,
        name: true,
        form: true,
        netQuantityText: true,
        gtin: true,
        brand: { select: { name: true } },
      },
      take: 50,
    });

    for (const p of products) {
      const brandExact = normalizeBrandName(p.brand.name).toLowerCase() === inputBrand.toLowerCase();
      const formMatch = p.form === form;
      const qtyDb = parseNetQuantityText(p.netQuantityText ?? "");
      const netQtyMatch =
        Boolean(inputQtyNorm) &&
        Boolean(qtyDb) &&
        normalizeProductTitle(inputQtyNorm || "") === normalizeProductTitle(qtyDb || "");
      const sim = titleSimilarity(inputTitle, p.name);
      const titleStrong = sim >= 0.9;
      const score = confidenceScore({
        gtinExact: false,
        brandExact,
        formMatch,
        netQtyMatch,
        titleStrong,
      });
      if (score >= 0.7) {
        const reasons: string[] = [];
        if (brandExact) reasons.push("brand exact");
        if (formMatch) reasons.push("form match");
        if (netQtyMatch) reasons.push("net quantity match");
        if (titleStrong) reasons.push(`title similarity ${sim.toFixed(2)}`);
        candidates.push({ productId: p.id, confidence: score, reasons });
      }
    }
  }

  // Step 3: If confidence >= 0.95, DO NOT auto merge. Create MergeCandidate(PENDING).
  const strongCandidates = candidates
    .filter((c) => c.confidence >= 0.95)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Step 4 (or Step 3 placeholder): create placeholder product and attach listing.
  const placeholder = await createPlaceholderProduct({
    listing: listingInput,
    observedGtin,
    netQty,
    form,
  });
  const listing = await upsertListing({ productId: placeholder.id, input: listingInput, observedGtin });

  if (strongCandidates.length) {
    for (const c of strongCandidates) {
      await prisma.mergeCandidate.upsert({
        where: { listingId_candidateProductId: { listingId: listing.id, candidateProductId: c.productId } },
        update: {
          confidence: c.confidence,
          reasons: c.reasons,
          status: "PENDING",
        },
        create: {
          listingId: listing.id,
          candidateProductId: c.productId,
          confidence: c.confidence,
          reasons: c.reasons,
          status: "PENDING",
        },
        select: { id: true },
      });
      mergeCandidatesCreatedCount += 1;
    }
  }

  return {
    productId: placeholder.id,
    listingId: listing.id,
    mergeCandidatesCreatedCount,
    attachedToExistingProduct: false,
    listingCreated: listing.created,
  };
}

