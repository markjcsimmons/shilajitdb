/**
 * fix-coa-same-domain.ts
 *
 * Finds all products where coaStatus = PUBLIC and the coaUrl domain
 * matches the brand's own website domain (i.e. no dedicated COA document —
 * just a product page being used as the COA link).
 *
 * For those products:
 *   - Sets coaStatus → PUBLIC_EMBEDDED
 *   - Recomputes transparencyGrade, qualityTier, overallGrade
 *   - Saves to DB
 *
 * Run with: npx tsx scripts/fix-coa-same-domain.ts
 */

import { prisma } from "../lib/db";
import {
  computeTransparencyGrade,
  computeQualityTier,
  computeOverallGrade,
} from "../lib/grading";

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

async function main() {
  const products = await prisma.product.findMany({
    where: { coaStatus: "PUBLIC", coaUrl: { not: null } },
    select: {
      id: true,
      name: true,
      coaUrl: true,
      coaStatus: true,
      transparencyGrade: true,
      qualityTier: true,
      overallGrade: true,
      form: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      officialDomain: true,
      brand: { select: { name: true, slug: true, websiteDomain: true, website: true } },
    },
  });

  console.log(`\nChecking ${products.length} products with coaStatus=PUBLIC...\n`);

  const toUpdate: typeof products = [];

  for (const p of products) {
    const coaDomain = extractDomain(p.coaUrl);
    const brandDomain =
      p.brand.websiteDomain?.replace(/^www\./, "").toLowerCase() ??
      extractDomain(p.brand.website) ??
      p.officialDomain?.replace(/^www\./, "").toLowerCase() ??
      null;

    if (coaDomain && brandDomain && coaDomain === brandDomain) {
      console.log(`  MATCH  ${p.brand.name} — ${p.name}`);
      console.log(`         coaUrl:     ${p.coaUrl}`);
      console.log(`         brandDomain: ${brandDomain}`);
      toUpdate.push(p);
    }
  }

  if (toUpdate.length === 0) {
    console.log("No matching products found. Nothing to update.");
    return;
  }

  console.log(`\nFound ${toUpdate.length} product(s) to update. Applying changes...\n`);

  for (const p of toUpdate) {
    const productForGrading = {
      form: p.form,
      coaStatus: "PUBLIC_EMBEDDED" as const,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };

    const transparency = computeTransparencyGrade(productForGrading);
    const quality = computeQualityTier(productForGrading);
    const overall = computeOverallGrade(productForGrading);

    await prisma.product.update({
      where: { id: p.id },
      data: {
        coaStatus: "PUBLIC_EMBEDDED",
        transparencyGrade: transparency.grade,
        qualityTier: quality.tier,
        overallGrade: overall,
      },
    });

    console.log(`  UPDATED ${p.brand.name} — ${p.name}`);
    console.log(
      `          overallGrade: ${p.overallGrade ?? "null"} → ${overall}`
    );
    console.log(
      `          transparencyGrade: ${p.transparencyGrade} → ${transparency.grade}`
    );
    console.log(
      `          qualityTier: ${p.qualityTier} → ${quality.tier}`
    );
    console.log();
  }

  console.log(`Done. ${toUpdate.length} product(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
