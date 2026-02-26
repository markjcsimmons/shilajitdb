import "dotenv/config";

import { importListingsCsv } from "./importCsv";

// SAFE MODE: use manual CSV export / paste of URLs; do not scrape Google Shopping.
export async function discoverGoogleShopping(opts: { csvPath: string; dryRun: boolean }) {
  return await importListingsCsv({ csvPath: opts.csvPath, dryRun: opts.dryRun, wrapRun: false });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  const idx = process.argv.findIndex((a) => a === "--csv");
  const csvPath = idx >= 0 ? process.argv[idx + 1] : null;
  if (!csvPath) {
    console.error("Missing --csv=/path/to/google_shopping.csv");
    process.exit(1);
  }
  discoverGoogleShopping({ csvPath, dryRun })
    .then(({ stats }) => console.log(JSON.stringify(stats, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

