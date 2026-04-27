import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { labelCoaStatus, labelForm, labelQualityTier } from "@/lib/labels";
import { absoluteUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function parsePair(pair: string) {
  const parts = pair.split("-vs-");
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (!a || !b) return null;
  return { a, b };
}

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
    prisma.product.findUnique({ where: { slug: aSlug }, select: { name: true, brand: { select: { name: true } } } }),
    prisma.product.findUnique({ where: { slug: bSlug }, select: { name: true, brand: { select: { name: true } } } }),
  ]);

  const title =
    a && b
      ? `Compare: ${a.brand.name} — ${a.name} vs ${b.brand.name} — ${b.name}`
      : "Compare products";
  const description =
    a && b
      ? `Side-by-side comparison of transparency and quality signals: form, ingredients, manufacturing claim clarity, COA status, grades, and evidence.`
      : "Compare two shilajit products side-by-side.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

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

  const rows = [
    {
      label: "Form",
      a: labelForm(a.form),
      b: labelForm(b.form),
    },
    {
      label: "Ingredients (normalized)",
      a: a.ingredientsNormalized.length ? a.ingredientsNormalized.join(", ") : "—",
      b: b.ingredientsNormalized.length ? b.ingredientsNormalized.join(", ") : "—",
    },
    {
      label: "Manufacturing country (claim)",
      a: a.manufacturingCountryClaim ?? "—",
      b: b.manufacturingCountryClaim ?? "—",
    },
    {
      label: "COA status",
      a: labelCoaStatus(a.coaStatus),
      b: labelCoaStatus(b.coaStatus),
    },
    {
      label: "COA link",
      a: a.coaUrl ? a.coaUrl : "—",
      b: b.coaUrl ? b.coaUrl : "—",
      isLink: true,
    },
    {
      label: "Transparency Grade",
      a: `${aT.grade} (score ${aT.score})`,
      b: `${bT.grade} (score ${bT.score})`,
    },
    {
      label: "Quality Tier",
      a: labelQualityTier(aQ.tier),
      b: labelQualityTier(bQ.tier),
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8]">Compare</h1>
            <p className="mt-2 text-sm text-[#8892B8]">
              <Link href={`/product/${a.slug}`} className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                {a.brand.name} — {a.name}
              </Link>{" "}
              vs{" "}
              <Link href={`/product/${b.slug}`} className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                {b.brand.name} — {b.name}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button href="/" variant="secondary">
              Back to search
            </Button>
            <Badge variant="muted">Canonical: /compare/{canonicalPair}</Badge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#252A40] bg-[#0F1320]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
          <div className="border-b border-[#252A40] bg-[#171C2E] p-4 text-sm font-medium text-[#4A5070] lg:border-b-0 lg:border-r">
            Field
          </div>
          <div className="border-b border-[#252A40] p-4 text-sm font-medium text-[#EEF0F8] lg:border-b-0 lg:border-r">
            {a.brand.name} — {a.name}
          </div>
          <div className="p-4 text-sm font-medium text-[#EEF0F8]">{b.brand.name} — {b.name}</div>
        </div>
        <div className="divide-y divide-[#252A40]">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-1 lg:grid-cols-3">
              <div className="bg-[#171C2E] p-4 text-sm text-[#4A5070] lg:border-r lg:border-[#252A40]">
                {r.label}
              </div>
              <div className="p-4 text-sm text-[#8892B8] lg:border-r lg:border-[#252A40]">
                {"isLink" in r && r.isLink && r.a !== "—" ? (
                  <a href={r.a} target="_blank" rel="nofollow" className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                    View
                  </a>
                ) : (
                  r.a
                )}
              </div>
              <div className="p-4 text-sm text-[#8892B8]">
                {"isLink" in r && r.isLink && r.b !== "—" ? (
                  <a href={r.b} target="_blank" rel="nofollow" className="text-[#6E9FFF] underline underline-offset-4 hover:text-[#EEF0F8] transition-colors">
                    View
                  </a>
                ) : (
                  r.b
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <h2 className="text-lg font-semibold text-[#EEF0F8]">
            Why {a.brand.name} — {a.name}
          </h2>
          <div className="mt-4">
            <div className="text-sm font-medium text-[#EEF0F8]">Transparency</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {aT.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-[#EEF0F8]">Quality</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {aQ.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
          <h2 className="text-lg font-semibold text-[#EEF0F8]">
            Why {b.brand.name} — {b.name}
          </h2>
          <div className="mt-4">
            <div className="text-sm font-medium text-[#EEF0F8]">Transparency</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {bT.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-[#EEF0F8]">Quality</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#8892B8]">
              {bQ.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

