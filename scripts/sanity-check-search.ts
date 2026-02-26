/**
 * Lightweight sanity check for search behavior:
 * - With query "shilajit": results should include LOW completeness products at the end (if any exist).
 * - With no query: results should exclude LOW completeness products.
 *
 * Run: npx tsx scripts/sanity-check-search.ts
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import {
  buildDefaultOrderBy,
  buildProductWhere,
  PAGE_SIZE,
  parseProductFilters,
} from "@/lib/search";

async function main() {
  console.log("Sanity check: search behavior\n");

  // 1) No query (homepage): should exclude LOW
  const noQueryFilters = parseProductFilters({});
  const noQueryWhere = buildProductWhere(noQueryFilters);
  const noQueryProducts = await prisma.product.findMany({
    where: noQueryWhere,
    orderBy: buildDefaultOrderBy(),
    take: PAGE_SIZE * 2,
    select: { id: true, name: true, dataCompleteness: true },
  });
  const lowInNoQuery = noQueryProducts.filter((p) => p.dataCompleteness === "LOW");
  if (lowInNoQuery.length > 0) {
    console.error("FAIL: Homepage (no query) should exclude LOW completeness products.");
    console.error("  Found LOW:", lowInNoQuery.length, lowInNoQuery.map((p) => p.name).slice(0, 3));
    process.exitCode = 1;
  } else {
    console.log("OK: Homepage (no query) excludes LOW completeness products.");
  }

  // 2) With query "shilajit": should include LOW at the end if they exist
  const withQueryFilters = parseProductFilters({ q: "shilajit" });
  const withQueryWhere = buildProductWhere(withQueryFilters);
  const withQueryProducts = await prisma.product.findMany({
    where: withQueryWhere,
    orderBy: buildDefaultOrderBy(),
    take: PAGE_SIZE * 2,
    select: { id: true, name: true, dataCompleteness: true },
  });
  const lowInWithQuery = withQueryProducts.filter((p) => p.dataCompleteness === "LOW");
  const verifiedInWithQuery = withQueryProducts.filter((p) => p.dataCompleteness !== "LOW");

  // If there are any LOW in results, they must all appear after all verified (HIGH/MEDIUM)
  const firstLowIndex = withQueryProducts.findIndex((p) => p.dataCompleteness === "LOW");
  const allVerifiedFirst =
    firstLowIndex === -1 || firstLowIndex >= verifiedInWithQuery.length;
  if (!allVerifiedFirst && lowInWithQuery.length > 0) {
    console.error("FAIL: With q=shilajit, LOW completeness products should appear only at the end.");
    console.error("  dataCompleteness order:", withQueryProducts.map((p) => p.dataCompleteness));
    process.exitCode = 1;
  } else {
    console.log("OK: With q=shilajit, verified first then LOW at the end.");
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
