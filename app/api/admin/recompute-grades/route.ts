import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  computeOverallGrade,
  computeQualityTier,
  computeTransparencyGrade,
} from "@/lib/grading";

export const maxDuration = 60; // Vercel max for pro plan

export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const updates = products.map((p) => {
    const g = {
      form: p.form,
      coaStatus: p.coaStatus,
      manufacturingCountryClaim: p.manufacturingCountryClaim,
      thirdPartyTestingLab: p.thirdPartyTestingLab,
      gmpCertified: p.gmpCertified,
      hasPatentClaim: p.hasPatentClaim,
      brandSlug: p.brand.slug,
    };
    return {
      id: p.id,
      overallGrade: computeOverallGrade(g),
      qualityTier: computeQualityTier(g).tier,
      transparencyGrade: computeTransparencyGrade(g).grade,
    };
  });

  await prisma.$transaction(
    updates.map(({ id, overallGrade, qualityTier, transparencyGrade }) =>
      prisma.product.update({
        where: { id },
        data: { overallGrade, qualityTier, transparencyGrade },
      })
    )
  );

  return NextResponse.json({ ok: true, count: updates.length });
}
