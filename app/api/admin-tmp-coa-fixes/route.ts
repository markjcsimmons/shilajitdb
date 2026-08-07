import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeOverallGrade,
  computeQualityTier,
  computeTransparencyGrade,
} from "@/lib/grading";

export const dynamic = "force-dynamic";

const FIXES: Record<
  string,
  { coaStatus: "NONE" | "UNKNOWN" | "PUBLIC"; coaUrl?: string | null; coaNotes?: string | null }
> = {
  "etta-vita-urolithin-a-complex-w-shilajit-organic-sea-moss-ashwagandha-tongkat-ali-natural-energy":
    {
      coaStatus: "NONE",
      coaUrl: null,
      coaNotes:
        "coaUrl previously pointed to the product page, not an actual COA document. Manually verified no COA is present on the linked page — downgraded from PUBLIC to NONE.",
    },
  "stellar-health-shilajit-matrix-ubiquinol-coq10-pqq-astaxanthin-nad-supplement-clinical-mitochond":
    {
      coaStatus: "UNKNOWN",
      coaNotes:
        "Linked image is a marketing graphic, not a lab certificate: no accreditation number, no lab address/contact, all heavy metal values shown as '< LOQ' with no figures, and 'verified by' a non-standard body ('The Clinical Index'). Manufacturer (Stellar Health Labs LLC) appears to be the same entity as the brand, suggesting self-testing rather than independent third-party analysis. Downgraded from PUBLIC to UNKNOWN pending a real COA.",
    },
  "bossko-the-way-to-the-top-3200mg-pure-himalayan-shilajit-gummies-probiotics-magnesium-ashwagandh":
    {
      coaStatus: "PUBLIC",
      coaNotes:
        "COA from Shenzhen ZTS Testing Service Co., Ltd (not a recognized accredited lab). Heavy metals (Lead/Arsenic/Mercury/Cadmium) are all reported as '0%', which is not a standard or credible way to report heavy metal test results (expected: ppm or ND/<LOQ). Left as PUBLIC since a document exists, but flagged as low-confidence.",
    },
};

export async function POST() {
  const slugs = Object.keys(FIXES);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
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
    },
  });

  if (products.length !== slugs.length) {
    const found = products.map((p) => p.slug);
    return NextResponse.json(
      { error: "slug mismatch", missing: slugs.filter((s) => !found.includes(s)) },
      { status: 400 }
    );
  }

  const results = [];
  for (const p of products) {
    const fix = FIXES[p.slug];
    const newCoaStatus = fix.coaStatus;

    const g = {
      form: p.form,
      coaStatus: newCoaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };

    const updated = await prisma.product.update({
      where: { id: p.id },
      data: {
        coaStatus: newCoaStatus,
        ...(fix.coaUrl !== undefined ? { coaUrl: fix.coaUrl } : {}),
        coaNotes: fix.coaNotes,
        overallGrade: computeOverallGrade(g),
        qualityTier: computeQualityTier(g).tier,
        transparencyGrade: computeTransparencyGrade(g).grade,
      },
      select: {
        slug: true,
        coaStatus: true,
        coaUrl: true,
        coaNotes: true,
        overallGrade: true,
        qualityTier: true,
        transparencyGrade: true,
      },
    });
    results.push(updated);
  }

  return NextResponse.json({ ok: true, results });
}
