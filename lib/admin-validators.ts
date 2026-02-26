import { z } from "zod";

export const BrandInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const ProductInputSchema = z.object({
  brandId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(200).optional().or(z.literal("")),
  form: z.enum(["RESIN", "CAPSULE", "POWDER", "GUMMY", "LIQUID", "BLEND", "OTHER"]),
  ingredientText: z.string().trim().min(1).max(5000),
  ingredientsNormalizedCsv: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingCountryClaim: z.string().trim().max(60).optional().or(z.literal("")),
  manufacturingClarity: z.enum(["CLEAR", "AMBIGUOUS", "NOT_STATED"]),
  manufacturingClaimText: z.string().trim().max(2000).optional().or(z.literal("")),
  manufacturingEvidenceUrl: z.string().trim().url().optional().or(z.literal("")),
  coaStatus: z.enum(["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"]),
  coaUrl: z.string().trim().url().optional().or(z.literal("")),
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

