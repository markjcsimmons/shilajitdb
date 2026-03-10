/**
 * POST /api/admin/run-full-pipeline
 *
 * Spawns the full pipeline as a background process (detached child) so the
 * HTTP response returns immediately. The pipeline can take 5-30 minutes and
 * is tracked via IngestionRun records that appear in Recent Activity.
 *
 * Response:
 *   200 { success: true, message: "Pipeline started" }
 *   409 { success: false, error: "Pipeline already running." }
 *   401 { success: false, error: "Unauthorized" }
 *   500 { success: false, error: "..." }
 */

import fs from "fs/promises";
import path from "path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { isPipelineRunning, startPipelineRun } from "@/scripts/jobs/runFullPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tsxCmd() {
  const bin = process.platform === "win32" ? "tsx.cmd" : "tsx";
  return path.join(process.cwd(), "node_modules", ".bin", bin);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Concurrency guard — only one pipeline at a time.
    const alreadyRunning = await isPipelineRunning();
    if (alreadyRunning) {
      return NextResponse.json(
        { success: false, error: "Pipeline already running. Wait for it to finish or clear stuck runs." },
        { status: 409 },
      );
    }

    // Set up log file so output is persisted for /admin/logs.
    const logDir = path.join(process.cwd(), ".cache", "job-logs");
    await fs.mkdir(logDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(logDir, `${stamp}-FULL_PIPELINE.log`);

    const scriptPath = path.join(process.cwd(), "scripts", "jobs", "runFullPipeline.ts");
    const out = await fs.open(logPath, "a");

    // Create run BEFORE spawn to close race: second request will see isPipelineRunning=true.
    const runId = await startPipelineRun(null);

    const child = spawn(tsxCmd(), [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env, FULL_PIPELINE_RUN_ID: runId },
      detached: true,
      stdio: ["ignore", out.fd, out.fd],
    });
    child.unref();
    await out.close();

    return NextResponse.json({ success: true, message: "Pipeline started" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
