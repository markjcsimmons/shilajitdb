/**
 * Preview or apply Editor's Picks. The rule and the manual overrides are EDITORS_PICK in
 * lib/best-for-tags.ts: the pinned product first, then A+ and then A products that made at
 * least 2 other /best lists, 2 per brand group; `include` / `exclude` override the rule.
 *
 * Picks are rebuilt with every other /best tag (retagBestFor), which already runs after admin
 * saves, recomputes, imports and the regrade scripts — this script is for previewing a change
 * to EDITORS_PICK, or applying it without waiting for the next save.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/set-editors-picks.ts
 * Apply:    ./node_modules/.bin/tsx scripts/set-editors-picks.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { EDITORS_PICK, RETAGGED_TAGS, qualityScore, rankForTag, retagBestFor } from "../lib/best-for-tags";

const prisma = new PrismaClient();
const SHOWN_ON_PAGE = 5;

async function main() {
  const apply = process.argv.includes("--apply");
  const result = await retagBestFor(prisma, { apply });
  const { before, after } = result.tags.find((t) => t.tag === "editors_pick")!;
  // Categories each pick made, from the freshly computed tags.
  const categories = new Map(
    result.tags.filter((t) => RETAGGED_TAGS.includes(t.tag)).flatMap((t) => t.after.map((p) => [p.id, t.tag] as const)).reduce(
      (m, [id, tag]) => m.set(id, [...(m.get(id) ?? []), tag.replace(/^best_/, "")]),
      new Map<string, string[]>(),
    ),
  );

  console.log("current picks:");
  for (const p of rankForTag("editors_pick", before)) console.log(`  ${p.slug}`);

  console.log("\nnew picks:");
  rankForTag("editors_pick", after).forEach((p, i) => {
    const why = EDITORS_PICK.first.includes(p.slug)
      ? "pinned first"
      : EDITORS_PICK.include.includes(p.slug)
        ? "manual include"
        : `${(categories.get(p.id) ?? []).length} lists: ${(categories.get(p.id) ?? []).join(", ")}`;
    const grade = (p.overallGrade ?? "—").replace("_PLUS", "+");
    console.log(`  ${i + 1}. ${grade.padEnd(2)} ${String(qualityScore(p)).padStart(2)}pt ${p.slug.slice(0, 58).padEnd(58)} ${why}${i >= SHOWN_ON_PAGE ? "  (not shown)" : ""}`);
  });

  const beforeIds = new Set(before.map((p) => p.id));
  const afterIds = new Set(after.map((p) => p.id));
  for (const p of before) if (!afterIds.has(p.id)) console.log(`- ${p.slug}`);
  for (const p of after) if (!beforeIds.has(p.id)) console.log(`+ ${p.slug}`);
  for (const w of result.warnings) console.warn(`! ${w}`);

  console.log(`\n${result.changed} product(s) with tag changes across all /best tags.`);
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
