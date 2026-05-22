import { ComparePicker } from "@/components/compare-picker";
import { Badge } from "@/components/ui";
import { prisma } from "@/lib/db";
import {
  computeQualityTier,
  computeTransparencyGrade,
  overallGradeScore,
  manufacturingPointsFromCountry,
  type ProductForGrading,
} from "@/lib/grading";
import {
  gradeBadgeClasses,
  gradeAccentClass,
  gradeLabel,
  qualityTierClasses,
} from "@/lib/grade-colors";
import { labelCoaStatus, labelForm, labelQualityTier } from "@/lib/labels";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/components/ui";
import type { EvidenceType, ListingSource, OverallGrade, QualityTier } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function labelEvidenceType(t: EvidenceType) {
  return t.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

// ---------------------------------------------------------------------------
// Grade summary generator
// ---------------------------------------------------------------------------

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildGradeSummary(
  product: ProductForGrading & { name: string },
  brandName: string,
  score: number,
  maxScore: number,
  grade: OverallGrade | null,
  tier: QualityTier,
): string {
  const gradeTxt = gradeLabel(grade);
  const tierTxt = labelQualityTier(tier);
  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);

  // Sentence 1 — verdict
  const s1 = `${brandName}'s ${product.name} scores ${score} out of ${maxScore} points, earning a ${gradeTxt} grade and ${tierTxt} quality tier.`;

  // Strengths
  const strengths: string[] = [];
  if (product.coaStatus === "PUBLIC") strengths.push("a publicly available, independently auditable COA");
  else if (product.coaStatus === "PUBLIC_EMBEDDED") strengths.push("a COA visible on the product page");
  else if (product.coaStatus === "REQUEST_ONLY") strengths.push("a COA available on request");
  if (product.thirdPartyTestingLab?.trim()) strengths.push(`independent testing by ${product.thirdPartyTestingLab}`);
  if (product.form === "RESIN") strengths.push("resin form — the least processed format");
  if (mfgPoints === 2) strengths.push("US manufacture under FDA 21 CFR Part 111 oversight");
  else if (mfgPoints === 1) strengths.push(`stated country of manufacture (${product.manufacturingCountryClaim})`);
  if (product.gmpCertified) strengths.push("GMP-certified production");

  // Gaps
  const gaps: string[] = [];
  if (product.coaStatus === "NONE" || product.coaStatus === "UNKNOWN") {
    gaps.push("no COA is publicly available");
  } else if (product.coaStatus === "REQUEST_ONLY") {
    gaps.push("the COA is not openly published — it must be requested directly from the brand");
  } else if (product.coaStatus === "PUBLIC_EMBEDDED") {
    gaps.push("the COA is an embedded page image rather than a standalone downloadable document");
  }
  if (!product.thirdPartyTestingLab?.trim()) gaps.push("no named independent testing laboratory");
  if (product.form !== "RESIN") gaps.push(`${labelForm(product.form).toLowerCase()} form rather than resin`);
  if (mfgPoints === 0) gaps.push("country of manufacture not disclosed");
  if (!product.gmpCertified) gaps.push("GMP certification not confirmed");

  const s2 = strengths.length > 0 ? `Strengths include ${joinList(strengths)}.` : "";
  const s3 = gaps.length > 0
    ? `The main gap${gaps.length > 1 ? "s" : ""} ${gaps.length > 1 ? "are" : "is"} ${joinList(gaps)}.`
    : "It meets all major transparency criteria.";

  return [s1, s2, s3].filter(Boolean).join(" ");
}

function labelListingSource(s: ListingSource) {
  if (s === "OFFICIAL") return "Official";
  if (s === "AMAZON") return "Amazon";
  if (s === "WALMART") return "Walmart";
  if (s === "IHERB") return "iHerb";
  if (s === "GOOGLE_SHOPPING") return "Google Shopping";
  if (s === "MANUAL") return "Manual";
  return "Other retailer";
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      metaDescription: true,
      dataCompleteness: true,
      isCanonical: true,
      overallGrade: true,
      coaStatus: true,
      evidence: { select: { id: true } },
      brand: { select: { name: true } },
    },
  });
  if (!product) return { title: "Product not found" };

  const noIndex =
    !product.isCanonical ||
    product.dataCompleteness === "LOW" ||
    product.evidence.length === 0;

  const gradeLabel: Record<string, string> = {
    A_PLUS: "A+",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    E: "E",
    F: "F",
  };
  const coaLabel: Record<string, string> = {
    PUBLIC: "Public COA",
    PUBLIC_EMBEDDED: "COA Available",
    REQUEST_ONLY: "COA on Request",
    NONE: "No COA",
    UNKNOWN: "COA Unknown",
  };
  const grade = product.overallGrade ? gradeLabel[product.overallGrade] ?? null : null;
  const coa = product.coaStatus ? coaLabel[product.coaStatus] ?? null : null;
  const gradePart = grade && coa ? ` — Grade ${grade}, ${coa}` : grade ? ` — Grade ${grade}` : "";
  const title = `${product.name}${gradePart} | ShilajitDB`;
  const description =
    product.metaDescription?.trim() &&
    product.metaDescription.length >= 140 &&
    product.metaDescription.length <= 160
      ? product.metaDescription.trim()
      : `View transparency grade, COA status, manufacturing claim clarity, ingredients disclosure, and evidence links for ${product.brand.name} — ${product.name}.`;
  const canonical = absoluteUrl(`/product/${product.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    ...(noIndex ? { robots: "noindex, nofollow" } : {}),
  };
}

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------

/** A mini stat chip for the 4-up grid (Form, COA, Made In, Lab). */
function StatChip({
  label,
  value,
  href,
  valueClass,
}: {
  label: string;
  value: string;
  href?: string | null;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-3">
      <div className="text-xs text-[#8892B8]">{label}</div>
      <div className={cn("mt-0.5 truncate text-sm font-medium text-[#EEF0F8]", valueClass)}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#6E9FFF] transition-colors"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/** Chevron icon for accordion sections. */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Collapsible accordion section using native <details>. */
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-lg border border-[#252A40] bg-[#0F1320]"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 hover:bg-[#171C2E] rounded-lg group-open:rounded-b-none transition-colors">
        <span className="font-medium text-[#EEF0F8]">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#4A5070] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#252A40] px-5 py-5">{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      evidence: { orderBy: { createdAt: "desc" } },
      listings: { orderBy: [{ source: "asc" }, { updatedAt: "desc" }] },
    },
  });
  if (!product) notFound();

  const productForGrading = {
    form: product.form,
    coaStatus: product.coaStatus,
    manufacturingCountryClaim: product.manufacturingCountryClaim,
    thirdPartyTestingLab: product.thirdPartyTestingLab,
    gmpCertified: product.gmpCertified,
    hasPatentClaim: product.hasPatentClaim,
    brandSlug: product.brand.slug,
  };
  const transparency = computeTransparencyGrade(productForGrading);
  const quality = computeQualityTier(productForGrading);
  const score = overallGradeScore(productForGrading);
  const MAX_SCORE = 14;

  // Category rank — how does this product sit among same-form peers?
  const gradeOrder: Record<string, number> = { A_PLUS: 0, A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 };
  const formPeers = product.overallGrade
    ? await prisma.product.findMany({
        where: { form: product.form, isCanonical: true, dataCompleteness: { not: "LOW" }, overallGrade: { not: null } },
        select: { id: true, overallGrade: true },
      })
    : [];
  const currentOrder = product.overallGrade ? (gradeOrder[product.overallGrade] ?? 99) : 99;
  const categoryRank = formPeers.length
    ? { rank: formPeers.filter(p => (gradeOrder[p.overallGrade!] ?? 99) < currentOrder).length + 1, total: formPeers.length }
    : null;
  const gradeSummary = buildGradeSummary(
    { ...productForGrading, name: product.name },
    product.brand.name,
    score,
    MAX_SCORE,
    product.overallGrade,
    quality.tier,
  );

  // JSON-LD structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: product.brand.name,
        item: absoluteUrl(`/brand/${product.brand.slug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(`/product/${product.slug}`),
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription ?? undefined,
    brand: { "@type": "Brand", name: product.brand.name },
    url: absoluteUrl(`/product/${product.slug}`),
    ...(product.listings.length
      ? {
          offers: product.listings.map((l) => {
            const offer: Record<string, unknown> = {
              "@type": "Offer",
              url: l.url,
              priceCurrency: l.currency ?? undefined,
              price:
                typeof l.priceCents === "number" && Number.isFinite(l.priceCents)
                  ? (l.priceCents / 100).toFixed(2)
                  : undefined,
              availability:
                typeof l.inStock === "boolean"
                  ? l.inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock"
                  : undefined,
              seller: l.seller ? { "@type": "Organization", name: l.seller } : undefined,
            };
            return offer;
          }),
        }
      : {}),
  };

  const reportSubject = encodeURIComponent(
    `Update request: ${product.brand.name} — ${product.name}`
  );
  const reportBody = encodeURIComponent(
    `I would like to report an update for:\n\n${product.brand.name} — ${product.name}\n${absoluteUrl(
      `/product/${product.slug}`
    )}\n\nWhat changed?\n- \n\nSource URL(s):\n- `
  );
  const reportEmail = process.env.NEXT_PUBLIC_REPORT_EMAIL ?? "updates@example.com";

  const compareOptions = await prisma.product.findMany({
    where: { isCanonical: true },
    select: { slug: true, name: true, brand: { select: { name: true } } },
    orderBy: [{ transparencyGrade: "desc" }, { qualityTier: "desc" }, { name: "asc" }],
    take: 200,
  });

  // Best buy link — prefer official, then Amazon
  const officialListing = product.listings.find((l) => l.source === "OFFICIAL" && l.status !== "INACTIVE");
  const amazonListing = product.listings.find((l) => l.source === "AMAZON" && l.status !== "INACTIVE");
  const buyLink = officialListing?.url ?? amazonListing?.url ?? null;

  return (
    <div className="space-y-3">
      {/* Hidden JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Not-canonical warning */}
      {!product.isCanonical && (
        <div
          className="rounded-lg border border-[#EAB308]/30 bg-[#201800] px-4 py-3 text-sm text-[#EAB308]"
          role="status"
        >
          <strong>Discovered / Needs Review.</strong> This product was discovered from a sitemap or
          other source and has not yet been verified. It is not shown in public search.
        </div>
      )}

      {/* ── HERO CARD ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5 sm:p-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-xs text-[#4A5070]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/brand/${product.brand.slug}`} className="hover:text-[#8892B8] transition-colors">
            {product.brand.name}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#8892B8]">{product.name}</span>
        </nav>

        {/* Two-column layout on desktop: left = existing content, right = grade summary */}
        <div className="md:grid md:grid-cols-[2fr_1fr] md:gap-8">
        <div>

        {/* Grade badge + name row */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Grade badge */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold",
                gradeBadgeClasses(product.overallGrade)
              )}
            >
              {gradeLabel(product.overallGrade)}
            </div>
            <Link
              href="/methodology"
              className="text-xs leading-tight text-[#8892B8] hover:text-[#EEF0F8] tabular-nums transition-colors"
              title="See grading methodology"
            >
              {score} / {MAX_SCORE} pts
            </Link>
            {categoryRank && (
              <span className="text-xs leading-tight text-[#8892B8] text-center">
                #{categoryRank.rank} of {categoryRank.total}
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#8892B8]">
              <Link href={`/brand/${product.brand.slug}`} className="hover:text-[#EEF0F8] font-medium transition-colors">
                {product.brand.name}
              </Link>
            </p>
            <h1 className="mt-0.5 font-serif text-xl font-semibold text-[#EEF0F8] sm:text-2xl">
              {product.name}
            </h1>

            {/* Quality tier + verified date */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  qualityTierClasses(quality.tier)
                )}
              >
                {labelQualityTier(quality.tier)}
              </span>
              {product.dataCompleteness === "LOW" && (
                <span className="inline-flex items-center rounded-full border border-[#252A40] bg-[#1F2540] px-2.5 py-0.5 text-xs text-[#4A5070]">
                  Limited data
                </span>
              )}
              {product.lastVerifiedAt && (
                <span className="text-xs text-[#8892B8]">
                  Verified{" "}
                  {new Date(product.lastVerifiedAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {product.coaUrl && (
                <a
                  href={product.coaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#22C55E]/30 bg-[#052010] px-3 py-1.5 text-xs font-medium text-[#22C55E] hover:bg-[#073018] transition-colors"
                >
                  View COA →
                </a>
              )}
              {buyLink && (
                <a
                  href={buyLink}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#252A40] bg-[#171C2E] px-3 py-1.5 text-xs font-medium text-[#8892B8] hover:border-[#313760] hover:text-[#EEF0F8] transition-colors"
                >
                  Shop →
                </a>
              )}
              {product.sourceDsldUrl && (
                <a
                  href={product.sourceDsldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#252A40] bg-[#171C2E] px-3 py-1.5 text-xs font-medium text-[#8892B8] hover:border-[#313760] hover:text-[#EEF0F8] transition-colors"
                >
                  FDA DSLD →
                </a>
              )}
              <a
                href={`mailto:${encodeURIComponent(reportEmail)}?subject=${reportSubject}&body=${reportBody}`}
                className="inline-flex items-center gap-1 rounded-lg border border-[#252A40] bg-[#171C2E] px-3 py-1.5 text-xs font-medium text-[#4A5070] hover:border-[#313760] hover:text-[#8892B8] transition-colors"
              >
                Report update
              </a>
            </div>
          </div>
        </div>

        {/* 4-up stat chips */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatChip label="Form" value={labelForm(product.form)} />
          <StatChip
            label="COA"
            value={labelCoaStatus(product.coaStatus)}
            href={product.coaUrl}
            valueClass={
              product.coaStatus === "PUBLIC"
                ? "text-emerald-700"
                : product.coaStatus === "NONE"
                ? "text-rose-700"
                : undefined
            }
          />
          <StatChip
            label="Made in"
            value={product.manufacturingCountryClaim ?? "—"}
          />
          <StatChip
            label="Testing lab"
            value={product.thirdPartyTestingLab?.trim() || "—"}
          />
        </div>

        {/* Secondary meta strip */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#8892B8] px-0.5">
          {product.heavyMetalsTested === "CONFIRMED" && (
            <span className="font-medium text-[#22C55E]">Heavy metals tested ✓</span>
          )}
          {product.heavyMetalsTested === "CLAIMED" && (
            <span className="text-[#EAB308]">Heavy metals tested (brand claim)</span>
          )}
          <span>
            GMP certified:{" "}
            <span className={cn("font-medium", product.gmpCertified ? "text-[#22C55E]" : "text-[#8892B8]")}>
              {product.gmpCertified ? "Yes" : "No"}
            </span>
          </span>
          {product.sourceRegion && (
            <span>
              Source region: <span className="font-medium text-[#8892B8]">{product.sourceRegion}</span>
            </span>
          )}
          {product.hasPatentClaim && (
            <span>
              Patented process: <span className="font-medium text-[#8892B8]">Yes</span>
            </span>
          )}
          {typeof product.pricePerServingCents === "number" && (
            <span>
              Price per serving:{" "}
              <span className="font-mono font-medium text-[#EEF0F8]">
                ${(product.pricePerServingCents / 100).toFixed(2)}
              </span>
            </span>
          )}
          {typeof product.pricePerGramCents === "number" && (
            <span>
              Price per gram:{" "}
              <span className="font-mono font-medium text-[#EEF0F8]">
                ${(product.pricePerGramCents / 100).toFixed(2)}
              </span>
            </span>
          )}
          {product.evidence.length > 0 && (
            <span>
              {product.evidence.length} evidence source{product.evidence.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        </div>{/* end left column */}

        {/* Right column — grade summary */}
        <div className="mt-5 md:mt-0 md:flex md:items-start">
          <div className="space-y-3 w-full">
            <div className="rounded-lg border border-[#252A40] bg-[#171C2E] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8892B8] mb-2">Why this grade?</p>
              <p className="text-sm text-[#8892B8] leading-relaxed">{gradeSummary}</p>
              <Link
                href="/methodology"
                className="mt-3 inline-block text-xs text-[#6E9FFF] hover:text-[#EEF0F8] underline underline-offset-2 transition-colors"
              >
                See full methodology →
              </Link>
            </div>

            {/* COA Quality Warning */}
            {product.metaDescription?.includes("COA") && (
              <div className="rounded-lg border border-[#EAB308]/30 bg-[#201800] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#EAB308] mb-2">⚠️ COA Quality Issue</p>
                <p className="text-sm text-[#8892B8] leading-relaxed">{product.metaDescription}</p>
              </div>
            )}
          </div>
        </div>

        </div>{/* end two-column grid */}
      </div>

      {/* ── ACCORDION SECTIONS ────────────────────────────────────────────────── */}

      {/* COA Review */}
      {product.coaNotes && (
        <Accordion title="COA document review" defaultOpen>
          <div className="space-y-3">
            <p className="text-sm text-[#8892B8] leading-relaxed">{product.coaNotes}</p>
            {product.coaAnalysedAt && (
              <p className="text-xs text-[#4A5070]">
                Reviewed{" "}
                {product.coaAnalysedAt.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {product.coaUrl && (
              <a
                href={product.coaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-[#6E9FFF] hover:text-[#EEF0F8] underline underline-offset-2 transition-colors"
              >
                View COA document →
              </a>
            )}
          </div>
        </Accordion>
      )}

      {/* Grading Breakdown */}
      <Accordion title="Grading breakdown">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#4A5070]">
              Transparency Grade: {transparency.grade}
            </div>
            <ul className="space-y-1.5 text-sm text-[#8892B8]">
              {transparency.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#313760]">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#4A5070]">
              Quality Tier: {labelQualityTier(quality.tier)}
            </div>
            <ul className="space-y-1.5 text-sm text-[#8892B8]">
              {quality.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#313760]">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-[#4A5070]">
          Overall grade score: {score} / {MAX_SCORE} points.{" "}
          <Link href="/methodology" className="text-[#6E9FFF] underline underline-offset-2 hover:text-[#EEF0F8] transition-colors">
            See full grading methodology →
          </Link>
        </p>
      </Accordion>

      {/* Ingredients */}
      <Accordion title="Ingredients">
        <div className="text-sm leading-6 text-[#8892B8] whitespace-pre-wrap">
          {product.ingredientText || "No ingredient text on file."}
        </div>
        {product.ingredientsNormalized.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.ingredientsNormalized.map((ing) => (
              <Badge key={ing} variant="muted">
                {ing}
              </Badge>
            ))}
          </div>
        )}
      </Accordion>

      {/* Manufacturing */}
      <Accordion title="Manufacturing details">
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-6">
            <dt className="text-[#4A5070]">Country (claim)</dt>
            <dd className="text-right text-[#EEF0F8]">
              {product.manufacturingCountryClaim ?? "—"}
            </dd>
          </div>
          {product.sourceRegion && (
            <div className="flex items-start justify-between gap-6">
              <dt className="text-[#4A5070]">Source region</dt>
              <dd className="text-right text-[#EEF0F8]">{product.sourceRegion}</dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-6">
            <dt className="text-[#4A5070]">GMP certified</dt>
            <dd className="text-right text-[#EEF0F8]">
              {product.gmpCertified ? "Yes" : "No"}
            </dd>
          </div>
          {product.hasPatentClaim && (
            <div className="flex items-start justify-between gap-6">
              <dt className="text-[#4A5070]">Patented process</dt>
              <dd className="text-right text-[#EEF0F8]">Yes</dd>
            </div>
          )}
          {product.manufacturingClaimText && (
            <div className="flex items-start justify-between gap-6">
              <dt className="shrink-0 text-[#4A5070]">Claim text</dt>
              <dd className="text-right text-[#EEF0F8] whitespace-pre-wrap">
                {product.manufacturingClaimText}
              </dd>
            </div>
          )}
          {product.manufacturingEvidenceUrl && (
            <div className="flex items-start justify-between gap-6">
              <dt className="text-[#4A5070]">Evidence URL</dt>
              <dd className="text-right">
                <a
                  href={product.manufacturingEvidenceUrl}
                  className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source →
                </a>
              </dd>
            </div>
          )}
          {product.officialCanonicalUrl && (
            <div className="flex items-start justify-between gap-6">
              <dt className="text-[#4A5070]">Official product page</dt>
              <dd className="text-right">
                <a
                  href={product.officialCanonicalUrl}
                  className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Visit brand site →
                </a>
              </dd>
            </div>
          )}
        </dl>
      </Accordion>

      {/* Evidence & Sources */}
      <Accordion title={`Evidence & sources${product.evidence.length ? ` (${product.evidence.length})` : ""}`}>
        {product.evidence.length ? (
          <div className="divide-y divide-[#252A40]">
            {product.evidence.map((e) => (
              <div key={e.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="text-sm font-medium text-[#EEF0F8]">
                    {labelEvidenceType(e.type)}
                  </div>
                  <a
                    href={e.url}
                    className="text-sm text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View source →
                  </a>
                </div>
                {e.quote && (
                  <p className="mt-2 text-sm leading-6 text-[#8892B8] whitespace-pre-wrap">
                    {e.quote}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#4A5070]">No evidence items have been added yet.</p>
        )}
        <p className="mt-4 border-t border-[#252A40] pt-4 text-xs text-[#4A5070]">
          Last verified:{" "}
          {product.lastVerifiedAt
            ? new Date(product.lastVerifiedAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—"}
        </p>
      </Accordion>

      {/* Where to Buy */}
      <Accordion
        title={`Where to buy${product.listings.length ? ` (${product.listings.length} listing${product.listings.length !== 1 ? "s" : ""})` : ""}`}
      >
        {product.listings.length ? (
          <div className="space-y-4">
            {(
              [
                "OFFICIAL",
                "AMAZON",
                "WALMART",
                "IHERB",
                "OTHER_RETAILER",
                "GOOGLE_SHOPPING",
                "MANUAL",
              ] satisfies ListingSource[]
            )
              .map((source) => ({
                source,
                listings: product.listings.filter((l) => l.source === source),
              }))
              .filter((g) => g.listings.length)
              .map((g) => (
                <div key={g.source}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#4A5070]">
                    {labelListingSource(g.source)}
                  </div>
                  <div className="space-y-2">
                    {g.listings.map((l) => (
                      <div
                        key={l.id}
                        className="flex flex-col gap-1 rounded-lg border border-[#252A40] bg-[#171C2E] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-[#8892B8]">
                            <a
                              href={l.url}
                              className="hover:text-[#EEF0F8] transition-colors"
                              target="_blank"
                              rel="nofollow noopener noreferrer"
                            >
                              {l.title ?? l.url}
                            </a>
                          </div>
                          {l.lastSeenAt && (
                            <div className="mt-0.5 text-xs text-[#4A5070]">
                              Last seen: {new Date(l.lastSeenAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="shrink-0 rounded-lg border border-[#252A40] bg-[#0F1320] px-3 py-1.5 text-xs font-medium text-[#8892B8] hover:border-[#313760] hover:text-[#EEF0F8] transition-colors"
                        >
                          Visit →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-[#4A5070]">No listings have been captured yet.</p>
        )}
      </Accordion>

      {/* Lab results link */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#EEF0F8]">COA & Lab Test Results</p>
          <p className="text-xs text-[#6E7A9A] mt-0.5">Full COA status, third-party lab, heavy metals data, and source documents</p>
        </div>
        <Link
          href={`/product/${product.slug}/lab-results`}
          className="shrink-0 rounded-lg border border-[#252A40] px-3 py-1.5 text-xs font-medium text-[#8892B8] hover:border-[#3D7AFF] hover:text-[#6E9FFF] transition-colors"
        >
          View lab results →
        </Link>
      </div>

      {/* Compare */}
      <Accordion title="Compare with another product">
        <p className="mb-4 text-sm text-[#8892B8]">
          Compare this product side-by-side with another from the database.
        </p>
        <ComparePicker
          currentSlug={product.slug}
          options={compareOptions.map((p) => ({
            slug: p.slug,
            label: `${p.brand.name} — ${p.name}`,
          }))}
        />
      </Accordion>
    </div>
  );
}
