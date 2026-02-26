import "dotenv/config";

import { importListingsCsv } from "./importCsv";

// API-FIRST. Default mode: user exports CSV of Amazon results and we ingest.
export async function discoverAmazon(opts: { csvPath: string; dryRun: boolean }) {
  return await importListingsCsv({ csvPath: opts.csvPath, dryRun: opts.dryRun, wrapRun: false });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  const idx = process.argv.findIndex((a) => a === "--csv");
  const csvPath = idx >= 0 ? process.argv[idx + 1] : null;
  if (!csvPath) {
    console.error("Missing --csv=/path/to/amazon_export.csv");
    process.exit(1);
  }
  discoverAmazon({ csvPath, dryRun })
    .then(({ stats }) => console.log(JSON.stringify(stats, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

