import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const slugs = [
    "swanson-vitamins-full-spectrum-shiitake-mushroom",
    "gat-nitraflex-deep-wood",
  ];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, name: true, isCanonical: true },
  });

  return NextResponse.json({ found: products });
}
