import { z } from "zod";

export const BrandInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

function optionalString(max = 500) {
  return z.string().trim().max(max).optional().or(z.literal(""));
}
function optionalInt() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      const s = (v ?? "").toString().trim();
      if (s === "") return null;
      const n = parseInt(s, 10);
      return Number.isNaN(n) || n < 0 ? null : n;
    });
}

export const ProductInputSchema = z.object({
  brandId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(200).optional().or(z.literal("")),
  form: z.enum(["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"]),
  gtin: optionalString(64),
  mpn: optionalString(64),
  brandSku: optionalString(64),
  netQuantityText: optionalString(120),
  servingsCount: optionalInt(),
  capsuleCount: optionalInt(),
  flavor: optionalString(80),
  ingredientText: z.string().trim().max(5000).optional().or(z.literal("")),
  ingredientsNormalizedCsv: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingCountryClaim: optionalString(60),
  manufacturingClaimText: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingEvidenceUrl: optionalString(2000),
  coaStatus: z.enum(["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"]),
  coaUrl: optionalString(2000),
  thirdPartyTestingLab: z.string().trim().max(1000).optional().or(z.literal("")),
  hasPatentClaim: z.enum(["yes", "no"]).transform((v) => v === "yes"),
  officialCanonicalUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  lastVerifiedAt: z.string().trim().optional().or(z.literal("")),
});

export const EvidenceInputSchema = z.object({
  type: z.enum(["COA", "MANUFACTURING", "INGREDIENTS", "TESTING", "OTHER"]),
  url: z.string().trim().url(),
  quote: z.string().trim().max(4000).optional().or(z.literal("")),
});

export function parseCsvList(csv: string | undefined) {
  const raw = (csv ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

