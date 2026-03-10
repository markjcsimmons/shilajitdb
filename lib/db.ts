/**
 * Canonical Prisma singleton for Next.js App Router.
 *
 * @prisma/client is listed in next.config.ts serverExternalPackages so
 * Next.js/Turbopack loads it via Node.js require() instead of bundling it.
 * This prevents the _napi_register_module_v1 / pthread_cond_wait deadlock
 * that occurs when Turbopack tries to bundle the native .node query engine.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.PRISMA_LOG === "1"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Backward-compatible type alias used by some files.
export type PrismaExtendedClient = PrismaClient;

export default prisma;
