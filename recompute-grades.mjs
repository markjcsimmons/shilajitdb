#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Grading logic (mirrors lib/grading.ts)
// ---------------------------------------------------------------------------

function hasManufacturingCountry(country) {
  return (country ?? "").trim().length > 0;
}

function manufacturingPointsFromCountry(country) {
  const c = (country ?? "").trim();
  if (!c) return 0;
  const u = c.toUpperCase();
  if (u === "USA" || u === "US" || u === "UNITED STATES") return 3;
  return 1;
}

function computeQualityTier(product) {
  const isResin = product.form === "RESIN";
  const isPublicCoa = product.coaStatus === "PUBLIC";
  const hasNamedLab = !!product.thirdPartyTestingLab?.trim();
  const hasMfgCountry = hasManufacturingCountry(product.manufacturingCountryClaim);
  const isGmp = !!product.gmpCertified;

  // ULTRA_PREMIUM: all 6 signals (resin + public COA + named lab + country + GMP + patent)
  const hasPatent = !!product.hasPatentClaim;
  if (isResin && isPublicCoa && hasNamedLab && hasMfgCountry && isGmp && hasPatent) {
    return "ULTRA_PREMIUM";
  }

  // PREMIUM: public COA + named lab (any form)
  if (isPublicCoa && hasNamedLab) {
    return "PREMIUM";
  }

  // AVERAGE: some transparency but not premium
  const hasCoa =
    product.coaStatus === "PUBLIC" ||
    product.coaStatus === "PUBLIC_EMBEDDED" ||
    product.coaStatus === "REQUEST_ONLY";

  if (hasCoa || hasNamedLab) {
    return "AVERAGE";
  }

  return "POOR";
}

function overallGradeScore(product) {
  let score = 0;

  if (product.coaStatus === "PUBLIC") score += 2;
  else if (product.coaStatus === "PUBLIC_EMBEDDED") score += 1;
  else if (product.coaStatus === "REQUEST_ONLY") score += 1;

  if (product.thirdPartyTestingLab?.trim()) score += 2;
  if (product.form === "RESIN") score += 4;

  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  score += mfgPoints;

  if (product.gmpCertified) score += 1;
  if (product.hasPatentClaim) score += 2;

  return score;
}

function computeOverallGrade(score) {
  if (score >= 13) return "A_PLUS";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 4) return "C";
  if (score >= 2) return "D";
  if (score >= 1) return "E";
  return "F";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function recomputeAllGrades() {
  console.log("🔄 Fetching all products...\n");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      overallGrade: true,
      qualityTier: true,
      brand: { select: { name: true, slug: true } },
    },
  });

  console.log(`Found ${products.length} products. Computing grades...\n`);

  const updates = [];

  for (const p of products) {
    const score = overallGradeScore(p);
    const newGrade = computeOverallGrade(score);
    const newTier = computeQualityTier(p);

    const gradeChanged = newGrade !== p.overallGrade;
    const tierChanged = newTier !== p.qualityTier;

    if (gradeChanged || tierChanged) {
      updates.push({ id: p.id, name: p.name, brand: p.brand.name, newGrade, newTier, oldGrade: p.overallGrade, oldTier: p.qualityTier, score });
    }
  }

  // Show changes
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 CHANGES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Total products: ${products.length}`);
  console.log(`Products needing update: ${updates.length}\n`);

  for (const u of updates) {
    console.log(`${u.brand} — ${u.name}`);
    console.log(`  Grade: ${u.oldGrade} → ${u.newGrade} | Tier: ${u.oldTier} → ${u.newTier} | Score: ${u.score}/14`);
  }

  if (updates.length === 0) {
    console.log("ℹ️  No changes needed.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n✅ Applying ${updates.length} updates...\n`);

  await prisma.$transaction(
    updates.map((u) =>
      prisma.product.update({
        where: { id: u.id },
        data: { overallGrade: u.newGrade, qualityTier: u.newTier },
      })
    )
  );

  console.log("✅ Done!");
  await prisma.$disconnect();
}

recomputeAllGrades().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
