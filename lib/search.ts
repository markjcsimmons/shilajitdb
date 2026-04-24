import type {
  CoaStatus,
  Prisma,
  ProductForm,
  QualityTier,
  TransparencyGrade,
} from "@prisma/client";
import { z } from "zod";

const enumList = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

const ProductFormSchema = enumList([
  "RESIN",
  "CAPSULE",
  "POWDER",
  "GUMMY",
  "LIQUID",
  "BLEND",
  "TABLETS",
  "HONEY_STICKS",
  "OTHER",
]);

const CoaStatusSchema = enumList(["PUBLIC", "REQUEST_ONLY", "NONE", "UNKNOWN"]);
const TransparencyGradeSchema = enumList(["A", "B", "C", "D", "F"]);
const QualityTierSchema = enumList(["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"]);

export type SortOption = "recommended" | "grade_asc" | "price_gram_asc" | "price_serving_asc" | "verified_desc";

export const SORT_LABELS: Record<SortOption, string> = {
  recommended:       "Recommended",
  grade_asc:         "Best grade first",
  price_gram_asc:    "Lowest $/gram",
  price_serving_asc: "Lowest $/serving",
  verified_desc:     "Recently verified",
};

export type SearchParams = Record<string, string | string[] | undefined>;

function getFirst(v: string | string[] | undefined) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export type ProductFilters = {
  q?: string;
  form?: ProductForm;
  manufacturingCountryClaim?: string;
  coaStatus?: CoaStatus;
  transparencyGrade?: TransparencyGrade;
  qualityTier?: QualityTier;
  ingredient?: string;
  thirdPartyTested?: boolean;
  heavyMetalsTested?: boolean;
  minPriceGram?: number; // dollars (e.g. 0.10)
  maxPriceGram?: number; // dollars (e.g. 1.50)
  page: number;
  sort: SortOption;
};

const SearchParamSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  form: ProductFormSchema.optional(),
  manufacturingCountryClaim: z.string().trim().min(1).max(60).optional(),
  coaStatus: CoaStatusSchema.optional(),
  transparencyGrade: TransparencyGradeSchema.optional(),
  qualityTier: QualityTierSchema.optional(),
  ingredient: z.string().trim().min(1).max(60).optional(),
  page: z.coerce.number().int().min(1).max(999).optional(),
  sort: z.enum(["recommended", "grade_asc", "price_gram_asc", "price_serving_asc", "verified_desc"]).optional(),
  minPriceGram: z.coerce.number().min(0).max(100).optional(),
  maxPriceGram: z.coerce.number().min(0).max(100).optional(),
});

export function parseProductFilters(searchParams: SearchParams): ProductFilters {
  const raw = {
    q: getFirst(searchParams.q),
    form: getFirst(searchParams.form),
    manufacturingCountryClaim: getFirst(searchParams.manufacturingCountryClaim),
    coaStatus: getFirst(searchParams.coaStatus),
    transparencyGrade: getFirst(searchParams.transparencyGrade),
    qualityTier: getFirst(searchParams.qualityTier),
    ingredient: getFirst(searchParams.ingredient),
    page: getFirst(searchParams.page),
    sort: getFirst(searchParams.sort),
    minPriceGram: getFirst(searchParams.minPriceGram),
    maxPriceGram: getFirst(searchParams.maxPriceGram),
  };

  const parsed = SearchParamSchema.safeParse(raw);
  if (!parsed.success) {
    return { page: 1, sort: "recommended" };
  }

  return {
    q: parsed.data.q,
    form: parsed.data.form as ProductForm | undefined,
    manufacturingCountryClaim: parsed.data.manufacturingCountryClaim,
    coaStatus: parsed.data.coaStatus as CoaStatus | undefined,
    transparencyGrade: parsed.data.transparencyGrade as TransparencyGrade | undefined,
    qualityTier: parsed.data.qualityTier as QualityTier | undefined,
    ingredient: parsed.data.ingredient,
    thirdPartyTested: getFirst(searchParams.thirdPartyTested) === "true" ? true : undefined,
    heavyMetalsTested: getFirst(searchParams.heavyMetalsTested) === "true" ? true : undefined,
    minPriceGram: parsed.data.minPriceGram,
    maxPriceGram: parsed.data.maxPriceGram,
    page: parsed.data.page ?? 1,
    sort: parsed.data.sort ?? "recommended",
  };
}

export const PAGE_SIZE = 20;

export function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [
    { isCanonical: true },
  ];

  const hasSearchQuery = Boolean(filters.q?.trim());
  if (!hasSearchQuery) {
    and.push({ dataCompleteness: { not: "LOW" } });
  }

  if (filters.q) {
    const qNorm = filters.q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { slug: { contains: qNorm, mode: "insensitive" } },
        { brand: { name: { contains: filters.q, mode: "insensitive" } } },
        { brand: { slug: { contains: qNorm, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.form) and.push({ form: filters.form });
  if (filters.coaStatus) and.push({ coaStatus: filters.coaStatus });
  if (filters.transparencyGrade)
    and.push({ transparencyGrade: filters.transparencyGrade });
  if (filters.qualityTier) and.push({ qualityTier: filters.qualityTier });
  if (filters.manufacturingCountryClaim)
    and.push({ manufacturingCountryClaim: filters.manufacturingCountryClaim });
  if (filters.ingredient)
    and.push({ ingredientsNormalized: { has: filters.ingredient } });
  if (filters.thirdPartyTested)
    and.push({ thirdPartyTestingLab: { not: null } });
  if (filters.heavyMetalsTested)
    and.push({ heavyMetalsTested: { in: ["CONFIRMED", "CLAIMED"] } });

  // Price range (stored as cents, input in dollars)
  if (filters.minPriceGram != null) {
    and.push({ pricePerGramCents: { gte: Math.round(filters.minPriceGram * 100) } });
  }
  if (filters.maxPriceGram != null) {
    and.push({ pricePerGramCents: { lte: Math.round(filters.maxPriceGram * 100) } });
  }

  return and.length ? { AND: and } : {};
}

export function buildOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "grade_asc":
      return [{ overallGrade: "asc" }, { dataCompleteness: "desc" }, { name: "asc" }];
    case "price_gram_asc":
      return [{ pricePerGramCents: "asc" }, { overallGrade: "asc" }, { name: "asc" }];
    case "price_serving_asc":
      return [{ pricePerServingCents: "asc" }, { overallGrade: "asc" }, { name: "asc" }];
    case "verified_desc":
      return [{ lastVerifiedAt: "desc" }, { overallGrade: "asc" }, { name: "asc" }];
    case "recommended":
    default:
      return [{ dataCompleteness: "desc" }, { overallGrade: "asc" }, { name: "asc" }];
  }
}

/** @deprecated use buildOrderBy(sort) */
export function buildDefaultOrderBy(): Prisma.ProductOrderByWithRelationInput[] {
  return buildOrderBy("recommended");
}

export function buildQueryString(next: Partial<ProductFilters>) {
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ["q", next.q],
    ["form", next.form],
    ["manufacturingCountryClaim", next.manufacturingCountryClaim],
    ["coaStatus", next.coaStatus],
    ["transparencyGrade", next.transparencyGrade],
    ["qualityTier", next.qualityTier],
    ["ingredient", next.ingredient],
    ["thirdPartyTested", next.thirdPartyTested === true ? "true" : undefined],
    ["heavyMetalsTested", next.heavyMetalsTested === true ? "true" : undefined],
    ["minPriceGram", next.minPriceGram],
    ["maxPriceGram", next.maxPriceGram],
    ["sort", next.sort && next.sort !== "recommended" ? next.sort : undefined],
    ["page", next.page && next.page > 1 ? next.page : undefined],
  ];
  for (const [k, v] of entries) {
    if (v === undefined) continue;
    const s = String(v).trim();
    if (!s) continue;
    params.set(k, s);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
