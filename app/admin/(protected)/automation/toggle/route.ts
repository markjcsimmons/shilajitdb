import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const jobId = String(form.get("jobId") ?? "").trim();
  const isEnabled = String(form.get("isEnabled") ?? "").trim() === "1";

  if (!jobId) {
    return NextResponse.redirect(new URL("/admin/automation?error=missing_job", request.url), 303);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { isEnabled },
    select: { id: true },
  });
  return NextResponse.redirect(new URL("/admin/automation", request.url), 303);
}
