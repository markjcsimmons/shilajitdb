import "dotenv/config";

import { prisma } from "@/lib/db";
import type { JobStatus, JobType } from "@prisma/client";
import type { JobStats } from "./jobTypes";

const CONCURRENT_RUN_MINUTES = 60;

export async function createJobRun(jobType: JobType): Promise<{ jobRunId: string; jobId: string }> {
  const job = await prisma.job.findUnique({
    where: { type: jobType, isEnabled: true },
    select: { id: true },
  });
  if (!job) throw new Error(`Job not found or disabled: ${jobType}`);

  const run = await prisma.jobRun.create({
    data: { jobId: job.id, status: "RUNNING" },
    select: { id: true, jobId: true },
  });
  return { jobRunId: run.id, jobId: job.id };
}

export async function setJobRunPid(jobRunId: string, pid: number): Promise<void> {
  await prisma.jobRun.update({
    where: { id: jobRunId },
    data: { pid },
    select: { id: true },
  });
}

export async function finishJobRunSuccess(
  jobRunId: string,
  statsJson: JobStats
): Promise<void> {
  await prisma.jobRun.updateMany({
    where: { id: jobRunId, status: "RUNNING" },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      statsJson: statsJson as Record<string, unknown>,
      errorText: null,
    },
  });
}

export async function finishJobRunFailure(
  jobRunId: string,
  errorText: string,
  statsJson?: JobStats | null
): Promise<void> {
  await prisma.jobRun.updateMany({
    where: { id: jobRunId, status: "RUNNING" },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorText,
      statsJson: statsJson ? (statsJson as Record<string, unknown>) : undefined,
    },
  });
}

/**
 * If a RUNNING run exists for this job type within the last N minutes, throw and exit.
 */
export async function preventConcurrentRuns(jobType: JobType): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { type: jobType },
    select: { id: true },
  });
  if (!job) return;

  const since = new Date(Date.now() - CONCURRENT_RUN_MINUTES * 60 * 1000);
  const running = await prisma.jobRun.findFirst({
    where: { jobId: job.id, status: "RUNNING", startedAt: { gte: since } },
    select: { id: true },
  });
  if (running) {
    throw new Error(
      `A ${jobType} run is already in progress (started within last ${CONCURRENT_RUN_MINUTES} min). Aborting.`
    );
  }
}
