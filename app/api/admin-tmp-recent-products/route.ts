import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      slug: true,
      name: true,
      createdAt: true,
      coaStatus: true,
      heavyMetalsTested: true,
      coaUrl: true,
      overallGrade: true,
      qualityTier: true,
      dataCompleteness: true,
      isCanonical: true,
      brand: { select: { name: true } },
      _count: { select: { evidence: true } },
    },
  });

  return NextResponse.json({
    count: products.length,
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand.name,
      createdAt: p.createdAt,
      coaStatus: p.coaStatus,
      heavyMetalsTested: p.heavyMetalsTested,
      coaUrl: p.coaUrl,
      overallGrade: p.overallGrade,
      qualityTier: p.qualityTier,
      dataCompleteness: p.dataCompleteness,
      isCanonical: p.isCanonical,
      evidenceCount: p._count.evidence,
    })),
  });
}
