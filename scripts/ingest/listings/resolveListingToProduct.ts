import "dotenv/config";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { ListingSource, ProductForm } from "@prisma/client";

export type ListingInput = {
  url: string;
  source: ListingSource;
  title?: string | null;
  brandName?: string | null;
  observedGtin?: string | null;
  observedSku?: string | null;
  netQuantityText?: string | null;
  form?: ProductForm | null;
  seller?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  inStock?: boolean | null;
  shipsToUS?: boolean | null;
  imageUrls?: string[] | null;
};

export type ResolveListingResult =
  | { kind: "attached"; productId: string; listingId: string; reason: string }
  | { kind: "created"; productId: string; listingId: string; reason: string }
  | { kind: "manual_review"; candidateProductId: string; reason: string }
  | { kind: "skipped"; reason: string };

function norm(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normGtin(s: string) {
  const digits = String(s ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 14) return null;
  return digits;
}

function normQty(s: string) {
  return norm(s).replace(/\b(pack|count|capsules|capsule|softgels|softgel|tablets|tablet)\b/g, "").trim();
}

function computeConfidence(args: {
  inputBrand: string | null;
  productBrand: string;
  inputTitle: string | null;
  productName: string;
  inputForm: ProductForm | null;
  productForm: ProductForm;
  inputNetQty: string | null;
  productNetQty: string | null;
}) {
  const bIn = args.inputBrand ? norm(args.inputBrand) : "";
  const bDb = norm(args.productBrand);
  const brandOk = bIn && bDb ? bIn === bDb || bDb.includes(bIn) || bIn.includes(bDb) : false;

  const tIn = args.inputTitle ? norm(args.inputTitle) : "";
  const tDb = norm(args.productName);
  const titleOk = tIn && tDb ? tIn === tDb || tDb.includes(tIn) || tIn.includes(tDb) : false;

  const formOk = args.inputForm ? args.inputForm === args.productForm : false;

  const qIn = args.inputNetQty ? normQty(args.inputNetQty) : "";
  const qDb = args.productNetQty ? normQty(args.productNetQty) : "";
  const qtyOk = qIn && qDb ? qIn === qDb || qDb.includes(qIn) || qIn.includes(qDb) : false;

  // Intentionally conservative. Reaching >= 0.95 requires near-perfect alignment.
  const score =
    (brandOk ? 0.35 : 0) +
    (titleOk ? 0.35 : 0) +
    (formOk ? 0.2 : 0) +
    (qtyOk ? 0.1 : 0);
  return { score, brandOk, titleOk, formOk, qtyOk };
}

async function ensureBrand(brandName: string) {
  const name = brandName.trim();
  const existing = await prisma.brand.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  // Best-effort stable slug. If collision occurs, append short suffix.
  const base = slugify(name) || "brand";
  let slug = base;
  for (let i = 0; i < 5; i += 1) {
    const found = await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
    if (!found) break;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return await prisma.brand.create({ data: { name, slug }, select: { id: true, name: true } });
}

function defaultProductName(input: ListingInput) {
  if (input.title && input.title.trim()) return input.title.trim();
  if (input.brandName && input.brandName.trim()) return `${input.brandName.trim()} Shilajit`;
  return "Shilajit Product";
}

async function uniqueProductSlugForCreate(name: string) {
  const base = slugify(name) || "product";
  let slug = base;
  for (let i = 0; i < 6; i += 1) {
    const exists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function upsertListing(args: { productId: string; input: ListingInput }) {
  const now = new Date();
  const input = args.input;
  const observedGtin = input.observedGtin ? normGtin(input.observedGtin) : null;
  const imageUrls = Array.isArray(input.imageUrls) ? input.imageUrls.filter(Boolean) : [];

  return await prisma.listing.upsert({
    where: { url: input.url },
    update: {
      productId: args.productId,
      source: input.source,
      title: input.title?.trim() || null,
      seller: input.seller?.trim() || null,
      priceCents: typeof input.priceCents === "number" ? Math.trunc(input.priceCents) : null,
      currency: input.currency?.trim() || null,
      inStock: typeof input.inStock === "boolean" ? input.inStock : null,
      shipsToUS: typeof input.shipsToUS === "boolean" ? input.shipsToUS : null,
      observedGtin,
      observedSku: input.observedSku?.trim() || null,
      imageUrls,
      lastSeenAt: now,
      status: "ACTIVE",
    },
    create: {
      productId: args.productId,
      source: input.source,
      url: input.url,
      title: input.title?.trim() || null,
      seller: input.seller?.trim() || null,
      priceCents: typeof input.priceCents === "number" ? Math.trunc(input.priceCents) : null,
      currency: input.currency?.trim() || null,
      inStock: typeof input.inStock === "boolean" ? input.inStock : null,
      shipsToUS: typeof input.shipsToUS === "boolean" ? input.shipsToUS : null,
      observedGtin,
      observedSku: input.observedSku?.trim() || null,
      imageUrls,
      lastSeenAt: now,
      status: "ACTIVE",
    },
    select: { id: true },
  });
}

export async function resolveListing(listingInput: ListingInput): Promise<ResolveListingResult> {
  const url = String(listingInput.url ?? "").trim();
  if (!url) return { kind: "skipped", reason: "Missing url." };
  listingInput.url = url;

  const normalizedGtin = listingInput.observedGtin ? normGtin(listingInput.observedGtin) : null;

  // STEP 1: GTIN exact match.
  if (normalizedGtin) {
    const match = await prisma.product.findFirst({
      where: { gtin: normalizedGtin },
      select: { id: true },
    });
    if (match) {
      const listing = await upsertListing({ productId: match.id, input: listingInput });
      return {
        kind: "attached",
        productId: match.id,
        listingId: listing.id,
        reason: `Matched Product.gtin=${normalizedGtin}.`,
      };
    }
  }

  // STEP 2: Exact match on an existing OFFICIAL listing URL.
  const official = await prisma.listing.findFirst({
    where: { source: "OFFICIAL", url },
    select: { productId: true },
  });
  if (official) {
    const listing = await upsertListing({ productId: official.productId, input: listingInput });
    return {
      kind: "attached",
      productId: official.productId,
      listingId: listing.id,
      reason: "Matched existing OFFICIAL listing url.",
    };
  }

  // STEP 3: High-confidence match (do not auto-merge).
  const inputBrand = listingInput.brandName?.trim() || null;
  const inputTitle = listingInput.title?.trim() || null;
  const inputForm = listingInput.form ?? null;
  const inputQty = listingInput.netQuantityText?.trim() || null;

  if (inputBrand && inputTitle && inputForm && inputQty) {
    const candidates = await prisma.product.findMany({
      where: {
        brand: { name: { equals: inputBrand, mode: "insensitive" } },
        form: inputForm,
      },
      select: {
        id: true,
        name: true,
        form: true,
        netQuantityText: true,
        brand: { select: { name: true } },
      },
      take: 25,
    });

    let best: { id: string; score: number } | null = null;
    for (const c of candidates) {
      const { score } = computeConfidence({
        inputBrand,
        productBrand: c.brand.name,
        inputTitle,
        productName: c.name,
        inputForm,
        productForm: c.form,
        inputNetQty: inputQty,
        productNetQty: c.netQuantityText ?? null,
      });
      if (!best || score > best.score) best = { id: c.id, score };
    }

    if (best && best.score >= 0.95) {
      return {
        kind: "manual_review",
        candidateProductId: best.id,
        reason: `High-confidence match score=${best.score.toFixed(2)}; not auto-merged.`,
      };
    }
  }

  // STEP 4: Create placeholder product + attach listing.
  const brand =
    inputBrand != null ? await ensureBrand(inputBrand) : await ensureBrand("Unknown Brand");

  const productName = defaultProductName(listingInput);
  const slug = await uniqueProductSlugForCreate(productName);

  const created = await prisma.product.create({
    data: {
      brandId: brand.id,
      name: productName,
      slug,
      form: listingInput.form ?? "OTHER",
      gtin: normalizedGtin,
      brandSku: listingInput.observedSku?.trim() || null,
      netQuantityText: inputQty,
      ingredientText: "",
      manufacturingClarity: "NOT_STATED",
      coaStatus: "UNKNOWN",
      transparencyGrade: "F",
      qualityTier: "POOR",
      dataCompleteness: "LOW",
    },
    select: { id: true },
  });

  const listing = await upsertListing({ productId: created.id, input: listingInput });
  return {
    kind: "created",
    productId: created.id,
    listingId: listing.id,
    reason: "No match; created placeholder Product (LOW completeness).",
  };
}

