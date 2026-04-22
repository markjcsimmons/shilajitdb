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
  page: number;
  sort: "default";
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
  sort: z.literal("default").optional(),
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
  };

  const parsed = SearchParamSchema.safeParse(raw);
  if (!parsed.success) {
    return { page: 1, sort: "default" };
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
    page: parsed.data.page ?? 1,
    sort: "default",
  };
}

export const PAGE_SIZE = 20;

export function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [
    { isCanonical: true },
  ];

  // When no search query (homepage default): show ONLY verified products to avoid clutter.
  // When q exists: include BOTH verified and placeholder products; ordering will put placeholders last.
  const hasSearchQuery = Boolean(filters.q?.trim());
  if (!hasSearchQuery) {
    and.push({ dataCompleteness: { not: "LOW" } });
  }

  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { slug: { contains: filters.q, mode: "insensitive" } },
        { brand: { name: { contains: filters.q, mode: "insensitive" } } },
        { brand: { slug: { contains: filters.q, mode: "insensitive" } } },
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
    and.push({
      ingredientsNormalized: { has: filters.ingredient },
    });
  if (filters.thirdPartyTested)
    and.push({ thirdPartyTestingLab: { not: null } });

  return and.length ? { AND: and } : {};
}

export function buildDefaultOrderBy(): Prisma.ProductOrderByWithRelationInput[] {
  // LOW completeness products last; then best overall grade first (A_PLUS = pos 1 in enum → "asc" = A+ first)
  return [
    { dataCompleteness: "desc" },
    { overallGrade: "asc" },
    { name: "asc" },
  ];
}

export function buildQueryString(next: Partial<ProductFilters>) {
  const params = new URLSearchParams();
  const entries: [keyof ProductFilters, string | number | undefined][] = [
    ["q", next.q],
    ["form", next.form],
    ["manufacturingCountryClaim", next.manufacturingCountryClaim],
    ["coaStatus", next.coaStatus],
    ["transparencyGrade", next.transparencyGrade],
    ["qualityTier", next.qualityTier],
    ["ingredient", next.ingredient],
    ["thirdPartyTested", next.thirdPartyTested === true ? "true" : undefined],
    ["sort", next.sort && next.sort !== "default" ? next.sort : undefined],
    ["page", next.page && next.page > 1 ? next.page : undefined],
  ];
  for (const [k, v] of entries) {
    if (v === undefined) continue;
    const s = String(v).trim();
    if (!s) continue;
    params.set(String(k), s);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

