import fs from "fs/promises";
import path from "path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createJobRun, setJobRunPid } from "@/scripts/jobs/jobUtils";
import type { JobType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tsxCmd() {
  const bin = process.platform === "win32" ? "tsx.cmd" : "tsx";
  return path.join(process.cwd(), "node_modules", ".bin", bin);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const nextUrl = String(new URL(request.url).searchParams.get("next") || "/admin/populate").trim();

  const logDir = path.join(process.cwd(), ".cache", "job-logs");
  await fs.mkdir(logDir, { recursive: true });
  const logStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `${logStamp}-CRAWL.log`);

  let jobRunId: string | null = null;
  try {
    const run = await createJobRun("URL_CSV_EXTRACT" as JobType);
    jobRunId = run.jobRunId;
  } catch {
    return NextResponse.redirect(
      new URL(`${nextUrl}?error=${encodeURIComponent("CRAWL job not configured")}`, request.url),
      303
    );
  }

  const runArgs = [
    path.join(process.cwd(), "scripts", "ingest", "url_csv", "runUrlCsvExtract.ts"),
    "--crawlExisting",
    "true",
    "--dryRun",
    "false",
    "--writeDb",
    "true",
    "--jobRunId",
    jobRunId,
    "--usePlaywrightOfficial",
    "false",
  ];

  const out = await fs.open(logPath, "a");
  const child = spawn(tsxCmd(), runArgs, {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: ["ignore", out.fd, out.fd],
  });
  if (typeof child.pid === "number" && child.pid > 0) {
    await setJobRunPid(jobRunId, child.pid);
  }
  child.unref();
  await out.close();

  return NextResponse.redirect(
    new URL(`${nextUrl}?ran=crawl&started=crawl`, request.url),
    303
  );
}
