import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB_LOG_DIR = path.join(process.cwd(), ".cache", "job-logs");
const INGEST_LOG_DIR = path.join(process.cwd(), ".cache", "ingest-logs");
const MAX_LINES = 200;

function getLastLines(text: string, n: number): string {
  const lines = text.split(/\r?\n/);
  if (lines.length <= n) return text;
  return lines.slice(-n).join("\n");
}

export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "job_run";
  const type = searchParams.get("type") ?? "";

  if (!type.trim()) {
    return new NextResponse("Missing type= (e.g. ENRICH_OFFICIAL, DISCOVERY_ROBOTS_ALLOWED) or job= for ingestion.", {
      status: 400,
      headers: { "content-type": "text/plain" },
    });
  }

  try {
    const dir = kind === "ingestion" ? INGEST_LOG_DIR : JOB_LOG_DIR;
    const suffix = kind === "ingestion" ? `-${type}.log` : `-${type}.log`;
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith(suffix))
      .map((e) => ({ name: e.name, path: path.join(dir, e.name) }));
    if (files.length === 0) {
      return new NextResponse(`No log files found for ${type}. Run a job first.`, {
        status: 404,
        headers: { "content-type": "text/plain" },
      });
    }
    const stats = await Promise.all(files.map((f) => fs.stat(f.path).then((s) => ({ ...f, mtime: s.mtimeMs }))));
    stats.sort((a, b) => b.mtime - a.mtime);
    const latest = stats[0];
    const content = await fs.readFile(latest.path, "utf8").catch(() => "");
    const tail = getLastLines(content, MAX_LINES);
    const header = `--- Last ${MAX_LINES} lines of ${latest.name} (refresh for updates) ---\n\n`;
    return new NextResponse(header + tail, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`Error reading log: ${msg}`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}
