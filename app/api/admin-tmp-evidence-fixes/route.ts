import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeOverallGrade,
  computeQualityTier,
  computeTransparencyGrade,
} from "@/lib/grading";

export const dynamic = "force-dynamic";

// Products getting a 2nd evidence row (their official product page) to clear
// the evidence >= 2 threshold for indexing/sitemap inclusion.
const ADD_EVIDENCE: Record<string, string> = {
  "sakoon-nutrition-shilajit-black-seed-oil-gummies":
    "https://sakoonnutrition.com/products/shilajit-black-seed-oil-gummies",
  "xara-shilajita-pure-shilajit-gummies-with-gifts":
    "https://www.xarashilajit.com/products/xara-shilajit%C2%AE-pure-shilajit-gummies-with-gifts",
  "u-s-shilajit-high-potency-liquid-extract":
    "https://www.usshilajit.com/products/shilajit",
};

// Products whose coaStatus was downgraded — check their existing Evidence
// rows for stale COA entries pointing at the bad/removed link.
const AUDIT_SLUGS = [
  "etta-vita-urolithin-a-complex-w-shilajit-organic-sea-moss-ashwagandha-tongkat-ali-natural-energy",
  "stellar-health-shilajit-matrix-ubiquinol-coq10-pqq-astaxanthin-nad-supplement-clinical-mitochond",
];

export async function POST() {
  // 1. Audit stale evidence for the two downgraded products
  const auditProducts = await prisma.product.findMany({
    where: { slug: { in: AUDIT_SLUGS } },
    select: {
      id: true,
      slug: true,
      coaStatus: true,
      evidence: { select: { id: true, type: true, url: true } },
    },
  });

  const staleCoaEvidenceIds = auditProducts.flatMap((p) =>
    p.evidence.filter((e) => e.type === "COA").map((e) => e.id)
  );

  if (staleCoaEvidenceIds.length > 0) {
    await prisma.evidence.deleteMany({
      where: { id: { in: staleCoaEvidenceIds } },
    });
  }

  // 2. Add a 2nd OTHER-type evidence row for the indexing-threshold candidates
  const addSlugs = Object.keys(ADD_EVIDENCE);
  const addProducts = await prisma.product.findMany({
    where: { slug: { in: addSlugs } },
    select: { id: true, slug: true },
  });

  for (const p of addProducts) {
    await prisma.evidence.create({
      data: {
        productId: p.id,
        type: "OTHER",
        url: ADD_EVIDENCE[p.slug],
        sourceName: "Official product page",
      },
    });
  }

  // 3. Recompute grades for everything touched (evidence count doesn't feed
  // grading directly, but re-run to keep this consistent with prior fixes)
  const touchedSlugs = [...new Set([...AUDIT_SLUGS, ...addSlugs])];
  const forGrading = await prisma.product.findMany({
    where: { slug: { in: touchedSlugs } },
    select: {
      id: true,
      slug: true,
      form: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      thirdPartyTestingLab: true,
      gmpCertified: true,
      hasPatentClaim: true,
      brand: { select: { slug: true } },
      _count: { select: { evidence: true } },
    },
  });

  const results = [];
  for (const p of forGrading) {
    const g = {
      form: p.form,
      coaStatus: p.coaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };
    const updated = await prisma.product.update({
      where: { id: p.id },
      data: {
        overallGrade: computeOverallGrade(g),
        qualityTier: computeQualityTier(g).tier,
        transparencyGrade: computeTransparencyGrade(g).grade,
      },
      select: { slug: true, overallGrade: true, qualityTier: true, transparencyGrade: true },
    });
    results.push({ ...updated, evidenceCount: p._count.evidence });
  }

  return NextResponse.json({
    ok: true,
    staleCoaEvidenceRemoved: staleCoaEvidenceIds.length,
    auditDetail: auditProducts.map((p) => ({
      slug: p.slug,
      coaStatus: p.coaStatus,
      evidenceBefore: p.evidence,
    })),
    evidenceAdded: addProducts.map((p) => p.slug),
    results,
  });
}
