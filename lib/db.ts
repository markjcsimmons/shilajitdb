import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaExtendedClient | undefined;
}

class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.available = Math.max(1, Math.floor(concurrency));
  }

  async acquire() {
    if (this.available > 0) {
      this.available -= 1;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.available -= 1;
  }

  release() {
    this.available += 1;
    const next = this.queue.shift();
    if (next) next();
  }
}

function asPositiveInt(v: unknown) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return undefined;
  return Math.floor(n);
}

function isTransientPrismaError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("Timed out fetching a new connection from the connection pool") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("Error in PostgreSQL connection: Error { kind: Closed") ||
    msg.includes("Can't reach database server") ||
    msg.includes("P1001")
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  const concurrency = asPositiveInt(process.env.PRISMA_QUERY_CONCURRENCY) ?? 2;
  const sem = new Semaphore(concurrency);
  const attempts = asPositiveInt(process.env.PRISMA_QUERY_RETRY_ATTEMPTS) ?? 3;

  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await sem.acquire();
          try {
            for (let i = 0; i < attempts; i += 1) {
              try {
                return await query(args);
              } catch (e) {
                if (!isTransientPrismaError(e) || i === attempts - 1) throw e;
                await sleep(250 * 2 ** i);
              }
            }
            // unreachable
            return await query(args);
          } finally {
            sem.release();
          }
        },
      },
    },
  });

  return extended;
}

export type PrismaExtendedClient = ReturnType<typeof createPrismaClient>;

export const prisma: PrismaExtendedClient = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

