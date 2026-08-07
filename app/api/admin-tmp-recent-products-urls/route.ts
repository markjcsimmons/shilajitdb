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
      coaUrl: true,
      officialCanonicalUrl: true,
      brand: { select: { name: true } },
      evidence: {
        select: { type: true, url: true, sourceName: true },
      },
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
      coaUrl: p.coaUrl,
      officialCanonicalUrl: p.officialCanonicalUrl,
      evidence: p.evidence,
    })),
  });
}
