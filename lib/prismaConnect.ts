/**
 * Lightweight Prisma connectivity check with a hard timeout.
 *
 * Use at the start of admin API routes and pipeline triggers to fail fast
 * with a clear message rather than timing out silently later.
 *
 * Do NOT call this in every Server Component render — it adds ~50ms overhead.
 * Use it only in mutation/admin endpoints.
 */

import { prisma } from "./prisma";

export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

/**
 * Executes `SELECT 1` against the database with a configurable timeout.
 * Throws DatabaseConnectionError with a clear message on failure.
 */
export async function ensurePrismaConnected(timeoutMs = 5000): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new DatabaseConnectionError(
      "DATABASE_URL is not set. Check your .env file.",
    );
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new DatabaseConnectionError(
            `Database connection timed out after ${timeoutMs}ms. ` +
              "Check DATABASE_URL and ensure the database is reachable.",
          ),
        ),
      timeoutMs,
    ),
  );

  const connectPromise = prisma
    .$queryRaw<[{ result: number }]>`SELECT 1 AS result`
    .then(() => undefined)
    .catch((err: unknown) => {
      throw new DatabaseConnectionError(
        `Database connection failed: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    });

  await Promise.race([connectPromise, timeoutPromise]);
}
