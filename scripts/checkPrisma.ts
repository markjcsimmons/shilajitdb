/**
 * Pre-flight check for Prisma + database connectivity.
 * Run automatically via "predev" and "prebuild" package.json hooks.
 *
 * Checks:
 *   1. DATABASE_URL is set in environment.
 *   2. node_modules/.prisma/client exists (prisma generate has been run).
 *   3. Can execute SELECT 1 against the database within 5 seconds.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed (error printed to stderr)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function fail(msg: string): never {
  console.error(`\n  \x1b[31m✗\x1b[0m ${msg}\n`);
  process.exit(1);
}

function warn(msg: string) {
  console.warn(`  \x1b[33m⚠\x1b[0m ${msg}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n\x1b[1mPrisma pre-flight check\x1b[0m");

  // ── Check 1: DATABASE_URL ───────────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail(
      "DATABASE_URL is not set.\n" +
        "    → Copy .env.example to .env and set DATABASE_URL to your Postgres connection string.\n" +
        "    → Then re-run: npm run dev",
    );
  }
  ok(`DATABASE_URL is set (${dbUrl.replace(/:([^:@]+)@/, ":***@")})`);

  // ── Check 2: node_modules/.prisma ──────────────────────────────────────────
  const prismaClientDir = path.join(
    process.cwd(),
    "node_modules",
    ".prisma",
    "client",
  );
  if (!fs.existsSync(prismaClientDir)) {
    fail(
      "node_modules/.prisma/client not found — Prisma client has not been generated.\n" +
        "    → Run: npm run prisma:reset-client\n" +
        "      (or: rm -rf node_modules/.prisma && npx prisma generate)",
    );
  }
  // Check there's only ONE generated client (not stale duplicates).
  const entries = fs.readdirSync(prismaClientDir);
  const clientFiles = entries.filter(
    (f) => f.startsWith("client") && f.endsWith(".js"),
  );
  if (clientFiles.length > 1) {
    warn(
      `Found ${clientFiles.length} generated client files — possible stale artifacts.\n` +
        "    → Run: npm run prisma:reset-client to clean and regenerate.",
    );
  } else {
    ok("node_modules/.prisma/client exists (1 generated client)");
  }

  // ── Check 3: DB connectivity ────────────────────────────────────────────────
  const TIMEOUT_MS = 5000;

  // Lazy-import after env check so we get a clear error if missing.
  let PrismaClient: typeof import("@prisma/client").PrismaClient;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch {
    fail(
      "@prisma/client could not be imported.\n" +
        "    → Run: npm run prisma:reset-client",
    );
  }

  const client = new PrismaClient({ log: [] });

  const timeoutHandle = setTimeout(() => {
    console.error(
      `\n  \x1b[31m✗\x1b[0m Database query timed out after ${TIMEOUT_MS}ms.\n` +
        "    → Check that DATABASE_URL is reachable and Postgres is running.\n",
    );
    process.exit(1);
  }, TIMEOUT_MS);

  try {
    const start = Date.now();
    await client.$queryRaw`SELECT 1`;
    clearTimeout(timeoutHandle);
    ok(`Database responded in ${Date.now() - start}ms`);
  } catch (err) {
    clearTimeout(timeoutHandle);
    fail(
      `Database connection failed: ${err instanceof Error ? err.message : String(err)}\n` +
        "    → Ensure DATABASE_URL is correct and the database is running.",
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }

  console.log("\n\x1b[32mAll Prisma checks passed.\x1b[0m\n");
}

main().catch((err) => {
  console.error("checkPrisma unexpected error:", err);
  process.exit(1);
});
