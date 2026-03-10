/**
 * GET /api/health/db
 *
 * Quick DB connectivity check.  Use this to verify Prisma is working
 * before running the pipeline or after a deploy.
 *
 * Response:
 *   200 { ok: true,  latencyMs: number }
 *   500 { ok: false, error: string }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Must be Node.js runtime — Prisma's native engine won't run on Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 500 },
    );
  }

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, latencyMs: Date.now() - start });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
