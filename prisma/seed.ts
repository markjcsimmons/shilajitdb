import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { slugify } from "@/lib/slug";
import type {
  CoaStatus,
  EvidenceType,
  ManufacturingClarity,
  ProductForm,
} from "@prisma/client";

type SeedEvidence = {
  type: EvidenceType;
  url: string;
  quote?: string;
};

type SeedProduct = {
  brandName: string;
  name: string;
  form: ProductForm;
  ingredientText: string;
  ingredientsNormalized: string[];
  manufacturingCountryClaim?: string | null;
  manufacturingClarity: ManufacturingClarity;
  manufacturingClaimText?: string | null;
  manufacturingEvidenceUrl?: string | null;
  coaStatus: CoaStatus;
  coaUrl?: string | null;
  lastVerifiedAt?: Date | null;
  evidence: SeedEvidence[];
};

const brands = [
  {
    name: "Pürblack",
    website: "https://purblack.com",
    description:
      "A shilajit brand with strong emphasis on documentation, lab testing availability, and clear product disclosures.",
  },
  {
    name: "Himalaya Roots Co.",
    website: "https://example.com/himalaya-roots",
    description:
      "Sample competitor brand. Placeholder data for demonstrating forms and transparency states.",
  },
  {
    name: "Summit Minerals",
    website: "https://example.com/summit-minerals",
    description:
      "Sample competitor brand. Placeholder data for demonstrating ambiguous claims and request-only COAs.",
  },
  {
    name: "Gummy Vitality Labs",
    website: "https://example.com/gummy-vitality",
    description:
      "Sample competitor brand. Placeholder data for a gummy/blend product with weaker transparency signals.",
  },
];

const products: SeedProduct[] = [
  {
    brandName: "Pürblack",
    name: "Shilajit Resin",
    form: "RESIN",
    ingredientText:
      "Ingredients: Purified shilajit resin. No flavors, sweeteners, or proprietary blends. See COA for batch testing details.",
    ingredientsNormalized: ["shilajit"],
    manufacturingCountryClaim: "USA",
    manufacturingClarity: "CLEAR",
    manufacturingClaimText: "Manufactured in the USA.",
    manufacturingEvidenceUrl: "https://purblack.com",
    coaStatus: "PUBLIC",
    coaUrl: "https://purblack.com",
    lastVerifiedAt: new Date(),
    evidence: [
      {
        type: "COA",
        url: "https://purblack.com",
        quote: "COA link available on product page.",
      },
      {
        type: "MANUFACTURING",
        url: "https://purblack.com",
        quote: "Manufactured in the USA (claim shown on site).",
      },
      {
        type: "INGREDIENTS",
        url: "https://purblack.com",
        quote: "Ingredients listed as purified shilajit resin.",
      },
    ],
  },
  {
    brandName: "Summit Minerals",
    name: "Shilajit Capsules",
    form: "CAPSULE",
    ingredientText:
      "Ingredients: shilajit extract, vegetarian capsule. COA available upon request. Additional details may be provided by customer support.",
    ingredientsNormalized: ["shilajit", "vegetarian capsule"],
    manufacturingCountryClaim: "Unknown",
    manufacturingClarity: "AMBIGUOUS",
    manufacturingClaimText: "Formulated in the USA. Sourced globally.",
    manufacturingEvidenceUrl: "https://example.com/summit-minerals",
    coaStatus: "REQUEST_ONLY",
    coaUrl: null,
    lastVerifiedAt: new Date(),
    evidence: [
      {
        type: "MANUFACTURING",
        url: "https://example.com/summit-minerals",
        quote: "Formulated in the USA (ambiguous manufacturing language).",
      },
      {
        type: "COA",
        url: "https://example.com/summit-minerals",
        quote: "COA available upon request.",
      },
    ],
  },
  {
    brandName: "Himalaya Roots Co.",
    name: "Shilajit Powder",
    form: "POWDER",
    ingredientText:
      "Ingredients: shilajit powder. Origin: Himalayas. Manufacturing details not stated. No public lab report link found.",
    ingredientsNormalized: ["shilajit"],
    manufacturingCountryClaim: "India",
    manufacturingClarity: "NOT_STATED",
    manufacturingClaimText: "Origin: Himalayas.",
    manufacturingEvidenceUrl: "https://example.com/himalaya-roots",
    coaStatus: "UNKNOWN",
    coaUrl: null,
    lastVerifiedAt: new Date(),
    evidence: [
      {
        type: "INGREDIENTS",
        url: "https://example.com/himalaya-roots",
        quote: "Ingredient listed as shilajit powder.",
      },
    ],
  },
  {
    brandName: "Gummy Vitality Labs",
    name: "Shilajit Energy Gummies",
    form: "GUMMY",
    ingredientText:
      'Ingredients: proprietary blend (shilajit, herbs, vitamins), sugar, natural flavors. Manufacturing not stated. No COA link located.',
    ingredientsNormalized: ["shilajit", "herbs", "vitamins", "sugar", "natural flavors"],
    manufacturingCountryClaim: null,
    manufacturingClarity: "NOT_STATED",
    manufacturingClaimText: null,
    manufacturingEvidenceUrl: null,
    coaStatus: "NONE",
    coaUrl: null,
    lastVerifiedAt: new Date(),
    evidence: [],
  },
  {
    brandName: "Summit Minerals",
    name: "Shilajit Blend Drops",
    form: "LIQUID",
    ingredientText:
      "Ingredients: shilajit extract, water, glycerin. COA status unknown. Manufacturing claim unclear.",
    ingredientsNormalized: ["shilajit", "water", "glycerin"],
    manufacturingCountryClaim: "USA",
    manufacturingClarity: "AMBIGUOUS",
    manufacturingClaimText: "Made with ingredients sourced worldwide.",
    manufacturingEvidenceUrl: "https://example.com/summit-minerals",
    coaStatus: "UNKNOWN",
    coaUrl: null,
    lastVerifiedAt: new Date(),
    evidence: [
      {
        type: "MANUFACTURING",
        url: "https://example.com/summit-minerals",
        quote: "Made with ingredients sourced worldwide (does not specify manufacturing).",
      },
    ],
  },
];

async function main() {
  const brandMap = new Map<string, string>();

  for (const b of brands) {
    const slug = slugify(b.name);
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {
        name: b.name,
        website: b.website,
        description: b.description,
      },
      create: {
        name: b.name,
        slug,
        website: b.website,
        description: b.description,
      },
      select: { id: true, name: true },
    });
    brandMap.set(brand.name, brand.id);
  }

  for (const p of products) {
    const brandId = brandMap.get(p.brandName);
    if (!brandId) throw new Error(`Missing brandId for ${p.brandName}`);

    const slug = slugify(`${p.brandName} ${p.name}`);
    const transparency = computeTransparencyGrade(
      {
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingClarity: p.manufacturingClarity,
        coaStatus: p.coaStatus,
      },
      { count: p.evidence.length }
    );
    const quality = computeQualityTier(
      {
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingClarity: p.manufacturingClarity,
        coaStatus: p.coaStatus,
      },
      transparency
    );

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        brandId,
        name: p.name,
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingCountryClaim: p.manufacturingCountryClaim ?? null,
        manufacturingClarity: p.manufacturingClarity,
        manufacturingClaimText: p.manufacturingClaimText ?? null,
        manufacturingEvidenceUrl: p.manufacturingEvidenceUrl ?? null,
        coaStatus: p.coaStatus,
        coaUrl: p.coaUrl ?? null,
        transparencyGrade: transparency.grade,
        qualityTier: quality.tier,
        lastVerifiedAt: p.lastVerifiedAt ?? null,
      },
      create: {
        brandId,
        name: p.name,
        slug,
        form: p.form,
        ingredientText: p.ingredientText,
        ingredientsNormalized: p.ingredientsNormalized,
        manufacturingCountryClaim: p.manufacturingCountryClaim ?? null,
        manufacturingClarity: p.manufacturingClarity,
        manufacturingClaimText: p.manufacturingClaimText ?? null,
        manufacturingEvidenceUrl: p.manufacturingEvidenceUrl ?? null,
        coaStatus: p.coaStatus,
        coaUrl: p.coaUrl ?? null,
        transparencyGrade: transparency.grade,
        qualityTier: quality.tier,
        lastVerifiedAt: p.lastVerifiedAt ?? null,
      },
      select: { id: true },
    });

    await prisma.evidence.deleteMany({ where: { productId: product.id } });
    if (p.evidence.length > 0) {
      await prisma.evidence.createMany({
        data: p.evidence.map((e) => ({
          productId: product.id,
          type: e.type,
          url: e.url,
          quote: e.quote ?? null,
        })),
      });
    }
  }
}

main()
  .then(async () => {
    await seedDefaultJobs();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

async function seedDefaultJobs() {
  const defaults: Array<{ type: "ENRICH_OFFICIAL" | "LINK_HEALTH" | "DISCOVERY_ROBOTS_ALLOWED"; name: string; schedule: string }> = [
    { type: "ENRICH_OFFICIAL", name: "Enrich official pages", schedule: "0 3 * * *" },
    { type: "LINK_HEALTH", name: "Check link health", schedule: "0 6 * * 1" },
    { type: "DISCOVERY_ROBOTS_ALLOWED", name: "Discover robots-allowed sources", schedule: "0 2 * * *" },
  ];
  for (const d of defaults) {
    await prisma.job.upsert({
      where: { type: d.type },
      update: { name: d.name, schedule: d.schedule },
      create: { type: d.type, name: d.name, schedule: d.schedule, isEnabled: true },
      select: { id: true },
    });
  }
}

