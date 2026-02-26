import "dotenv/config";

import { prisma } from "@/lib/db";
import { createEmptyStats, finishRun, startRun } from "@/scripts/ingest/shared/observability";
import { importListingsCsv } from "./importCsv";
import { discoverAmazon } from "./discoverAmazon";
import { discoverIHerb } from "./discoverIHerb";
import { discoverGoogleShopping } from "./discoverGoogleShopping";

function argValue(flag: string) {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const provider = (argValue("--provider") ?? "all").toLowerCase();
  const csvPath = argValue("--csvPath") ?? argValue("--path") ?? null;
  return { dryRun, provider, csvPath };
}

export async function runDiscovery(opts: { dryRun: boolean; provider: string; csvPath: string | null }) {
  const runId = await startRun("DISCOVERY");
  const stats = createEmptyStats();
  stats.notes?.push(`provider=${opts.provider}`);

  try {
    if (opts.provider === "csv") {
      if (!opts.csvPath) throw new Error("Missing --csvPath for provider=csv");
      await importListingsCsv({ csvPath: opts.csvPath, dryRun: opts.dryRun, wrapRun: false });
    } else if (opts.provider === "amazon") {
      if (!opts.csvPath) throw new Error("Missing --csvPath for provider=amazon (manual export CSV)");
      await discoverAmazon({ csvPath: opts.csvPath, dryRun: opts.dryRun });
    } else if (opts.provider === "google_shopping") {
      if (!opts.csvPath) throw new Error("Missing --csvPath for provider=google_shopping (manual CSV)");
      await discoverGoogleShopping({ csvPath: opts.csvPath, dryRun: opts.dryRun });
    } else if (opts.provider === "iherb") {
      const r = await discoverIHerb({ dryRun: opts.dryRun });
      stats.notes?.push(`iherb discovered=${r.discovered} ingested=${r.ingested}`);
    } else if (opts.provider === "all") {
      // Safe default: iHerb lightweight (robots-respecting). Marketplaces via CSV.
      const r = await discoverIHerb({ dryRun: opts.dryRun });
      stats.notes?.push(`iherb discovered=${r.discovered} ingested=${r.ingested}`);
      if (opts.csvPath) {
        await importListingsCsv({ csvPath: opts.csvPath, dryRun: opts.dryRun, wrapRun: false });
      } else {
        stats.notes?.push("No --csvPath provided; skipped csv provider in all mode.");
      }
    } else {
      throw new Error(`Unknown provider: ${opts.provider}`);
    }

    await finishRun(runId, "SUCCESS", stats, null);
    return { runId, stats };
  } catch (e: any) {
    stats.errorsCount += 1;
    await finishRun(runId, "FAILED", stats, e?.message ? String(e.message) : String(e));
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dryRun, provider, csvPath } = parseArgs(process.argv.slice(2));
  runDiscovery({ dryRun, provider, csvPath })
    .then(({ runId, stats }) => {
      console.log(`Discovery run complete. runId=${runId}`);
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
