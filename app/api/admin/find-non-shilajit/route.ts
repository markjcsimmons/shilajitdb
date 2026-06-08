import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

// GET: find products that look like non-shilajit (shiitake, mushroom, etc.)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "shiitake", mode: "insensitive" } },
        { name: { contains: "mushroom", mode: "insensitive" } },
        { slug: { contains: "shiitake" } },
        { slug: { contains: "swanson" } },
        { brand: { slug: { contains: "swanson" } } },
        { brand: { name: { contains: "swanson", mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      isCanonical: true,
      dataCompleteness: true,
      brand: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({ count: candidates.length, products: candidates });
}

// POST: set isCanonical=false on all found products (makes them noindex)
export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "shiitake", mode: "insensitive" } },
        { name: { contains: "mushroom", mode: "insensitive" } },
        { slug: { contains: "shiitake" } },
        { slug: { contains: "swanson" } },
        { brand: { slug: { contains: "swanson" } } },
        { brand: { name: { contains: "swanson", mode: "insensitive" } } },
      ],
    },
    select: { id: true, slug: true, name: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, fixed: 0, products: [] });
  }

  await prisma.product.updateMany({
    where: { id: { in: candidates.map((p) => p.id) } },
    data: { isCanonical: false },
  });

  return NextResponse.json({ ok: true, fixed: candidates.length, products: candidates });
}
