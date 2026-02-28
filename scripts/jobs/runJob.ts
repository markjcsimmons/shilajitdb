import "dotenv/config";

import { prisma } from "@/lib/db";
import { createJobRun, finishJobRunFailure, finishJobRunSuccess, preventConcurrentRuns } from "./jobUtils";
import { isJobType } from "./jobTypes";
import type { JobType } from "@prisma/client";
import { enrichOfficialCore } from "@/scripts/ingest/enrich/enrichOfficialCore";
import { checkLinks } from "@/scripts/ingest/verify/linkHealthCore";
import { runRobotsAllowedDiscovery } from "@/scripts/ingest/discovery/robotsAllowedDiscoveryCore";

function argValue(flag: string): string | null {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

async function runEnrichOfficial(max: number) {
  return enrichOfficialCore({ maxProducts: max, dryRun: false });
}

async function runLinkHealth(max: number) {
  return checkLinks({ maxToCheck: max });
}

async function runDiscoveryRobotsAllowed() {
  return runRobotsAllowedDiscovery({});
}

async function main() {
  const typeArg = argValue("--type");
  if (!typeArg || !isJobType(typeArg)) {
    console.error("Usage: tsx scripts/jobs/runJob.ts --type ENRICH_OFFICIAL|LINK_HEALTH|DISCOVERY_ROBOTS_ALLOWED [--max N]");
    process.exit(1);
  }

  const jobType = typeArg as JobType;
  const maxArg = argValue("--max");
  const max = maxArg ? Math.max(1, parseInt(maxArg, 10) || 50) : 50;

  await preventConcurrentRuns(jobType);

  const { jobRunId } = await createJobRun(jobType);
  if (typeof process.pid === "number" && process.pid > 0) {
    await setJobRunPid(jobRunId, process.pid);
  }

  try {
    if (jobType === "ENRICH_OFFICIAL") {
      const stats = await runEnrichOfficial(max);
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "LINK_HEALTH") {
      const stats = await runLinkHealth(max);
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "DISCOVERY_ROBOTS_ALLOWED") {
      const stats = await runRobotsAllowedDiscovery({});
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else {
      throw new Error(`Unknown job type: ${jobType}`);
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    await finishJobRunFailure(jobRunId, err.message, null);
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
