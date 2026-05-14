import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// ── Tag metadata ──────────────────────────────────────────────────────────────

const TAG_META: Record<string, {
  label: string;
  h1: string;
  metaTitle: string;
  description: string;
  editorial: string[];
}> = {
  best_resin: {
    label: "Best Resin",
    h1: "Best Shilajit Resin (2026): Top Picks Ranked & Compared",
    metaTitle: "Best Shilajit Resin (2026) — Top Picks Ranked & Compared",
    description: "The best shilajit resin products ranked by COA quality, lab credibility, and heavy metal safety. Only products with public third-party testing make this list.",
    editorial: [
      "Resin is the least-processed form of shilajit — raw mineral pitch dissolved and purified without encapsulation, carrier oils, or fillers. Because there is nowhere to hide, resin demands the most from a manufacturer: fulvic acid and humic acid concentrations are directly measurable, heavy metal contamination cannot be diluted by capsule filler, and the purity of the source material shows up clearly in third-party testing.",
      "Our top resin picks all carry public Certificates of Analysis from named independent laboratories. We assess each COA for actual heavy metal values (not just a pass/fail stamp), fulvic acid percentage measured on the finished product, and the accreditation status of the testing lab.",
    ],
  },
  best_capsules: {
    label: "Best Capsules",
    h1: "Best Shilajit Capsules (2026): Top Picks Ranked & Compared",
    metaTitle: "Best Shilajit Capsules (2026) — Top Picks Ranked & Compared",
    description: "The best shilajit capsule products ranked by COA quality, lab credibility, and transparency. Compare shilajit capsules by testing credentials and price per serving.",
    editorial: [
      "Capsule-form shilajit trades some of the purity transparency of resin for daily convenience. The key questions are: what is the excipient? what is the stated shilajit content per capsule? and is there a public COA showing actual heavy metal concentrations below safe thresholds?",
      "Capsules also introduce more processing steps than resin, which makes third-party testing especially important. Our top picks all have public COAs from named labs and realistic per-serving doses — not the vanishingly small amounts sometimes used to qualify for a testing claim.",
    ],
  },
  best_tested: {
    label: "Best Tested",
    h1: "Best Tested Shilajit Products: Public COA, Named Lab, Heavy Metals Confirmed",
    metaTitle: "Best Tested Shilajit (2026) — Public COA, Named Lab, Heavy Metals Confirmed",
    description: "Shilajit products with a public Certificate of Analysis from a named independent laboratory, showing actual heavy metal concentrations. The most transparently tested products in the database.",
    editorial: [
      "'Third-party tested' is one of the most abused claims in the supplement industry. Many brands use the phrase to refer to in-house testing, summary COAs that cover multiple products, or documents that show only pass/fail results rather than actual values.",
      "We define it strictly: a public COA from a named, independent laboratory with actual numerical results for at least the four primary heavy metals — lead, mercury, arsenic, and cadmium. The products on this list meet that bar. Several go further, including fulvic acid percentages, microbial panels, and radioactivity screening.",
    ],
  },
  best_value: {
    label: "Best Budget",
    h1: "Best Value Shilajit (2026): Quality Testing at a Competitive Price",
    metaTitle: "Best Value Shilajit (2026) — Quality Testing at a Competitive Price",
    description: "The best shilajit for the money — ranked by testing quality per dollar. These products combine meaningful transparency credentials with a competitive price per gram.",
    editorial: [
      "Value is not just the lowest price — it is quality per dollar. We score each product on COA quality, lab credibility, and safety signals, then normalise by price per gram. A cheap product with no testing credentials scores poorly; a moderately priced product with a public COA from a named lab scores well.",
      "All products on this list have at minimum an Average quality tier, meaning they carry some form of verifiable testing transparency. None are the cheapest options in the database, but all represent strong quality-to-price ratios relative to what you actually get.",
    ],
  },
  best_gummies: {
    label: "Best Gummies",
    h1: "Best Shilajit Gummies (2026): Top Picks Ranked & Compared",
    metaTitle: "Best Shilajit Gummies (2026) — Top Picks Ranked & Compared",
    description: "The best shilajit gummy products ranked by COA quality, lab credibility, and transparency. Gummies introduce more processing steps than resin — testing credentials matter more, not less.",
    editorial: [
      "Gummy-form shilajit is the most processed format in the database. Sugar, gelatin, flavourings, and colourants are added to the shilajit extract, which makes testing credentials especially important — not as a formality but because the processing introduces additional contamination risk and dilutes the active compounds.",
      "We only list gummies with a public COA that covers the finished product (not just the raw shilajit extract). The products below are the best-performing gummies in the database on our grading criteria.",
    ],
  },
  editors_pick: {
    label: "Editor's Picks",
    h1: "Editor's Picks: The Best Shilajit Brands Overall",
    metaTitle: "Editor's Picks: Best Shilajit Brands Overall (2026)",
    description: "Hand-selected shilajit products that stand out across quality, testing transparency, and value. These are the products we would recommend to someone buying shilajit for the first time.",
    editorial: [
      "Our editor's picks are hand-selected products that stand out on multiple dimensions simultaneously: strong testing credentials, transparent manufacturing, a realistic price, and a track record of consistent quality. These are not necessarily the highest-graded on every single metric — they are the ones we would recommend without hesitation to a first-time buyer.",
      "All picks carry at minimum a Premium quality tier. Each has a public Certificate of Analysis from a named independent laboratory, confirmed heavy metals testing, and a publicly stated manufacturing country. The grade shown reflects our full grading methodology.",
    ],
  },
  best_for_men: {
    label: "Best for Men",
    h1: "Best Shilajit for Men (2026): Ranked by Testing Quality & Evidence",
    metaTitle: "Best Shilajit for Men (2026) — Ranked by Testing Quality & Evidence",
    description: "The best shilajit products for men, ranked by COA quality, lab credibility, and testing transparency. Includes context on the testosterone and energy evidence specific to male physiology.",
    editorial: [
      "The primary clinical evidence for shilajit in men relates to testosterone support and fatigue resistance. Pandit et al. (2016) found significant increases in total and free testosterone in healthy men aged 45–55 taking 250 mg twice daily for 90 days. Keller et al. (2019) found meaningful improvements in fatigue-induced strength decline over 8 weeks at 500 mg/day. Both studies used standardised, independently tested shilajit — not commodity powders.",
      "For men using shilajit for performance or hormonal support, product quality is directly relevant to whether those results are reproducible. A product without independent testing has no verifiable connection to the preparations studied clinically. Every product on this list has a public Certificate of Analysis from a named laboratory, confirmed heavy metals testing, and a quality tier of Premium or above.",
    ],
  },
  best_for_women: {
    label: "Best for Women",
    h1: "Best Shilajit for Women (2026): Ranked by Testing Quality & Safety",
    metaTitle: "Best Shilajit for Women (2026) — Ranked by Testing Quality & Safety",
    description: "The best shilajit products for women, ranked by COA quality, lab credibility, and heavy metal safety. Includes context on the iron bioavailability and energy evidence relevant to female physiology.",
    editorial: [
      "The most relevant clinical evidence for women relates to iron bioavailability and energy. Shilajit has been studied for its effect on iron absorption — fulvic acid forms soluble complexes with iron that may improve bioavailability compared to inorganic iron salts. For women who experience fatigue related to low iron, this is a mechanistically credible pathway. The testosterone evidence, primarily studied in men, is less directly applicable, though shilajit's broader adaptogenic and mitochondrial support effects are not sex-specific.",
      "Heavy metal safety is especially important for women, particularly those of reproductive age or who are pregnant. Lead, which shilajit can accumulate in poorly purified products, passes the placental barrier and has no safe level of exposure for developing foetuses. Every product on this list has confirmed numeric heavy metal results on a public COA — not just a 'tested' claim — and is manufactured under documented GMP conditions.",
    ],
  },
  best_himalayan_shilajit: {
    label: "Best Himalayan Shilajit",
    h1: "Best Himalayan Shilajit (2026): Top Picks Ranked by Testing & Transparency",
    metaTitle: "Best Himalayan Shilajit (2026) — Ranked by Testing & Transparency",
    description: "The best Himalayan shilajit products ranked by COA quality, lab accreditation, and heavy metal safety. 'Himalayan origin' is a marketing claim without independent testing — these products back it up.",
    editorial: [
      "The Himalayas are the most commonly cited shilajit source region, and for good reason — the high-altitude geology produces resin with a recognised mineral and fulvic acid profile. But 'Himalayan shilajit' on a label is an unverifiable origin claim without a COA. Because shilajit is not a geographically protected ingredient, any brand can print 'Himalayan' regardless of where their raw material was actually sourced. Independent third-party testing does not confirm geographic origin, but it does confirm that the product contains what it claims and is free of unsafe heavy metal levels — which is the more actionable signal for buyers.",
      "Of the 166 Himalayan-sourced products in the ShilajitDB database, 56 have a public Certificate of Analysis. The products below are the highest-graded among those — ranked on the same criteria we apply across the full database: COA availability, named laboratory, numeric heavy metal values, and manufacturing transparency.",
    ],
  },
  best_third_party_tested: {
    label: "Best Third-Party Tested",
    h1: "Best Third-Party Tested Shilajit (2026): Named Lab, Public COA, Heavy Metals Confirmed",
    metaTitle: "Best Third-Party Tested Shilajit (2026) — Named Lab, Public COA, Heavy Metals Confirmed",
    description: "Shilajit products with a public COA from a named independent laboratory AND confirmed numeric heavy metal results. The strictest testing standard in the ShilajitDB database.",
    editorial: [
      "This list applies the strictest criteria in the database: a publicly accessible Certificate of Analysis from a named independent laboratory, with actual numeric values for lead, arsenic, mercury, and cadmium — not a pass/fail stamp, not a summary certificate, and not an in-house lab. Fewer than 15% of products reviewed meet all three criteria simultaneously.",
      "The distinction between 'third-party tested' and genuinely third-party tested matters. Brands that do not name their laboratory cannot have their testing claim independently verified. Brands that show only pass/fail results rather than specific values cannot be evaluated against regulatory thresholds such as USP 232 or California Proposition 65. The products here show the actual numbers — you can verify them yourself.",
    ],
  },
};

// ── Shared select ─────────────────────────────────────────────────────────────

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  form: true,
  dataCompleteness: true,
  manufacturingCountryClaim: true,
  coaStatus: true,
  coaUrl: true,
  transparencyGrade: true,
  qualityTier: true,
  overallGrade: true,
  thirdPartyTestingLab: true,
  lastVerifiedAt: true,
  heavyMetalsTested: true,
  bestForTags: true,
  pricePerServingCents: true,
  pricePerGramCents: true,
  brand: { select: { name: true, slug: true } },
} as const;

const BASE_WHERE = {
  isCanonical: true,
};

type ProductResult = Awaited<ReturnType<typeof prisma.product.findMany<{ select: typeof PRODUCT_SELECT }>>>[number];

// ── Per-tag product fetchers ──────────────────────────────────────────────────

async function fetchProducts(tag: string): Promise<ProductResult[]> {
  // All tags are driven by the bestForTags field, which is maintained by the
  // tagging script (with 2-per-brand cap and 15-product limit per category).
  // best_value uses a quality-per-dollar score but still reads from bestForTags.
  return prisma.product.findMany({
    where: {
      ...BASE_WHERE,
      bestForTags: { has: tag },
    },
    orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
    take: 5,
    select: PRODUCT_SELECT,
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const dbTag = tag.replace(/-/g, "_");
  const meta = TAG_META[dbTag];
  if (!meta) return { title: "Not found" };
  return {
    title: meta.metaTitle,
    description: meta.description,
    alternates: { canonical: absoluteUrl(`/best/${tag}`) },
    openGraph: { title: meta.metaTitle, description: meta.description, url: absoluteUrl(`/best/${tag}`) },
  };
}

export default async function BestTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const dbTag = tag.replace(/-/g, "_");
  const meta = TAG_META[dbTag];
  if (!meta) notFound();

  const products = await fetchProducts(dbTag);

  const canonicalUrl = absoluteUrl(`/best/${tag}`);
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${meta.label} Shilajit`,
    description: meta.description,
    url: canonicalUrl,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug}`),
      name: p.name,
    })),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
    <div className="space-y-4">
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex items-center gap-2 text-xs text-[#6E7A9A] mb-3">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span>/</span>
          <span>{meta.label}</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8] leading-snug">
          {meta.h1}
        </h1>
        <div className="mt-4 space-y-3 max-w-2xl">
          {meta.editorial.map((para, i) => (
            <p key={i} className="text-sm text-[#C8D0E8] leading-relaxed">{para}</p>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6E7A9A]">{products.length} product{products.length !== 1 ? "s" : ""} · <Link href="/methodology" className="hover:text-[#8892B8] transition-colors underline underline-offset-2">How we grade →</Link></p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#252A40] bg-[#0F1320] p-8 text-center text-sm text-[#8892B8]">
          No products matched this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
