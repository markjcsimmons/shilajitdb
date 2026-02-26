import "dotenv/config";

import { prisma } from "@/lib/db";
import { enrichOfficialCore } from "./enrichOfficialCore";

export async function enrichOfficial(opts: { dryRun: boolean; maxProducts?: number }) {
  const stats = await enrichOfficialCore({
    maxProducts: opts.maxProducts,
    dryRun: opts.dryRun,
  });
  return {
    ok: true,
    ...stats,
    coaRequestCount: 0,
    manufacturingClearCount: stats.manufacturingClearFound,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  const idx = process.argv.findIndex((a) => a === "--max");
  const maxProducts = idx >= 0 ? Number(process.argv[idx + 1]) : undefined;
  enrichOfficial({ dryRun, maxProducts })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
