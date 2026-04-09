import "dotenv/config";

import { prisma } from "@/lib/db";
import { computeOverallGrade, overallGradeScore } from "@/lib/grading";

const GRADE_ORDER = ["A_PLUS", "A", "B", "C", "D", "E", "F"] as const;

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      brand: { select: { slug: true } },
    },
  });

  const distribution: Record<string, number> = {};
  for (const g of GRADE_ORDER) {
    distribution[g] = 0;
  }

  for (const p of products) {
    const productForGrading = {
      form: p.form,
      coaStatus: p.coaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };
    const grade = computeOverallGrade(productForGrading);
    distribution[grade] += 1;

    await prisma.product.update({
      where: { id: p.id },
      data: { overallGrade: grade },
    });
  }

  console.log("\nOverall grade distribution (all products):\n");
  for (const g of GRADE_ORDER) {
    const count = distribution[g];
    const pct = products.length ? ((count / products.length) * 100).toFixed(1) : "0";
    const bar = "█".repeat(Math.round((count / (products.length || 1)) * 40)) + "░".repeat(40 - Math.round((count / (products.length || 1)) * 40));
    console.log(`  ${g.padEnd(6)} ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
  console.log(`\n  Total: ${products.length} products\n`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
