import fs from "fs/promises";
import path from "path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import type { JobType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB_TYPES: JobType[] = ["ENRICH_OFFICIAL", "LINK_HEALTH", "DISCOVERY_ROBOTS_ALLOWED"];

function tsxCmd() {
  const bin = process.platform === "win32" ? "tsx.cmd" : "tsx";
  return path.join(process.cwd(), "node_modules", ".bin", bin);
}

function asPositiveInt(v: unknown) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return undefined;
  return Math.floor(n);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const form = await request.formData();
  const type = String(form.get("type") ?? "").trim() as JobType;
  if (!JOB_TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/admin/automation?error=invalid_type", request.url), 303);
  }

  const job = await prisma.job.findUnique({
    where: { type, isEnabled: true },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.redirect(new URL("/admin/automation?error=job_disabled", request.url), 303);
  }

  const runArgs: string[] = [path.join(process.cwd(), "scripts", "jobs", "runJob.ts"), "--type", type];
  if (type === "ENRICH_OFFICIAL" || type === "LINK_HEALTH") {
    const max = asPositiveInt(form.get("max")) ?? (type === "ENRICH_OFFICIAL" ? 50 : 200);
    runArgs.push("--max", String(max));
  }

  const logDir = path.join(process.cwd(), ".cache", "job-logs");
  await fs.mkdir(logDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `${stamp}-${type}.log`);

  const out = await fs.open(logPath, "a");
  const child = spawn(tsxCmd(), runArgs, {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: ["ignore", out.fd, out.fd],
  });
  child.unref();
  await out.close();

  return NextResponse.redirect(
    new URL(`/admin/automation?started=${encodeURIComponent(type)}`, request.url),
    303
  );
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  const isEnabled = typeof body?.isEnabled === "boolean" ? body.isEnabled : null;

  if (!JOB_TYPES.includes(type as JobType) || isEnabled === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.job.update({
    where: { type: type as JobType },
    data: { isEnabled },
    select: { id: true },
  });
  return NextResponse.json({ ok: true });
}
