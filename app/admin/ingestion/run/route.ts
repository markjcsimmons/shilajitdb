import fs from "fs/promises";
import path from "path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthed } from "@/lib/admin-auth";
import { cancelIngestionRun } from "@/lib/ingestion/cancelIngestionRun";
import { isPidAlive } from "@/lib/ingestion/pid";
import type { IngestionRunType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const job = String(form.get("job") ?? "").trim();

  let scriptPath: string | null = null;
  const args: string[] = [];
  let runType: IngestionRunType | null = null;

  if (job === "dsld") {
    scriptPath = path.join(process.cwd(), "scripts", "ingest", "dsld", "ingestShilajitFromDsld.ts");
    runType = "DSLD";
    const max = asPositiveInt(form.get("maxLabels"));
    if (max) args.push("--max", String(max));
  } else if (job === "brand_crawl") {
    scriptPath = path.join(process.cwd(), "scripts", "ingest", "web", "crawlBrandSites.ts");
    runType = "BRAND_CRAWL";
    const max = asPositiveInt(form.get("maxBrands"));
    if (max) args.push("--max-brands", String(max));
  } else if (job === "discover_websites") {
    scriptPath = path.join(process.cwd(), "scripts", "ingest", "discovery", "discoverBrandWebsitesFromDsld.ts");
    runType = "DISCOVERY";
    const max = asPositiveInt(form.get("maxBrands"));
    if (max) args.push("--max-brands", String(max));
    const maxLabelsPerBrand = asPositiveInt(form.get("maxLabelsPerBrand"));
    if (maxLabelsPerBrand) args.push("--max-labels-per-brand", String(maxLabelsPerBrand));
  } else {
    return NextResponse.redirect(new URL("/admin/ingestion?started=invalid", request.url), 303);
  }

  if (runType) {
    const existing = await prisma.ingestionRun.findFirst({
      where: { type: runType, status: "RUNNING" },
      select: { id: true, pid: true, startedAt: true },
    });
    if (existing) {
      const ageMs = Date.now() - new Date(existing.startedAt).getTime();
      const isStale =
        (typeof existing.pid === "number" && !isPidAlive(existing.pid)) ||
        (existing.pid == null && ageMs > 10 * 60 * 1000);
      if (isStale) {
        await prisma.ingestionRun.updateMany({
          where: { id: existing.id, status: "RUNNING" },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            errorText:
              existing.pid == null
                ? "Detected stale RUNNING run (no pid recorded after 10+ minutes). Marked FAILED to unblock new runs."
                : `Detected stale RUNNING run (pid ${existing.pid} not alive). Marked FAILED to unblock new runs.`,
          },
        });
      } else {
      return NextResponse.redirect(
        new URL(`/admin/ingestion?started=${encodeURIComponent(`${job}_already_running`)}`, request.url),
        303
      );
      }
    }
  }

  // Background spawn for localhost/dev. Writes logs to .cache/ingest-logs.
  const logDir = path.join(process.cwd(), ".cache", "ingest-logs");
  await fs.mkdir(logDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `${stamp}-${job}.log`);

  const out = await fs.open(logPath, "a");
  const child = spawn(
    tsxCmd(),
    [scriptPath, ...args],
    {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: ["ignore", out.fd, out.fd],
    }
  );
  child.unref();
  await out.close();

  return NextResponse.redirect(new URL(`/admin/ingestion?started=${encodeURIComponent(job)}`, request.url), 303);
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  const runId = typeof body?.runId === "string" ? body.runId : "";
  if (action !== "cancel" || !runId) {
    return NextResponse.json({ ok: false, message: "Missing runId or invalid action." }, { status: 400 });
  }

  const result = await cancelIngestionRun(runId);
  return NextResponse.json(result, { status: result.status });
}

