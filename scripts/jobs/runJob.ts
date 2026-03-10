import "dotenv/config";

import { prisma } from "@/lib/db";
import { createJobRun, finishJobRunFailure, finishJobRunSuccess, preventConcurrentRuns, setJobRunPid } from "./jobUtils";
import { isJobType } from "./jobTypes";
import type { JobType } from "@prisma/client";
import { enrichOfficialCore } from "@/scripts/ingest/enrich/enrichOfficialCore";
import { checkLinks } from "@/scripts/ingest/verify/linkHealthCore";
import { runRobotsAllowedDiscovery } from "@/scripts/ingest/discovery/robotsAllowedDiscoveryCore";
import { runDsldImageDiscovery } from "@/scripts/ingest/discovery/dsld_images/discoverOfficialFromDsldImages";
import { runSitemapHarvest } from "@/scripts/ingest/discovery/sitemaps/harvestOfficialProductUrlsFromSitemaps";

function argValue(flag: string): string | null {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const typeArg = argValue("--type");
  if (!typeArg || !isJobType(typeArg)) {
    console.error(
      "Usage: tsx scripts/jobs/runJob.ts --type ENRICH_OFFICIAL|LINK_HEALTH|DISCOVERY_ROBOTS_ALLOWED|DISCOVER_OFFICIAL_FROM_DSLD_IMAGES|DISCOVER_OFFICIAL_FROM_SITEMAPS [--max N] [--maxDomains N] [--maxUrls N]"
    );
    process.exit(1);
  }

  const jobType = typeArg as JobType;
  const maxArg = argValue("--max");
  const max = maxArg ? Math.max(1, parseInt(maxArg, 10) || 50) : 50;
  const maxDomainsArg = argValue("--maxDomains");
  const maxUrlsArg = argValue("--maxUrls");

  await preventConcurrentRuns(jobType);

  const { jobRunId } = await createJobRun(jobType);
  if (typeof process.pid === "number" && process.pid > 0) {
    await setJobRunPid(jobRunId, process.pid);
  }

  try {
    if (jobType === "ENRICH_OFFICIAL") {
      const stats = await enrichOfficialCore({ maxProducts: max, dryRun: false });
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "LINK_HEALTH") {
      const stats = await checkLinks({ maxToCheck: max });
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "DISCOVERY_ROBOTS_ALLOWED") {
      const stats = await runRobotsAllowedDiscovery({});
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "DISCOVER_OFFICIAL_FROM_DSLD_IMAGES") {
      const stats = await runDsldImageDiscovery({ max });
      await finishJobRunSuccess(jobRunId, stats);
      console.log(JSON.stringify(stats, null, 2));
    } else if (jobType === "DISCOVER_OFFICIAL_FROM_SITEMAPS") {
      const maxDomains = maxDomainsArg ? Math.max(1, parseInt(maxDomainsArg, 10) || 50) : 50;
      const maxUrlsPerDomain = maxUrlsArg ? Math.max(1, parseInt(maxUrlsArg, 10) || 200) : 200;
      const stats = await runSitemapHarvest({ maxDomains, maxUrlsPerDomain });
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
