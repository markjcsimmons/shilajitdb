import { prisma } from "@/lib/db";
import type { IngestionRunStatus, IngestionRunType, Prisma } from "@prisma/client";

export type IngestionStats = {
  brandsProcessed: number;
  productsProcessed: number;
  evidenceAdded: number;
  coaPublicCount: number;
  coaRequestCount: number;
  manufacturingClearCount: number;
  errorsCount: number;
  skippedCount: number;
  notes?: string[];
  errorsSample?: Array<{ message: string; context?: string }>;
};

export function createEmptyStats(): IngestionStats {
  return {
    brandsProcessed: 0,
    productsProcessed: 0,
    evidenceAdded: 0,
    coaPublicCount: 0,
    coaRequestCount: 0,
    manufacturingClearCount: 0,
    errorsCount: 0,
    skippedCount: 0,
    notes: [],
    errorsSample: [],
  };
}

export async function startRun(type: IngestionRunType) {
  const run = await prisma.ingestionRun.create({
    data: { type, status: "RUNNING", pid: process.pid },
    select: { id: true },
  });
  return run.id;
}

export async function finishRun(
  runId: string,
  status: IngestionRunStatus,
  stats: IngestionStats,
  errorText?: string | null
) {
  // If a run was canceled from the UI, don't overwrite its terminal status.
  await prisma.ingestionRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status,
      finishedAt: new Date(),
      statsJson: stats as Prisma.InputJsonValue,
      errorText: errorText ?? null,
    },
  });
}

