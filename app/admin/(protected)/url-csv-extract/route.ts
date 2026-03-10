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

  const formData = await request.formData();
  const file = formData.get("file");
  const writeDb = formData.get("writeDb") === "true";
  const nextUrl = String(formData.get("next") ?? "/admin/populate").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(
      new URL(`${nextUrl}?error=${encodeURIComponent("No CSV file provided")}`, request.url),
      303
    );
  }

  const uploadDir = path.join(process.cwd(), ".cache", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const stamp = Date.now();
  const inputPath = path.join(uploadDir, `url-csv-input-${stamp}.csv`);
  const outputPath = path.join(uploadDir, `url-csv-enriched-${stamp}.csv`);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(inputPath, buf, "utf8");

  const logDir = path.join(process.cwd(), ".cache", "job-logs");
  await fs.mkdir(logDir, { recursive: true });
  const logStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `${logStamp}-URL_CSV_EXTRACT.log`);

  const { jobRunId } = await createJobRun("URL_CSV_EXTRACT" as JobType);

  const runArgs = [
    path.join(process.cwd(), "scripts", "ingest", "url_csv", "runUrlCsvExtract.ts"),
    "--input",
    inputPath,
    "--output",
    outputPath,
    "--dryRun",
    "false",
    "--writeDb",
    writeDb ? "true" : "false",
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

  const ran = writeDb ? "url_csv_extract_db" : "url_csv_extract";
  return NextResponse.redirect(
    new URL(`${nextUrl}?ran=${ran}&started=url_csv_extract`, request.url),
    303
  );
}
