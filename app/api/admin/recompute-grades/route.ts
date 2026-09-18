import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { retagBestFor } from "@/lib/best-for-tags";
import { computeAllGrades, GRADING_SELECT, toProductForGrading } from "@/lib/grading";

export const maxDuration = 60; // Vercel max for pro plan

export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    select: { id: true, ...GRADING_SELECT },
  });

  const updates = products.map(({ id, ...p }) => ({ id, ...computeAllGrades(toProductForGrading(p)) }));

  await prisma.$transaction(
    updates.map(({ id, overallGrade, qualityTier, transparencyGrade }) =>
      prisma.product.update({
        where: { id },
        data: { overallGrade, qualityTier, transparencyGrade },
      })
    )
  );
  const retag = await retagBestFor(prisma, { apply: true });

  return NextResponse.json({ ok: true, count: updates.length, tagChanges: retag.changed });
}
