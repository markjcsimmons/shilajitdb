import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

// GET: preview bad listings without changing anything
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bad = await prisma.listing.findMany({
    where: { url: { not: { startsWith: "http" } } },
    select: {
      id: true,
      url: true,
      source: true,
      product: { select: { slug: true, name: true } },
    },
  });

  return NextResponse.json({ count: bad.length, listings: bad });
}

// POST: null-out all listing URLs that aren't absolute http(s) URLs
export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bad = await prisma.listing.findMany({
    where: { url: { not: { startsWith: "http" } } },
    select: { id: true, url: true },
  });

  if (bad.length === 0) {
    return NextResponse.json({ ok: true, fixed: 0, listings: [] });
  }

  await prisma.listing.updateMany({
    where: { id: { in: bad.map((l) => l.id) } },
    data: { url: null },
  });

  return NextResponse.json({
    ok: true,
    fixed: bad.length,
    listings: bad,
  });
}
