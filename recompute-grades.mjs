#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Implement grading logic inline
function manufacturingPointsFromCountry(country) {
  const c = (country ?? "").trim();
  if (!c) return 0;
  const u = c.toUpperCase();
  if (u === "USA" || u === "US" || u === "UNITED STATES") return 3;
  return 1;
}

function overallGradeScore(product) {
  let score = 0;

  // COA scoring
  if (product.coaStatus === "PUBLIC") score += 2;
  else if (product.coaStatus === "PUBLIC_EMBEDDED") score += 1;
  else if (product.coaStatus === "REQUEST_ONLY") score += 1;

  // Named 3rd-party lab
  if (product.thirdPartyTestingLab?.trim()) score += 2;

  // Form = RESIN
  if (product.form === "RESIN") score += 4;

  // Manufacturing country
  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  score += mfgPoints;

  // GMP certified
  if (product.gmpCertified) score += 1;

  // Patents
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

async function recomputeAllGrades() {
  console.log("🔄 Fetching all products...\n");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      overallGrade: true,
      brand: { select: { name: true, slug: true } },
    },
  });

  console.log(`Found ${products.length} products. Computing new grades...\n`);

  const updates = [];
  const purblackResults = [];
  let totalChanged = 0;

  for (const p of products) {
    const score = overallGradeScore(p);
    const newGrade = computeOverallGrade(score);

    if (newGrade !== p.overallGrade) {
      updates.push({
        id: p.id,
        name: p.name,
        oldGrade: p.overallGrade,
        newGrade,
        score,
      });
      totalChanged++;
    }

    // Track Purblack separately
    if (p.brand.slug === "purblack") {
      purblackResults.push({
        name: p.name,
        form: p.form,
        coa: p.coaStatus,
        lab: p.thirdPartyTestingLab || "None",
        usa: p.manufacturingCountryClaim === "USA" ? "✓" : "✗",
        gmp: p.gmpCertified ? "✓" : "✗",
        patent: p.hasPatentClaim ? "✓" : "✗",
        score,
        oldGrade: p.overallGrade,
        newGrade,
      });
    }
  }

  // Show Purblack results first
  if (purblackResults.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 PURBLACK PRODUCTS (New Grades)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    for (const p of purblackResults) {
      const arrow = p.oldGrade === p.newGrade ? "→" : "⬆️ ";
      console.log(`${p.name}`);
      console.log(
        `  Score: ${p.score}/14 | Grade: ${p.oldGrade} ${arrow} ${p.newGrade}`
      );
      console.log(`  Form: ${p.form} | COA: ${p.coa} | Lab: ${p.lab}`);
      console.log(
        `  USA: ${p.usa} | GMP: ${p.gmp} | Patent: ${p.patent}`
      );
      console.log();
    }
  }

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 OVERALL CHANGES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Total products: ${products.length}`);
  console.log(`Grades changed: ${totalChanged}\n`);

  // Grade distribution
  const gradeChanges = {};
  for (const u of updates) {
    const key = `${u.oldGrade} → ${u.newGrade}`;
    gradeChanges[key] = (gradeChanges[key] || 0) + 1;
  }

  if (Object.keys(gradeChanges).length > 0) {
    console.log("Grade transitions:");
    for (const [key, count] of Object.entries(gradeChanges).sort()) {
      console.log(`  ${key}: ${count} products`);
    }
    console.log();
  }

  // Apply updates
  if (updates.length > 0) {
    console.log(`✅ Applying ${updates.length} grade updates to database...\n`);

    for (const u of updates) {
      await prisma.product.update({
        where: { id: u.id },
        data: { overallGrade: u.newGrade },
      });
    }

    console.log("✅ All grades updated successfully!");
  } else {
    console.log("ℹ️  No changes needed.");
  }

  await prisma.$disconnect();
}

recomputeAllGrades().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
