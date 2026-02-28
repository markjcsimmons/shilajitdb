import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { cancelIngestionRun } from "@/lib/ingestion/cancelIngestionRun";
import { cancelJobRun } from "@/lib/jobs/cancelJobRun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const runId = String(form.get("runId") ?? "").trim();
  const kind = String(form.get("kind") ?? "").trim();
  const nextUrl = String(form.get("next") ?? "").trim();
  const redirectTo =
    nextUrl && nextUrl.startsWith("/admin") ? nextUrl : "/admin/populate";

  if (!runId) {
    return NextResponse.redirect(new URL(`${redirectTo}?error=cancel_no_run_id`, request.url), 303);
  }

  if (kind === "ingestion") {
    await cancelIngestionRun(runId);
    return NextResponse.redirect(new URL(`${redirectTo}?ran=canceled_ingestion`, request.url), 303);
  }

  if (kind === "job_run") {
    await cancelJobRun(runId);
    return NextResponse.redirect(new URL(`${redirectTo}?ran=canceled_job`, request.url), 303);
  }

  return NextResponse.redirect(new URL(`${redirectTo}?error=cancel_invalid_kind`, request.url), 303);
}
