import { Badge, Button, cn } from "@/components/ui";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { CompareSwapper } from "@/components/compare-swapper";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { labelCoaStatus, labelForm, labelQualityTier } from "@/lib/labels";
import { gradeBadgeClasses, gradeLabel } from "@/lib/grade-colors";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const top15 = await prisma.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" }, overallGrade: { not: null } },
    orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
    take: 15,
    select: { slug: true },
  });

  const pairs: { pair: string }[] = [];
  for (let i = 0; i < top15.length; i++) {
    for (let j = i + 1; j < top15.length; j++) {
      const [a, b] = [top15[i].slug, top15[j].slug].sort();
      pairs.push({ pair: `${a}-vs-${b}` });
    }
  }
  return pairs;
}

function parsePair(pair: string) {
  const parts = pair.split("-vs-");
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (!a || !b) return null;
  return { a, b };
}

// ── Programmatic verdict generation ───────────────────────────────────────────

type AnyProduct = {
  id: string;
  name: string;
  form: string;
  coaStatus: string;
  coaUrl: string | null;
  thirdPartyTestingLab: string | null;
  heavyMetalsTested: string | null;
  overallGrade: string | null;
  qualityTier: string;
  pricePerGramCents: number | null;
  manufacturingCountryClaim: string | null;
  brand: { name: string };
};

type Insight = { label: "advantage" | "neutral" | "caution"; text: string };

function generateInsights(a: AnyProduct, b: AnyProduct): Insight[] {
  const out: Insight[] = [];

  // COA status
  if (a.coaStatus === "PUBLIC" && b.coaStatus !== "PUBLIC") {
    out.push({ label: "advantage", text: `${a.brand.name} — ${a.name} has a publicly available Certificate of Analysis; ${b.brand.name} — ${b.name} does not. This is the single most important transparency signal.` });
  } else if (b.coaStatus === "PUBLIC" && a.coaStatus !== "PUBLIC") {
    out.push({ label: "advantage", text: `${b.brand.name} — ${b.name} has a publicly available Certificate of Analysis; ${a.brand.name} — ${a.name} does not. This is the single most important transparency signal.` });
  } else if (a.coaStatus === "PUBLIC" && b.coaStatus === "PUBLIC") {
    out.push({ label: "neutral", text: "Both products have publicly available Certificates of Analysis — the baseline transparency standard is met by each." });
  } else {
    out.push({ label: "caution", text: "Neither product has a fully public Certificate of Analysis. Independent verification of safety claims is not possible for either." });
  }

  // Named lab
  const aLab = a.thirdPartyTestingLab?.trim();
  const bLab = b.thirdPartyTestingLab?.trim();
  if (aLab && !bLab) {
    out.push({ label: "advantage", text: `${a.name} names its testing laboratory (${aLab}). ${b.name} does not disclose which lab performed its testing.` });
  } else if (bLab && !aLab) {
    out.push({ label: "advantage", text: `${b.name} names its testing laboratory (${bLab}). ${a.name} does not disclose which lab performed its testing.` });
  } else if (aLab && bLab && aLab !== bLab) {
    out.push({ label: "neutral", text: `${a.name} is tested by ${aLab}; ${b.name} by ${bLab}.` });
  }

  // Heavy metals
  if (a.heavyMetalsTested === "CONFIRMED" && b.heavyMetalsTested !== "CONFIRMED") {
    out.push({ label: "advantage", text: `${a.name} has confirmed numeric heavy metal values (lead, arsenic, mercury, cadmium) on its COA. ${b.name} has not confirmed these to the same standard.` });
  } else if (b.heavyMetalsTested === "CONFIRMED" && a.heavyMetalsTested !== "CONFIRMED") {
    out.push({ label: "advantage", text: `${b.name} has confirmed numeric heavy metal values on its COA. ${a.name} has not confirmed these to the same standard.` });
  } else if (a.heavyMetalsTested === "CONFIRMED" && b.heavyMetalsTested === "CONFIRMED") {
    out.push({ label: "neutral", text: "Both products have confirmed numeric heavy metal values on their COAs." });
  }

  // Form
  if (a.form !== b.form) {
    const formNotes: Partial<Record<string, Partial<Record<string, string>>>> = {
      RESIN: {
        CAPSULE: "Resin is less processed than capsules — it reaches you without excipients, fillers, or encapsulation steps, making the raw compound more directly testable.",
        GUMMY: "Resin is significantly less processed than gummies. Gummies add sugar, gelatin, and flavourings — each an additional variable in quality control.",
        POWDER: "Resin is less processed than standardised powder extract. Processing steps between raw resin and powder can affect bioactive fractions.",
      },
      CAPSULE: {
        GUMMY: "Capsules introduce fewer additives than gummies, which add sugar, gelatin, and flavourings. From a testing perspective, capsules are simpler to certify.",
      },
    };
    const note = formNotes[a.form]?.[b.form] ?? formNotes[b.form]?.[a.form];
    if (note) out.push({ label: "neutral", text: note });
  }

  // Price
  if (a.pricePerGramCents && b.pricePerGramCents) {
    const diff = Math.abs(a.pricePerGramCents - b.pricePerGramCents);
    if (diff >= 10) {
      const cheaper = a.pricePerGramCents < b.pricePerGramCents ? a : b;
      const pricier = a.pricePerGramCents < b.pricePerGramCents ? b : a;
      out.push({
        label: "neutral",
        text: `On price per gram, ${cheaper.name} costs $${(cheaper.pricePerGramCents! / 100).toFixed(2)}/g vs $${(pricier.pricePerGramCents! / 100).toFixed(2)}/g for ${pricier.name} — a ${Math.round(((pricier.pricePerGramCents! - cheaper.pricePerGramCents!) / pricier.pricePerGramCents!) * 100)}% difference.`,
      });
    }
  }

  return out;
}

type BetterFor = { persona: string; pick: string; reason: string };

function generateBetterFor(a: AnyProduct, b: AnyProduct): BetterFor[] {
  const out: BetterFor[] = [];

  // Safety score
  const aS = (a.coaStatus === "PUBLIC" ? 2 : 0) + (a.thirdPartyTestingLab ? 1 : 0) + (a.heavyMetalsTested === "CONFIRMED" ? 1 : 0);
  const bS = (b.coaStatus === "PUBLIC" ? 2 : 0) + (b.thirdPartyTestingLab ? 1 : 0) + (b.heavyMetalsTested === "CONFIRMED" ? 1 : 0);
  if (aS !== bS) {
    const pick = aS > bS ? a : b;
    out.push({ persona: "Safety-focused buyers", pick: `${pick.brand.name} — ${pick.name}`, reason: "Stronger testing transparency across COA availability, lab disclosure, and heavy metals confirmation." });
  }

  // Budget
  if (a.pricePerGramCents && b.pricePerGramCents && Math.abs(a.pricePerGramCents - b.pricePerGramCents) >= 10) {
    const pick = a.pricePerGramCents < b.pricePerGramCents ? a : b;
    out.push({ persona: "Budget-conscious buyers", pick: `${pick.brand.name} — ${pick.name}`, reason: `Lower cost per gram ($${(pick.pricePerGramCents! / 100).toFixed(2)}/g).` });
  }

  // Form preference
  if (a.form !== b.form) {
    if (a.form === "RESIN" || b.form === "RESIN") {
      const resinPick = a.form === "RESIN" ? a : b;
      out.push({ persona: "Buyers wanting the least-processed form", pick: `${resinPick.brand.name} — ${resinPick.name}`, reason: "Resin is shilajit in its least-processed state — no capsule fillers, excipients, or additional processing steps." });
    }
    if (a.form === "CAPSULE" || b.form === "CAPSULE") {
      const capPick = a.form === "CAPSULE" ? a : b;
      out.push({ persona: "Buyers prioritising daily convenience", pick: `${capPick.brand.name} — ${capPick.name}`, reason: "Pre-measured capsule dose removes the need for weighing resin each morning." });
    }
  }

  return out;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) return { title: "Compare products" };

  const [aSlug, bSlug] = [parsed.a, parsed.b].sort();
  const canonical = absoluteUrl(`/compare/${aSlug}-vs-${bSlug}`);

  const [a, b] = await Promise.all([
    prisma.product.findUnique({ where: { slug: aSlug }, select: { name: true, brand: { select: { name: true } }, _count: { select: { evidence: true } } } }),
    prisma.product.findUnique({ where: { slug: bSlug }, select: { name: true, brand: { select: { name: true } }, _count: { select: { evidence: true } } } }),
  ]);

  const title =
    a && b
      ? `${a.brand.name} vs ${b.brand.name} Shilajit Comparison`
      : "Compare products";
  const description =
    a && b
      ? `Compare ${a.brand.name} ${a.name} vs ${b.brand.name} ${b.name} on COA availability, lab accreditation, heavy metal testing, form, and price. Independent, unaffiliated analysis.`
      : "Compare two shilajit products side-by-side.";

  const thinData = !a || !b || a._count.evidence < 2 || b._count.evidence < 2;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | ShilajitDB`, description, url: canonical },
    ...(thinData ? { robots: "noindex, follow" } : {}),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

const RECOMMENDED_SELECT = {
  id: true, slug: true, name: true, form: true,
  dataCompleteness: true, manufacturingCountryClaim: true,
  coaStatus: true, coaUrl: true, transparencyGrade: true,
  qualityTier: true, overallGrade: true, thirdPartyTestingLab: true,
  lastVerifiedAt: true, heavyMetalsTested: true, bestForTags: true,
  pricePerServingCents: true, pricePerGramCents: true,
  brand: { select: { name: true, slug: true } },
} as const;

export default async function ComparePage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  const [aSlug, bSlug] = [parsed.a, parsed.b].sort();
  const canonicalPair = `${aSlug}-vs-${bSlug}`;
  if (pair !== canonicalPair) {
    redirect(`/compare/${canonicalPair}`);
  }

  const [a, b] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: aSlug },
      include: { brand: true, evidence: true },
    }),
    prisma.product.findUnique({
      where: { slug: bSlug },
      include: { brand: true, evidence: true },
    }),
  ]);
  if (!a || !b) notFound();

  // All products for the swap pickers
  const allProducts = await prisma.product.findMany({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
    select: { slug: true, name: true, brand: { select: { name: true } } },
    orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
  });

  // Top alternatives — best-graded products that aren't either of these two
  const recommended = await prisma.product.findMany({
    where: {
      isCanonical: true,
      coaStatus: "PUBLIC",
      dataCompleteness: { not: "LOW" },
      id: { notIn: [a.id, b.id] },
    },
    orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
    take: 3,
    select: RECOMMENDED_SELECT,
  });

  const aForGrading = {
    form: a.form,
    coaStatus: a.coaStatus,
    manufacturingCountryClaim: a.manufacturingCountryClaim,
    thirdPartyTestingLab: a.thirdPartyTestingLab,
    gmpCertified: a.gmpCertified,
    hasPatentClaim: a.hasPatentClaim,
    brandSlug: a.brand.slug,
  };
  const bForGrading = {
    form: b.form,
    coaStatus: b.coaStatus,
    manufacturingCountryClaim: b.manufacturingCountryClaim,
    thirdPartyTestingLab: b.thirdPartyTestingLab,
    gmpCertified: b.gmpCertified,
    hasPatentClaim: b.hasPatentClaim,
    brandSlug: b.brand.slug,
  };
  const aT = computeTransparencyGrade(aForGrading);
  const bT = computeTransparencyGrade(bForGrading);
  const aQ = computeQualityTier(aForGrading);
  const bQ = computeQualityTier(bForGrading);

  const insights = generateInsights(a, b);
  const betterFor = generateBetterFor(a, b);

  const rows = [
    { label: "Form", a: labelForm(a.form), b: labelForm(b.form) },
    {
      label: "Ingredients (normalized)",
      a: a.ingredientsNormalized.length ? a.ingredientsNormalized.join(", ") : "—",
      b: b.ingredientsNormalized.length ? b.ingredientsNormalized.join(", ") : "—",
    },
    { label: "Manufacturing country (claim)", a: a.manufacturingCountryClaim ?? "—", b: b.manufacturingCountryClaim ?? "—" },
    { label: "COA status", a: labelCoaStatus(a.coaStatus), b: labelCoaStatus(b.coaStatus) },
    { label: "COA link", a: a.coaUrl ?? "—", b: b.coaUrl ?? "—", isLink: true },
    { label: "Third-party lab", a: a.thirdPartyTestingLab ?? "—", b: b.thirdPartyTestingLab ?? "—" },
    { label: "Heavy metals tested", a: a.heavyMetalsTested ?? "—", b: b.heavyMetalsTested ?? "—" },
    { label: "Price per gram", a: a.pricePerGramCents ? `$${(a.pricePerGramCents / 100).toFixed(2)}/g` : "—", b: b.pricePerGramCents ? `$${(b.pricePerGramCents / 100).toFixed(2)}/g` : "—" },
    { label: "Transparency Grade", a: `${aT.grade} (score ${aT.score})`, b: `${bT.grade} (score ${bT.score})` },
    { label: "Quality Tier", a: labelQualityTier(aQ.tier), b: labelQualityTier(bQ.tier) },
  ] as const;

  const insightColors = {
    advantage: "border-l-[#22C55E] bg-[#052010]",
    neutral: "border-l-[#3D7AFF] bg-[#050D28]",
    caution: "border-l-[#EF4444] bg-[#200505]",
  };
  const insightTextColors = {
    advantage: "text-[#22C55E]",
    neutral: "text-[#6E9FFF]",
    caution: "text-[#EF4444]",
  };

  const compareJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${a.brand.name} ${a.name} vs ${b.brand.name} ${b.name}`,
    description: `Side-by-side comparison of COA availability, lab accreditation, heavy metal testing, form, and price.`,
    url: absoluteUrl(`/compare/${canonicalPair}`),
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
      />

      {/* Header */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex items-center gap-2 text-xs text-[#4A5070] mb-5">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span>/</span>
          <span>Compare</span>
        </div>

        {/* Grade hero — the scores lead */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Product A */}
          <div className="flex flex-1 items-center gap-4 min-w-0">
            <div
              className={cn(
                "shrink-0 h-20 w-20 rounded-xl flex items-center justify-center text-3xl font-bold",
                gradeBadgeClasses(a.overallGrade),
              )}
            >
              {gradeLabel(a.overallGrade)}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#6E7A9A] mb-0.5">{a.brand.name}</div>
              <Link
                href={`/product/${a.slug}`}
                className="text-sm font-semibold text-[#EEF0F8] hover:text-[#6E9FFF] transition-colors leading-snug"
              >
                {a.name}
              </Link>
            </div>
          </div>

          {/* vs */}
          <div className="shrink-0 text-center text-base font-semibold text-[#4A5070]">vs</div>

          {/* Product B */}
          <div className="flex flex-1 items-center gap-4 min-w-0 sm:flex-row-reverse">
            <div
              className={cn(
                "shrink-0 h-20 w-20 rounded-xl flex items-center justify-center text-3xl font-bold",
                gradeBadgeClasses(b.overallGrade),
              )}
            >
              {gradeLabel(b.overallGrade)}
            </div>
            <div className="min-w-0 sm:text-right">
              <div className="text-xs text-[#6E7A9A] mb-0.5">{b.brand.name}</div>
              <Link
                href={`/product/${b.slug}`}
                className="text-sm font-semibold text-[#EEF0F8] hover:text-[#6E9FFF] transition-colors leading-snug"
              >
                {b.name}
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-[#4A5070]">
          Independent comparison · COA status, lab accreditation, heavy metals, form, and price
        </p>

        <CompareSwapper
          slugA={aSlug}
          slugB={bSlug}
          options={allProducts.map((p) => ({
            slug: p.slug,
            label: `${p.brand.name} — ${p.name}`,
          }))}
        />
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-lg border border-[#252A40] bg-[#0F1320]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
          <div className="border-b border-[#252A40] bg-[#171C2E] p-4 text-sm font-medium text-[#4A5070] lg:border-b-0 lg:border-r">
            Signal
          </div>
          <div className="border-b border-[#252A40] p-4 text-sm font-semibold text-[#EEF0F8] lg:border-b-0 lg:border-r">
            {a.brand.name} — {a.name}
          </div>
          <div className="p-4 text-sm font-semibold text-[#EEF0F8]">{b.brand.name} — {b.name}</div>
        </div>
        <div className="divide-y divide-[#252A40]">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-1 lg:grid-cols-3">
              <div className="bg-[#171C2E] p-4 text-xs text-[#6E7A9A] lg:border-r lg:border-[#252A40]">
                {r.label}
              </div>
              <div className="p-4 text-sm text-[#C8D0E8] lg:border-r lg:border-[#252A40]">
                {"isLink" in r && r.isLink && r.a !== "—" ? (
                  <a href={r.a} target="_blank" rel="nofollow" className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                    View COA
                  </a>
                ) : (r.a)}
              </div>
              <div className="p-4 text-sm text-[#C8D0E8]">
                {"isLink" in r && r.isLink && r.b !== "—" ? (
                  <a href={r.b} target="_blank" rel="nofollow" className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                    View COA
                  </a>
                ) : (r.b)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key observations */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-3">Key observations</h2>
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-lg border-l-4 p-4 ${insightColors[ins.label]}`}>
              <p className={`text-xs leading-relaxed ${insightTextColors[ins.label]}`}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Better for whom */}
      {betterFor.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-3">Which is better for whom?</h2>
          <div className="rounded-lg border border-[#252A40] bg-[#0F1320] overflow-hidden">
            <div className="grid grid-cols-3 bg-[#171C2E] border-b border-[#252A40]">
              <div className="p-3 text-xs font-semibold text-[#6E7A9A]">Buyer type</div>
              <div className="p-3 text-xs font-semibold text-[#6E7A9A] border-l border-[#252A40]">Better pick</div>
              <div className="p-3 text-xs font-semibold text-[#6E7A9A] border-l border-[#252A40]">Why</div>
            </div>
            <div className="divide-y divide-[#252A40]">
              {betterFor.map((row, i) => (
                <div key={i} className="grid grid-cols-3">
                  <div className="p-3 text-xs text-[#8892B8]">{row.persona}</div>
                  <div className="p-3 text-xs font-medium text-[#EEF0F8] border-l border-[#252A40]">{row.pick}</div>
                  <div className="p-3 text-xs text-[#8892B8] border-l border-[#252A40]">{row.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Why Product X / Why Product Y */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-4">
            Transparency signals: {a.brand.name} — {a.name}
          </h2>
          <div className="mb-3">
            <div className="text-xs font-medium text-[#6E7A9A] uppercase tracking-wide mb-2">Transparency</div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {aT.reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6E7A9A] uppercase tracking-wide mb-2">Quality</div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {aQ.reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-[#252A40]">
            <Link href={`/product/${a.slug}`} className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              View full product page →
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-4">
            Transparency signals: {b.brand.name} — {b.name}
          </h2>
          <div className="mb-3">
            <div className="text-xs font-medium text-[#6E7A9A] uppercase tracking-wide mb-2">Transparency</div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {bT.reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6E7A9A] uppercase tracking-wide mb-2">Quality</div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {bQ.reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-[#252A40]">
            <Link href={`/product/${b.slug}`} className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              View full product page →
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended alternatives */}
      {recommended.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="font-serif text-xl font-semibold text-[#EEF0F8]">Top-rated alternatives</h2>
            <p className="text-sm text-[#8892B8] mt-1">
              Highest-graded products with a public COA from a named independent laboratory.{" "}
              <Link href="/" className="text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">See all products →</Link>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p as ProductCardData} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center gap-3">
        <Button href="/" variant="secondary">← Back to database</Button>
        <Button href="/shilajit-comparison" variant="secondary">Brand comparison →</Button>
      </div>
    </div>
  );
}
