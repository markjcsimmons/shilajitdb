/**
 * Rebuild the bestForTags that drive /best/[tag] — see lib/best-for-tags.ts for the rules
 * and ranking. This also runs automatically after admin saves, recomputes, CSV imports and
 * the regrade scripts; run it by hand to preview what the current data would produce.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/retag-best-for.ts
 * Apply:    ./node_modules/.bin/tsx scripts/retag-best-for.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { costPerQualityPoint, qualityScore, rankForTag, retagBestFor, type RankRow } from "../lib/best-for-tags";

const prisma = new PrismaClient();

const SHOWN_ON_PAGE = 5;

const label = (tag: string, p: RankRow) =>
  [
    (p.overallGrade ?? "—").replace("_PLUS", "+").padEnd(2),
    String(qualityScore(p)).padStart(2) + "pt",
    p.qualityTier.padEnd(13),
    p.form.padEnd(8),
    tag === "best_value" ? `$${(costPerQualityPoint(p)).toFixed(3)}/pt ($${(p.pricePerGramCents! / 100).toFixed(2)}/g)` : "",
    p.slug.slice(0, 60),
  ].join(" ");

async function main() {
  const apply = process.argv.includes("--apply");
  const result = await retagBestFor(prisma, { apply });

  for (const { tag, before, after } of result.tags) {
    console.log(`\n== ${tag}: ${before.length} -> ${after.length} tagged`);
    console.log("  shown before:");
    for (const p of rankForTag(tag, before).slice(0, SHOWN_ON_PAGE)) console.log(`    ${label(tag, p)}`);
    console.log("  shown after:");
    for (const p of rankForTag(tag, after).slice(0, SHOWN_ON_PAGE)) console.log(`    ${label(tag, p)}`);
  }

  console.log(`\n${result.products} products; ${result.changed} tag changes.`);
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
