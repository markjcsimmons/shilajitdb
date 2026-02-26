import { deriveWebsiteDomain } from "@/lib/url";
import { slugify } from "@/lib/slug";
import type { ManufacturingClarity, ProductForm } from "@prisma/client";

const shilajitSynonyms = new Map<string, string>([
  ["shilajeet", "shilajit"],
  ["shilajit", "shilajit"],
  ["mumijo", "mumijo"],
  ["mumie", "mumijo"],
  ["mineral pitch", "shilajit"],
  ["asphaltum", "shilajit"],
]);

export function normalizeBrandName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function inferFormFromText(text: string): ProductForm {
  const t = text.toLowerCase();
  if (/\bresin\b/.test(t)) return "RESIN";
  if (/\bcapsule(s)?\b/.test(t)) return "CAPSULE";
  if (/\bpowder\b/.test(t)) return "POWDER";
  if (/\bgumm(y|ies)\b/.test(t)) return "GUMMY";
  if (/\bdrops?\b|\bliquid\b|\btincture\b/.test(t)) return "LIQUID";
  if (/\bblend\b/.test(t)) return "BLEND";
  return "OTHER";
}

export function normalizeIngredientToken(token: string) {
  const t = token.trim().toLowerCase();
  if (!t) return null;
  for (const [k, v] of shilajitSynonyms) {
    if (t === k) return v;
  }
  return t;
}

export function normalizeIngredientsList(tokens: string[]) {
  const out: string[] = [];
  for (const tok of tokens) {
    const n = normalizeIngredientToken(tok);
    if (n) out.push(n);
  }
  return Array.from(new Set(out));
}

export function parseIngredientsFromLabelText(labelText: string) {
  const raw = labelText.replace(/\r/g, "\n");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const ingredientsLines = lines.filter((l) => /^ingredients?\b/i.test(l));
  const joined = ingredientsLines.length ? ingredientsLines.join("\n") : "";
  const afterColon = joined.includes(":") ? joined.split(":").slice(1).join(":") : joined;

  const tokens = afterColon
    .split(/[,;•\u2022]/g)
    .map((s) => s.replace(/\(.*?\)/g, "").trim())
    .filter(Boolean);

  return {
    ingredientText: joined || labelText.slice(0, 2000),
    ingredientsNormalized: normalizeIngredientsList(tokens),
  };
}

const madeInRegex =
  /\b(?:made in|manufactured in|product of)\s+([A-Za-z][A-Za-z\s]{1,40})/i;
const manufacturedForRegex = /\bmanufactured for\b|\bdistributed by\b/i;
const addressLikeRegex = /\b(ave|street|st\.|rd\.|road|blvd|suite|ste\.|ca|ny|tx|zip)\b/i;

export function deriveManufacturingFromLabelText(labelText: string): {
  manufacturingCountryClaim: string;
  manufacturingClarity: ManufacturingClarity;
  manufacturingClaimText: string | null;
} {
  const m = labelText.match(madeInRegex);
  if (m && m[1]) {
    const country = m[1].trim().replace(/\s+/g, " ");
    return {
      manufacturingCountryClaim: country,
      manufacturingClarity: "CLEAR",
      manufacturingClaimText: m[0].trim(),
    };
  }

  if (manufacturedForRegex.test(labelText) || addressLikeRegex.test(labelText)) {
    return {
      manufacturingCountryClaim: "Unknown",
      manufacturingClarity: "AMBIGUOUS",
      manufacturingClaimText: null,
    };
  }

  return {
    manufacturingCountryClaim: "Unknown",
    manufacturingClarity: "NOT_STATED",
    manufacturingClaimText: null,
  };
}

export function stableProductSlug(brandName: string, productName: string, dsldLabelId?: string | null) {
  if (dsldLabelId) return slugify(`dsld-${dsldLabelId}-${brandName}-${productName}`);
  return slugify(`${brandName} ${productName}`);
}

export function deriveBrandWebsiteDomain(website: string | null | undefined) {
  return deriveWebsiteDomain(website);
}

