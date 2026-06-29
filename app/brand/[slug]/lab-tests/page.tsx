import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { labelCoaStatus } from "@/lib/labels";
import { ArticleSchema } from "@/components/article-schema";
import { notFound } from "next/navigation";
import { cn } from "@/components/ui";

export const revalidate = 3600;

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    where: { products: { some: { isCanonical: true, coaUrl: { not: null } } } },
    select: { slug: true },
  });
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!brand) return { title: "Brand not found" };

  const title = `${brand.name} Shilajit COA & Heavy Metals Lab Results | ShilajitDB`;
  const description = `${brand.name} shilajit COA documents, heavy metals panel results (lead, arsenic, cadmium, mercury), and third-party lab accreditation. Independent review.`;
  const canonical = absoluteUrl(`/brand/${brand.slug}/lab-tests`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

const coaStatusColor: Record<string, string> = {
  PUBLIC: "text-[#22C55E] bg-[#052010] border-[#22C55E]/30",
  PUBLIC_EMBEDDED: "text-[#38BDF8] bg-[#041828] border-[#38BDF8]/30",
  REQUEST_ONLY: "text-[#EAB308] bg-[#201800] border-[#EAB308]/30",
  NONE: "text-[#EF4444] bg-[#200505] border-[#EF4444]/30",
  UNKNOWN: "text-[#6E7A9A] bg-[#0F1320] border-[#252A40]",
};

const hmColor: Record<string, string> = {
  CONFIRMED: "text-[#22C55E]",
  CLAIMED: "text-[#EAB308]",
  NOT_TESTED: "text-[#EF4444]",
};

const hmLabel: Record<string, string> = {
  CONFIRMED: "Confirmed (numeric values)",
  CLAIMED: "Claimed (unverified)",
  NOT_TESTED: "Not tested",
};

export default async function BrandLabTestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      website: true,
      products: {
        where: { isCanonical: true },
        select: {
          id: true,
          slug: true,
          name: true,
          form: true,
          coaStatus: true,
          coaUrl: true,
          coaNotes: true,
          thirdPartyTestingLab: true,
          heavyMetalsTested: true,
          lastVerifiedAt: true,
          dataCompleteness: true,
          overallGrade: true,
        },
        orderBy: [{ coaStatus: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!brand) notFound();

  const verifiedProducts = brand.products.filter((p) => p.dataCompleteness !== "LOW");
  const publicCoaProducts = verifiedProducts.filter((p) => p.coaStatus === "PUBLIC");
  const namedLabProducts = verifiedProducts.filter((p) => p.thirdPartyTestingLab?.trim());
  const confirmedHmProducts = verifiedProducts.filter((p) => p.heavyMetalsTested === "CONFIRMED");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: brand.name, item: absoluteUrl(`/brand/${brand.slug}`) },
      { "@type": "ListItem", position: 3, name: "Lab Tests", item: absoluteUrl(`/brand/${brand.slug}/lab-tests`) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleSchema
        slug={`brand-lab-tests-${brand.slug}`}
        path={`/brand/${brand.slug}/lab-tests`}
        title={`${brand.name} COA & Lab Test Results`}
        description={`Certificates of Analysis, third-party lab test results, and heavy metal testing documentation for ${brand.name} shilajit products.`}
        datePublished="2026-05-07"
      />

      <div className="space-y-6 max-w-4xl">
        {/* Breadcrumb + header */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <div className="flex items-center gap-2 text-xs text-[#4A5070] mb-3">
            <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/brand/${brand.slug}`} className="hover:text-[#8892B8] transition-colors">{brand.name}</Link>
            <span>/</span>
            <span>Lab Tests</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8] leading-snug">
            {brand.name}: COA & Lab Test Results
          </h1>
          <p className="mt-3 text-sm text-[#C8D0E8] leading-relaxed max-w-2xl">
            This page collects all available Certificates of Analysis, third-party lab test results,
            and testing transparency information for {brand.name} products in the ShilajitDB database.
            Data is sourced from publicly available brand documentation and independent research.
            We do not accept payment from brands and our assessments are not influenced by commercial relationships.
          </p>
          {brand.website && (
            <p className="mt-2 text-xs text-[#4A5070]">
              Brand website:{" "}
              <a href={brand.website} target="_blank" rel="nofollow noopener noreferrer" className="text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors underline underline-offset-2">
                {brand.website}
              </a>
            </p>
          )}
        </div>

        {/* Summary stats */}
        {verifiedProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: String(verifiedProducts.length), label: "Products reviewed" },
              { value: String(publicCoaProducts.length), label: "With public COA" },
              { value: String(namedLabProducts.length), label: "Named lab disclosed" },
              { value: String(confirmedHmProducts.length), label: "Heavy metals confirmed" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-4 text-center">
                <div className="font-mono text-2xl font-bold text-[#EEF0F8]">{s.value}</div>
                <div className="mt-1 text-xs text-[#6E7A9A]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* What these signals mean */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <h2 className="text-sm font-semibold text-[#EEF0F8] mb-3">How to read this page</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-[#8892B8]">
            <div>
              <p className="font-medium text-[#C8D0E8] mb-1">COA status</p>
              <p><span className="text-[#22C55E]">Public</span> — directly accessible without contacting the brand. The strongest signal.</p>
              <p className="mt-1"><span className="text-[#EAB308]">On request</span> — available but requires asking; cannot be independently verified without effort.</p>
              <p className="mt-1"><span className="text-[#EF4444]">None</span> — no Certificate of Analysis is available.</p>
            </div>
            <div>
              <p className="font-medium text-[#C8D0E8] mb-1">Third-party lab</p>
              <p>The named laboratory that performed testing. Only a named, independent, ISO 17025-accredited lab earns full credit in our grading. &quot;In-house&quot; or unnamed labs do not count as third-party.</p>
            </div>
            <div>
              <p className="font-medium text-[#C8D0E8] mb-1">Heavy metals</p>
              <p><span className="text-[#22C55E]">Confirmed</span> — the COA shows actual numeric concentrations for lead, arsenic, mercury, and cadmium.</p>
              <p className="mt-1"><span className="text-[#EAB308]">Claimed</span> — the brand states testing was done but specific numeric values are not publicly available.</p>
            </div>
          </div>
        </div>

        {/* Per-product lab data */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#EEF0F8] mb-3">
            Lab test data by product ({verifiedProducts.length} products)
          </h2>

          {verifiedProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#252A40] bg-[#0F1320] p-8 text-center text-sm text-[#8892B8]">
              No verified products found for this brand.
            </div>
          ) : (
            <div className="space-y-3">
              {verifiedProducts.map((p) => (
                <div key={p.id} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <Link
                        href={`/product/${p.slug}`}
                        className="text-sm font-semibold text-[#EEF0F8] hover:text-[#6E9FFF] transition-colors"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-[#6E7A9A] mt-0.5 capitalize">{p.form.toLowerCase().replace("_", " ")}</p>
                    </div>
                    {p.overallGrade && (
                      <span className="shrink-0 text-xs font-bold text-[#8892B8] border border-[#252A40] rounded px-2 py-1">
                        Grade {p.overallGrade.replace("_", "+")}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* COA Status */}
                    <div>
                      <p className="text-xs text-[#4A5070] mb-1">COA status</p>
                      <span className={cn(
                        "inline-block rounded px-2 py-1 text-xs font-medium border",
                        coaStatusColor[p.coaStatus] ?? coaStatusColor.UNKNOWN
                      )}>
                        {labelCoaStatus(p.coaStatus)}
                      </span>
                      {p.coaUrl && p.coaStatus === "PUBLIC" && (
                        <div className="mt-2">
                          <a
                            href={p.coaUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-[#3D7AFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6E9FFF] transition-colors"
                          >
                            View COA
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 10L10 2M10 2H5M10 2v5"/>
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Third-party lab */}
                    <div>
                      <p className="text-xs text-[#4A5070] mb-1">Third-party laboratory</p>
                      {p.thirdPartyTestingLab ? (
                        <p className="text-sm font-medium text-[#C8D0E8]">{p.thirdPartyTestingLab}</p>
                      ) : (
                        <p className="text-sm text-[#4A5070]">Not disclosed</p>
                      )}
                    </div>

                    {/* Heavy metals */}
                    <div>
                      <p className="text-xs text-[#4A5070] mb-1">Heavy metals tested</p>
                      {p.heavyMetalsTested ? (
                        <p className={cn("text-sm font-medium", hmColor[p.heavyMetalsTested] ?? "text-[#8892B8]")}>
                          {hmLabel[p.heavyMetalsTested] ?? p.heavyMetalsTested}
                        </p>
                      ) : (
                        <p className="text-sm text-[#4A5070]">Unknown</p>
                      )}
                    </div>
                  </div>

                  {/* COA notes if available */}
                  {p.coaNotes && (
                    <div className="mt-4 pt-4 border-t border-[#252A40]">
                      <p className="text-xs font-medium text-[#6E7A9A] mb-1">COA document review notes</p>
                      <p className="text-xs text-[#8892B8] leading-relaxed">{p.coaNotes}</p>
                    </div>
                  )}

                  {/* Last verified */}
                  {p.lastVerifiedAt && (
                    <p className="mt-3 text-xs text-[#4A5070]">
                      Last verified {new Date(p.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Methodology note */}
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5">
          <p className="text-xs font-semibold text-[#EEF0F8] mb-2">About this data</p>
          <p className="text-xs text-[#8892B8] leading-relaxed">
            COA status is assessed based on publicly available documentation. A certificate is
            marked &quot;Public&quot; only when it is directly accessible (via a link or embedded on the
            brand&apos;s website) without needing to request it. Heavy metals are marked &quot;Confirmed&quot;
            only when the COA includes actual numeric concentrations (e.g., Pb: 0.15 ppm) rather
            than a pass/fail stamp. Testing laboratory names are recorded as stated in the COA
            document; we do not independently audit lab accreditation for every entry.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/methodology" className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              Read the full grading methodology →
            </Link>
            <span className="text-xs text-[#4A5070]">·</span>
            <Link href="/learn/how-to-read-shilajit-coa" className="text-xs text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              How to read a shilajit COA →
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div>
          <Link
            href={`/brand/${brand.slug}`}
            className="text-sm text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors"
          >
            ← Back to {brand.name} brand page
          </Link>
        </div>
      </div>
    </>
  );
}
