import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { labelCoaStatus } from "@/lib/labels";
import { gradeBadgeClasses, gradeLabel } from "@/lib/grade-colors";
import { ArticleSchema } from "@/components/article-schema";
import { cn } from "@/components/ui";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: {
      isCanonical: true,
      dataCompleteness: { not: "LOW" },
      OR: [
        { coaUrl: { not: null } },
        { thirdPartyTestingLab: { not: null } },
        { heavyMetalsTested: { not: null } },
        { coaNotes: { not: null } },
      ],
    },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, slug: true, brand: { select: { name: true } } },
  });
  if (!product) return { title: "Product not found" };

  const title = `${product.brand.name} ${product.name} Lab Test Results & COA | ShilajitDB`;
  const description = `Certificate of Analysis status, third-party lab testing, and heavy metal safety data for ${product.brand.name} ${product.name}. Independent, unaffiliated review.`;
  const canonical = absoluteUrl(`/product/${slug}/lab-results`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

const coaStatusColor: Record<string, string> = {
  PUBLIC:          "text-[#22C55E] bg-[#052010] border-[#22C55E]/30",
  PUBLIC_EMBEDDED: "text-[#38BDF8] bg-[#041828] border-[#38BDF8]/30",
  REQUEST_ONLY:    "text-[#EAB308] bg-[#201800] border-[#EAB308]/30",
  NONE:            "text-[#EF4444] bg-[#200505] border-[#EF4444]/30",
  UNKNOWN:         "text-[#6E7A9A] bg-[#0F1320] border-[#252A40]",
};

const hmColor: Record<string, string> = {
  CONFIRMED: "text-[#22C55E]",
  CLAIMED:   "text-[#EAB308]",
  NONE:      "text-[#EF4444]",
};

const hmLabel: Record<string, string> = {
  CONFIRMED: "Confirmed — numeric values (e.g. Pb: 0.15 ppm) present on COA",
  CLAIMED:   "Claimed — brand states testing was done; specific values not publicly available",
  NONE:      "Not tested",
};

export default async function ProductLabResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      form: true,
      coaStatus: true,
      coaUrl: true,
      coaNotes: true,
      coaAnalysedAt: true,
      thirdPartyTestingLab: true,
      heavyMetalsTested: true,
      lastVerifiedAt: true,
      dataCompleteness: true,
      overallGrade: true,
      gmpCertified: true,
      hasPatentClaim: true,
      manufacturingCountryClaim: true,
      sourceRegion: true,
      brand: { select: { name: true, slug: true } },
      evidence: {
        where: { type: { in: ["COA", "TESTING"] } },
        select: { id: true, type: true, url: true, sourceName: true, quote: true },
      },
    },
  });
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",             item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: product.brand.name, item: absoluteUrl(`/brand/${product.brand.slug}`) },
      { "@type": "ListItem", position: 3, name: product.name,       item: absoluteUrl(`/product/${product.slug}`) },
      { "@type": "ListItem", position: 4, name: "Lab Results",      item: absoluteUrl(`/product/${product.slug}/lab-results`) },
    ],
  };

  const hasLabData = product.coaUrl || product.thirdPartyTestingLab || product.heavyMetalsTested || product.coaNotes;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleSchema
        slug={`product-lab-results-${product.slug}`}
        title={`${product.brand.name} ${product.name}: Lab Test Results & COA`}
        description={`Certificate of Analysis status, third-party lab testing, and heavy metal safety data for ${product.brand.name} ${product.name}.`}
        datePublished="2026-05-14"
      />

      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <div className="flex items-center gap-2 text-xs text-[#4A5070] mb-3">
            <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/brand/${product.brand.slug}`} className="hover:text-[#8892B8] transition-colors">{product.brand.name}</Link>
            <span>/</span>
            <Link href={`/product/${product.slug}`} className="hover:text-[#8892B8] transition-colors">{product.name}</Link>
            <span>/</span>
            <span>Lab Results</span>
          </div>

          <div className="flex items-start gap-4">
            <div className={cn(
              "shrink-0 h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold",
              gradeBadgeClasses(product.overallGrade),
            )}>
              {gradeLabel(product.overallGrade)}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6E7A9A] mb-0.5">{product.brand.name}</p>
              <h1 className="font-serif text-xl font-semibold text-[#EEF0F8] leading-snug">
                {product.name}: Lab Test Results & COA
              </h1>
              <p className="mt-2 text-sm text-[#C8D0E8] leading-relaxed max-w-2xl">
                This page collects all available Certificate of Analysis data, third-party lab testing information,
                and heavy metal safety signals for this product. Data is sourced from publicly available
                documentation. We do not accept payment from brands.
              </p>
            </div>
          </div>
        </div>

        {/* COA status */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <h2 className="text-sm font-semibold text-[#EEF0F8] mb-4">Certificate of Analysis (COA)</h2>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <p className="text-xs text-[#4A5070] mb-1.5">COA status</p>
              <span className={cn(
                "inline-block rounded px-2.5 py-1 text-xs font-semibold border",
                coaStatusColor[product.coaStatus] ?? coaStatusColor.UNKNOWN,
              )}>
                {labelCoaStatus(product.coaStatus)}
              </span>
            </div>

            {product.coaUrl && product.coaStatus === "PUBLIC" && (
              <div>
                <p className="text-xs text-[#4A5070] mb-1.5">View document</p>
                <a
                  href={product.coaUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-[#3D7AFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6E9FFF] transition-colors"
                >
                  View COA
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 10L10 2M10 2H5M10 2v5"/>
                  </svg>
                </a>
              </div>
            )}

            {product.coaAnalysedAt && (
              <div>
                <p className="text-xs text-[#4A5070] mb-1.5">COA analysed</p>
                <p className="text-sm text-[#C8D0E8]">
                  {new Date(product.coaAnalysedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          {product.coaNotes && (
            <div className="mt-4 pt-4 border-t border-[#252A40]">
              <p className="text-xs font-medium text-[#6E7A9A] mb-2">COA document review notes</p>
              <p className="text-sm text-[#8892B8] leading-relaxed">{product.coaNotes}</p>
            </div>
          )}

          {!product.coaUrl && product.coaStatus !== "PUBLIC" && (
            <div className="mt-4 pt-4 border-t border-[#252A40]">
              <p className="text-sm text-[#8892B8] leading-relaxed">
                {product.coaStatus === "REQUEST_ONLY"
                  ? "This brand states a COA is available on request. Contact the brand directly to obtain it. On-request COAs cannot be independently verified."
                  : product.coaStatus === "NONE"
                  ? "No Certificate of Analysis has been found for this product. Without a COA, safety claims (including heavy metals levels) cannot be independently verified."
                  : "COA availability for this product is unknown. Check the brand's website or contact them directly."}
              </p>
            </div>
          )}
        </div>

        {/* Third-party lab */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <h2 className="text-sm font-semibold text-[#EEF0F8] mb-4">Third-Party Laboratory</h2>
          {product.thirdPartyTestingLab ? (
            <>
              <p className="text-base font-semibold text-[#22C55E]">{product.thirdPartyTestingLab}</p>
              <p className="mt-2 text-sm text-[#8892B8] leading-relaxed">
                The brand publicly discloses that testing was performed by {product.thirdPartyTestingLab}.
                A named, independent laboratory is a key transparency signal — it means results can
                in principle be traced back to a specific accredited facility.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#EF4444]">Not disclosed</p>
              <p className="mt-2 text-sm text-[#8892B8] leading-relaxed">
                The testing laboratory is not publicly named for this product. Without a named lab,
                it is not possible to verify the independence or accreditation of any testing performed.
              </p>
            </>
          )}
        </div>

        {/* Heavy metals */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <h2 className="text-sm font-semibold text-[#EEF0F8] mb-4">Heavy Metals Testing</h2>
          <p className="text-xs text-[#4A5070] mb-1.5">Status</p>
          {product.heavyMetalsTested ? (
            <>
              <p className={cn("text-sm font-semibold", hmColor[product.heavyMetalsTested])}>
                {hmLabel[product.heavyMetalsTested] ?? product.heavyMetalsTested}
              </p>
              {product.heavyMetalsTested === "CONFIRMED" && (
                <p className="mt-3 text-sm text-[#8892B8] leading-relaxed">
                  The COA for this product includes numeric concentrations for heavy metals — at minimum
                  lead (Pb), arsenic (As), mercury (Hg), and cadmium (Cd). This is the highest standard
                  of heavy metal transparency. Check the COA directly to see the actual values and
                  compare against California Prop 65 or NSF limits.
                </p>
              )}
              {product.heavyMetalsTested === "CLAIMED" && (
                <p className="mt-3 text-sm text-[#8892B8] leading-relaxed">
                  The brand states that heavy metals have been tested, but the specific numeric results
                  are not publicly available. This cannot be independently verified without seeing the
                  actual COA values.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#6E7A9A]">Unknown</p>
          )}

          <div className="mt-4 pt-4 border-t border-[#252A40]">
            <p className="text-xs text-[#4A5070] leading-relaxed">
              Heavy metals to look for in a shilajit COA: lead (Pb), arsenic (As), mercury (Hg), cadmium (Cd).
              A rigorous COA shows parts-per-million (ppm) values for each, not just a pass/fail stamp.{" "}
              <Link href="/learn/shilajit-heavy-metals" className="text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
                Learn more about shilajit and heavy metals →
              </Link>
            </p>
          </div>
        </div>

        {/* Evidence links */}
        {product.evidence.length > 0 && (
          <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
            <h2 className="text-sm font-semibold text-[#EEF0F8] mb-4">Source Documents</h2>
            <div className="space-y-3">
              {product.evidence.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 rounded border border-[#252A40] bg-[#171C2E] px-1.5 py-0.5 text-xs text-[#6E7A9A]">
                    {ev.type === "COA" ? "COA" : "Testing"}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="text-sm text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors underline underline-offset-2 break-all"
                    >
                      {ev.sourceName ?? ev.url}
                    </a>
                    {ev.quote && (
                      <p className="mt-1 text-xs text-[#8892B8] leading-relaxed">&ldquo;{ev.quote}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manufacturing context */}
        {(product.manufacturingCountryClaim || product.gmpCertified || product.hasPatentClaim || product.sourceRegion) && (
          <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
            <h2 className="text-sm font-semibold text-[#EEF0F8] mb-4">Manufacturing & Sourcing</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              {product.manufacturingCountryClaim && (
                <div>
                  <p className="text-xs text-[#4A5070] mb-1">Country (claim)</p>
                  <p className="text-[#C8D0E8] font-medium">{product.manufacturingCountryClaim}</p>
                </div>
              )}
              {product.sourceRegion && (
                <div>
                  <p className="text-xs text-[#4A5070] mb-1">Source region</p>
                  <p className="text-[#C8D0E8] font-medium">{product.sourceRegion}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#4A5070] mb-1">GMP certified</p>
                <p className={product.gmpCertified ? "text-[#22C55E] font-medium" : "text-[#6E7A9A]"}>
                  {product.gmpCertified ? "Yes" : "Not confirmed"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4A5070] mb-1">Patent claim</p>
                <p className={product.hasPatentClaim ? "text-[#22C55E] font-medium" : "text-[#6E7A9A]"}>
                  {product.hasPatentClaim ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No lab data fallback */}
        {!hasLabData && (
          <div className="rounded-lg border border-dashed border-[#252A40] bg-[#0F1320] p-8 text-center">
            <p className="text-sm font-medium text-[#8892B8]">No lab testing data on record for this product.</p>
            <p className="mt-2 text-xs text-[#4A5070] max-w-md mx-auto">
              We have not found a publicly available Certificate of Analysis, named testing laboratory,
              or heavy metals documentation for this product.
            </p>
          </div>
        )}

        {/* Methodology note */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <p className="text-xs font-semibold text-[#EEF0F8] mb-2">About this data</p>
          <p className="text-xs text-[#8892B8] leading-relaxed">
            COA status is assessed based on publicly available documentation as of the last verified date
            shown on the product page. A certificate is marked &ldquo;Public&rdquo; only when it is directly
            accessible without needing to request it. Heavy metals are marked &ldquo;Confirmed&rdquo; only when
            the COA includes actual numeric concentrations. We do not independently audit laboratory
            accreditation for every entry.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/methodology" className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              Full grading methodology →
            </Link>
            <span className="text-xs text-[#4A5070]">·</span>
            <Link href="/learn/how-to-read-shilajit-coa" className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              How to read a shilajit COA →
            </Link>
            <span className="text-xs text-[#4A5070]">·</span>
            <Link href={`/brand/${product.brand.slug}/lab-tests`} className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              All {product.brand.name} lab tests →
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div>
          <Link href={`/product/${product.slug}`} className="text-sm text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
            ← Back to {product.name} product page
          </Link>
        </div>
      </div>
    </>
  );
}
