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

/** Accepts a dollar string like "0.92" or "36.67" and returns cents as an integer. */
function optionalDollarsAsCents() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      const s = (v ?? "").toString().trim();
      if (s === "") return null;
      const n = parseFloat(s);
      return !Number.isFinite(n) || n <= 0 ? null : Math.round(n * 100);
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
  servingSize: optionalString(80),
  sourceRegion: z
    .enum(["Himalayan", "Altai Mountains", "Gilgit-Baltistan", "Tibetan Plateau", "Central Asian", "Multiple", "Other", ""])
    .optional()
    .or(z.literal("")),
  heavyMetalsTested: z
    .enum(["CONFIRMED", "CLAIMED", "NONE", ""])
    .optional()
    .or(z.literal("")),
  gmpCertified: z.string().optional(),
  pricePerServingCents: optionalDollarsAsCents(),
  pricePerGramCents: optionalDollarsAsCents(),
  marketingClaim: optionalString(300),
  amazonAsin: optionalString(20),
  servingsCount: optionalInt(),
  capsuleCount: optionalInt(),
  flavor: optionalString(80),
  ingredientText: z.string().trim().max(5000).optional().or(z.literal("")),
  ingredientsNormalizedCsv: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingCountryClaim: optionalString(60),
  manufacturingClaimText: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingEvidenceUrl: optionalString(2000),
  coaStatus: z.enum(["PUBLIC", "PUBLIC_EMBEDDED", "REQUEST_ONLY", "NONE", "UNKNOWN"]),
  coaUrl: optionalString(2000),
  thirdPartyTestingLab: z.string().trim().max(1000).optional().or(z.literal("")),
  hasPatentClaim: z.enum(["yes", "no"]).transform((v) => v === "yes"),
  officialCanonicalUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  lastVerifiedAt: z.string().trim().optional().or(z.literal("")),
  hideFromPublic: z.string().optional(),
  bbbGrade: z
    .enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "NR", ""])
    .optional()
    .or(z.literal("")),
  metaDescription: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (v.length >= 140 && v.length <= 160),
      (v) => ({
        message: !v
          ? ""
          : (v as string).length < 140
            ? `Write more — at least 140 characters (currently ${(v as string).length}).`
            : `Write less — at most 160 characters (currently ${(v as string).length}).`,
      })
    ),
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

