/**
 * Display-name cleanup (2026-09-18). Slugs are untouched, so no URL changes.
 *
 * - Brands: drops the " Store" suffix left over from Amazon storefront names ("Visit the X Store").
 *   Where the brand's own site styles the name differently, that name is used (checked 2026-09-18):
 *   Chuga Shilajit, Pure Himalayan Shilajit, Purezen Shilajit, Mars by GHC, PakShilajit.
 *   The old name is also replaced inside the brand's stored description.
 * - Products: Amazon listing titles over ~70 characters cut to the product's name, plus two wrong
 *   names — Sunmed's gummies were stored as "Rachael's Story" (their site: "Shilajit Gummies"), and
 *   SUREFECT's capsules as "Spring Valley-style…" (Spring Valley is another company's brand, used
 *   as a keyword in the Amazon title).
 *
 * Dry run by default; --apply writes. Re-running after --apply reports nothing to change.
 * Note: lib/importManualCsv.ts sets `name` from the CSV, so re-importing a long Amazon title for
 * one of these products brings the long name back.
 *
 *   ./node_modules/.bin/tsx scripts/fix-display-names.ts [--apply]
 */
import { prisma } from "../lib/db";

const APPLY = process.argv.includes("--apply");

/** brand slug -> new name */
const BRAND_NAMES: Record<string, string> = {
  "alex-jones-naturals-store": "Alex Jones Naturals",
  "blisque-store": "Blisque",
  "chuga-shilajit-store": "Chuga Shilajit",
  "clean-nutraceuticals-store": "Clean Nutraceuticals",
  "handpick-store": "HANDPICK",
  "hima-shilajatu-store": "Hima Shilajatu",
  "life-cykel-store": "Life Cykel",
  "lotus-blooming-herbs-store": "Lotus Blooming Herbs",
  "lsoiux-store": "LSOIUX",
  "lynx-store": "Lynx",
  "mars-by-ghc-store": "Mars by GHC",
  "mxczbsm-store": "MXCZBSM",
  "number-one-nutrition-store": "Number One Nutrition",
  "pakshilajit-store": "PakShilajit",
  "pure-himalayan-shilajit-store": "Pure Himalayan Shilajit",
  "purezen-shilajit-store": "Purezen Shilajit",
  "rolphood-store": "Rolphood",
  "santegra-store": "Santegra",
  "siberian-green-store": "Siberian Green",
  "trace-minerals-store": "Trace Minerals",
  "triple-8-nutrition-store": "TRIPLE 8 NUTRITION",
  "veltravita-store": "VeltraVita",
};

/** product slug -> new name (brand is printed separately wherever the name appears) */
const PRODUCT_NAMES: Record<string, string> = {
  "adndale-adndale-seamoss-shilajit-combo-sea-moss-and-shilajit-bundle-with-lion-s-mane-coq10-rhodi":
    "SeaMoss Shilajit Combo Capsules with Lion's Mane, CoQ10 & Rhodiola",
  "alex-jones-naturals-store-maximum-vitality-shilajit-complex-multi-herb-formula-with-sea-moss-ash":
    "Maximum Vitality Shilajit Complex",
  "aybet-organic-himalayan-shilajit-gold-gummies-ashwagandha-turmeric-gokshura":
    "Shilajit Gold Gummies with Ashwagandha, Turmeric & Gokshura",
  "ayush-herbs-shilajeet-mumiyo-peak-performance-rejuvenation-from-the-heart-of-the-himalayas":
    "Shilajeet Mumiyo™ Capsules",
  "beepwell-beepwell-natural-himalayan-shilajit-resin-rich-in-fulvic-acid-trace-minerals-with-ashwa":
    "Natural Himalayan Shilajit Resin with Ashwagandha & Black Pepper, 40g",
  "beepwell-himalayan-shilajit-gummies-60-gummies-3000mg-rhe-per-serving-herbal-wellness-blend-with":
    "Himalayan Shilajit Gummies, 60 Count",
  "better-alt-shilajit-sea-moss-capsules-with-ashwagandha-black-pepper-and-fulvic-acid-120-caps":
    "Shilajit Sea Moss Capsules with Ashwagandha, 120 Count",
  "bossko-the-way-to-the-top-3200mg-pure-himalayan-shilajit-gummies-probiotics-magnesium-ashwagandh":
    "3200mg Shilajit Gummies with Probiotics, Magnesium & Ashwagandha",
  "dlnia-shilajit-pure-himalayan-organic-shilajit-resin-supplement-gold-grade-with-85-trace-mineral":
    "Gold+ Grade Himalayan Shilajit Resin",
  "dorado-nutrition-shilajit-capsules-with-85-trace-minerals-75-day-supply-1000mg-extract-per-servi":
    "Shilajit Capsules with 85+ Trace Minerals, 1000mg",
  "etta-vita-urolithin-a-complex-w-shilajit-organic-sea-moss-ashwagandha-tongkat-ali-natural-energy":
    "Urolithin-A Complex with Shilajit, Sea Moss, Ashwagandha & Tongkat Ali",
  "fubienfit-shilajit-capsules-premium-shilajit-for-men-with-ashwagandha-ginseng-and-more-fulvic-ac":
    "Shilajit Capsules with Ashwagandha & Ginseng, 120 Count",
  "gat-gat-sport-testrol-gold-es-with-shilajit-tribulus-dim-zinc-longjack-fenugreek-saw-palmetto-es":
    "Sport Testrol Gold ES with Shilajit, 60 Tablets",
  "hempbuti-original-shilajit-resin-premium-potent-himalayan-gold-standard-150-servings-60-days-sun":
    "Original Shilajit Resin+, 150 Servings",
  "himvit-pure-himalayan-organic-shilajit-resin-with-lab-report-super-high-potency-for-men-women-fu":
    "Pure Himalayan Organic Shilajit Resin",
  "omica-organics-high-himalayan-shilajit-with-amla-capsules-ayurvedic-formula-90-count":
    "High Himalayan Shilajit with Amla Capsules, 90 Count",
  "omica-organics-high-himalayan-shilajit-paste-with-honey-ashwagandha-12-3-oz-350-g":
    "High Himalayan Shilajit Paste with Honey & Ashwagandha, 350 g",
  "omica-organics-high-himalayan-shilajit-liquid-with-raw-honey-ocean-minerals-2-fl-oz":
    "High Himalayan Shilajit Liquid with Raw Honey & Ocean Minerals",
  "plus-ultra-highest-potency-black-shilajit-for-men-80-fulvic-acid-tongkat-ali-ashwagandha-turkest":
    "Highest Potency Black Shilajit Capsules for Men",
  "pure-indian-foods-best-shilajit-ever-authentic-100-pure-himalayan-high-altitude-16k-ft-black-res":
    "Best Shilajit Ever™ Himalayan Resin Paste",
  "rolphood-store-pure-himalayan-organic-shilajit-capsules-with-ashwagandha-supplements-60-capsules":
    "Shilajit Capsules with Ashwagandha, 60 Count",
  "santegra-store-30-000-mg-shilajit-tablets-100-shilajit-pure-tablets-for-women-men-himalayan-orga":
    "Shilajit Tablets, 30,000 mg",
  "siberian-green-store-shilajit-120-dry-drops-altai-golden-mountains-shilajit-by-siberian-green":
    "Altai Golden Mountains Shilajit, 120 Dry Drops",
  "siberian-green-store-12-shilajit-honey-sticks-10-pack-natural-immune-and-energy-restorers":
    "12% Shilajit Honey Sticks, 10-Pack",
  "stellar-health-shilajit-matrix-ubiquinol-coq10-pqq-astaxanthin-nad-supplement-clinical-mitochond":
    "Shilajit Matrix+ with Ubiquinol CoQ10, PQQ & NAD+, 60 Capsules",
  "sumeet-health-foods-shf-himalayan-shilajit-resin-30g-pure-organic-potent-gold-grade-himalayan-sh":
    "SHF Himalayan Shilajit Resin, 30g",
  "sunmed-shilajit-gummies": "Shilajit Gummies",
  "surefect-spring-valley-style-shilajit-extract-capsules-50-fulvic-acid":
    "Shilajit Extract Vegetarian Capsules, 50% Fulvic Acid",
  "the-gold-shilajit-pure-himalayan-organic-shilajit-for-men-for-women-lab-test-in-usa":
    "Pure Himalayan Organic Shilajit Resin",
  "the-monk-organic-shilajit-with-fulvic-acid-humic-acid-85-minerals-gold-grade-plus-same-as-resin":
    "Organic Shilajit Capsules, Gold Grade Plus",
  "triple-8-nutrition-store-shilajit-resin-50g-bottle-absolutely-pure-wild-himalayan-authentic-natu":
    "Wild Himalayan Shilajit Resin, 50g",
  "uheco-19-in-1-shilajit-capsules-for-men-women-90-count-energy-boost-immune-support-85-trace-mine":
    "19-in-1 Shilajit Capsules, 90 Count",
};

async function main() {
  let changes = 0;
  const problems: string[] = [];

  for (const [slug, name] of Object.entries(BRAND_NAMES)) {
    const brand = await prisma.brand.findUnique({ where: { slug }, select: { id: true, name: true, description: true } });
    if (!brand) { problems.push(`brand ${slug} not found`); continue; }
    if (brand.name === name) continue;
    const clash = await prisma.brand.findFirst({ where: { name, NOT: { id: brand.id } }, select: { slug: true } });
    if (clash) { problems.push(`brand name "${name}" already used by ${clash.slug}`); continue; }
    const description = brand.description?.split(brand.name).join(name) ?? null;
    console.log(`brand   ${brand.name}  ->  ${name}${description !== brand.description ? "  (+description)" : ""}`);
    changes++;
    if (APPLY) await prisma.brand.update({ where: { id: brand.id }, data: { name, description } });
  }

  for (const [slug, name] of Object.entries(PRODUCT_NAMES)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, name: true, brandId: true } });
    if (!product) { problems.push(`product ${slug} not found`); continue; }
    if (product.name === name) continue;
    const sibling = await prisma.product.findFirst({ where: { brandId: product.brandId, name, NOT: { id: product.id } }, select: { slug: true } });
    if (sibling) { problems.push(`"${name}" already used by sibling ${sibling.slug}`); continue; }
    console.log(`product ${product.name}\n     ->  ${name}`);
    changes++;
    if (APPLY) await prisma.product.update({ where: { id: product.id }, data: { name } });
  }

  for (const p of problems) console.log(`SKIPPED: ${p}`);
  console.log(`\n${changes} change(s) ${APPLY ? "applied" : "to apply (dry run — pass --apply to write)"}.`);
}

main().finally(() => prisma.$disconnect());
