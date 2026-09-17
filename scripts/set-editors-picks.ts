/**
 * Set the hand-curated editors_pick tag. retag-best-for.ts never touches this tag.
 *
 * Picks (2026-09-17): chosen across testing, price, and first-time-buyer suitability.
 *
 * Mars by GHC was removed on 2026-09-17: its COA turned out to be a manufacturer document
 * with no independent lab named and heavy metals reported only as "Complies", so it regraded
 * A+ -> B (see scripts/fix-mars-coa-review.ts). That left two Pürblack products on this page,
 * against the one-per-affiliate-brand convention this list previously followed. Kept
 * deliberately for now because the A+ tier is currently all Pürblack-group; revisit once the
 * image-only COAs on the A-grade products have been reviewed by eye.
 *
 * Dry run:  ./node_modules/.bin/tsx scripts/set-editors-picks.ts
 * Apply:    ./node_modules/.bin/tsx scripts/set-editors-picks.ts --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "editors_pick";

/** Exact slugs; a key ending in "-" matches by prefix and must match exactly one product. */
const PICKS = [
  "purblack-purblack-research-grade-shilajit-resin-15-grams",
  "purblack-purblack-white-rabbit-serene-shilajit-resin-15-grams",
  "pure-indian-foods-best-shilajit-ever-",
  "pure-himalayan-shilajit-store-shilajit-resin",
  "healthforce-shilajit",
];

async function main() {
  const apply = process.argv.includes("--apply");
  const all = await prisma.product.findMany({
    where: { isCanonical: true },
    select: { id: true, slug: true, bestForTags: true },
  });

  const ids = new Set(
    PICKS.map((key) => {
      const matches = all.filter((p) => (key.endsWith("-") ? p.slug.startsWith(key) : p.slug === key));
      if (matches.length !== 1) throw new Error(`${key}: ${matches.length} matches`);
      return matches[0].id;
    }),
  );

  console.log("current picks:");
  for (const p of all.filter((p) => p.bestForTags.includes(TAG))) console.log(`  ${p.slug}`);

  let changed = 0;
  for (const p of all) {
    const want = ids.has(p.id);
    if (p.bestForTags.includes(TAG) === want) continue;
    changed++;
    console.log(`${want ? "+" : "-"} ${p.slug}`);
    if (apply) {
      const next = want ? [...p.bestForTags, TAG] : p.bestForTags.filter((t) => t !== TAG);
      await prisma.product.update({ where: { id: p.id }, data: { bestForTags: next.sort() } });
    }
  }

  console.log(`\n${changed} changes.`);
  console.log(apply ? "Applied." : "Dry run — pass --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
