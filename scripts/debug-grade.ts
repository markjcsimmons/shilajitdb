/**
 * Debug why a brand's products don't reach a given grade.
 * Usage: npx tsx scripts/debug-grade.ts "Cymbiotika"
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { manufacturingPointsFromCountry, computeOverallGrade, overallGradeScore } from "@/lib/grading";

function scoreBreakdown(product: {
  form: string;
  coaStatus: string;
  manufacturingCountryClaim: string | null;
  ingredientText: string | null;
  ingredientsNormalized: string[] | null;
}) {
  const parts: string[] = [];
  if (product.coaStatus === "PUBLIC") parts.push("COA public (+3)");
  else if (product.coaStatus === "REQUEST_ONLY") parts.push("COA request (+2)");
  else parts.push("COA none/unknown (+0)");
  const mfgPts = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  if (mfgPts === 3) parts.push("mfg country USA (+3)");
  else if (mfgPts === 1) parts.push("mfg country other (+1)");
  else parts.push("mfg country not stated (+0)");
  if (product.form === "RESIN") parts.push("form RESIN (+2)");
  else if (product.form === "CAPSULE" || product.form === "POWDER") parts.push(`form ${product.form} (+1)`);
  else parts.push(`form ${product.form} (+0)`);
  const norm = (product.ingredientsNormalized ?? []).filter(Boolean);
  const hasText = (product.ingredientText ?? "").trim().length > 0;
  if (norm.length > 0) parts.push("ingredientsNorm (+1)");
  if (hasText) parts.push("ingredientText (+1)");
  return parts;
}

async function main() {
  const brandName = process.argv[2] ?? "Cymbiotika";
  const brand = await prisma.brand.findFirst({
    where: { name: { contains: brandName, mode: "insensitive" } },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          form: true,
          coaStatus: true,
          manufacturingCountryClaim: true,
          ingredientText: true,
          ingredientsNormalized: true,
          overallGrade: true,
          brand: { select: { slug: true } },
        },
      },
    },
  });
  if (!brand) {
    console.log(`Brand not found: ${brandName}`);
    process.exit(1);
  }
  console.log(`\nBrand: ${brand.name} (slug: ${brand.slug})\nProducts: ${brand.products.length}\n`);
  for (const p of brand.products) {
    const input = {
      form: p.form as any,
      ingredientText: p.ingredientText ?? "",
      ingredientsNormalized: p.ingredientsNormalized ?? [],
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      coaStatus: p.coaStatus as any,
    };
    const grade = computeOverallGrade(input);
    const score = overallGradeScore(input);
    const breakdown = scoreBreakdown(p);
    console.log(`  ${p.name}`);
    console.log(`    form=${p.form} coaStatus=${p.coaStatus} manufacturingCountryClaim=${p.manufacturingCountryClaim ?? "—"}`);
    console.log(`    ingredientsNormalized=[${(p.ingredientsNormalized ?? []).slice(0, 5).join(", ")}${(p.ingredientsNormalized ?? []).length > 5 ? "..." : ""}]`);
    console.log(`    → ${breakdown.join(", ")}`);
    console.log(`    → score=${score} (need 7 for A) → grade: ${grade} (stored: ${p.overallGrade ?? "null"})\n`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
