import "dotenv/config";

import { prisma } from "@/lib/db";
import { importDiscoveryCsv } from "@/scripts/ingest/discovery/importCsv";
import { runBrandCrawl } from "@/scripts/ingest/web/crawlBrandSites";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const pathIdx = argv.findIndex((a) => a === "--path");
  const path = pathIdx >= 0 ? argv[pathIdx + 1] : process.env.DISCOVERY_CSV_PATH;
  return { dryRun, path };
}

async function main() {
  const { dryRun, path } = parseArgs(process.argv.slice(2));
  if (path) {
    await importDiscoveryCsv({ csvPath: path, dryRun });
  }
  await runBrandCrawl({ dryRun });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => console.log("Discovery run complete."))
    .finally(async () => prisma.$disconnect());
}

