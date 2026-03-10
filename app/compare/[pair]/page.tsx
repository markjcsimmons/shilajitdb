import { Badge, Button } from "@/components/ui";
import { prisma } from "@/lib/db";
import { computeQualityTier, computeTransparencyGrade } from "@/lib/grading";
import { labelClarity, labelCoaStatus, labelForm, labelQualityTier } from "@/lib/labels";
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

  const aT = computeTransparencyGrade(
    {
      form: a.form,
      ingredientText: a.ingredientText,
      ingredientsNormalized: a.ingredientsNormalized,
      manufacturingClarity: a.manufacturingClarity,
      coaStatus: a.coaStatus,
    },
    { count: a.evidence.length }
  );
  const bT = computeTransparencyGrade(
    {
      form: b.form,
      ingredientText: b.ingredientText,
      ingredientsNormalized: b.ingredientsNormalized,
      manufacturingClarity: b.manufacturingClarity,
      coaStatus: b.coaStatus,
    },
    { count: b.evidence.length }
  );
  const aQ = computeQualityTier(
    {
      form: a.form,
      ingredientText: a.ingredientText,
      ingredientsNormalized: a.ingredientsNormalized,
      manufacturingClarity: a.manufacturingClarity,
      coaStatus: a.coaStatus,
      brandSlug: a.brand.slug,
      hasOfficialLabels: a.evidence.length >= 2 || !!a.sourceDsldLabelId,
    },
    aT
  );
  const bQ = computeQualityTier(
    {
      form: b.form,
      ingredientText: b.ingredientText,
      ingredientsNormalized: b.ingredientsNormalized,
      manufacturingClarity: b.manufacturingClarity,
      coaStatus: b.coaStatus,
      brandSlug: b.brand.slug,
      hasOfficialLabels: b.evidence.length >= 2 || !!b.sourceDsldLabelId,
    },
    bT
  );

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
      label: "Manufacturing clarity",
      a: labelClarity(a.manufacturingClarity),
      b: labelClarity(b.manufacturingClarity),
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Compare</h1>
            <p className="mt-2 text-sm text-slate-700">
              <Link href={`/product/${a.slug}`} className="underline underline-offset-4">
                {a.brand.name} — {a.name}
              </Link>{" "}
              vs{" "}
              <Link href={`/product/${b.slug}`} className="underline underline-offset-4">
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
          <div className="border-b border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 lg:border-b-0 lg:border-r">
            Field
          </div>
          <div className="border-b border-slate-200 p-4 text-sm font-medium text-slate-900 lg:border-b-0 lg:border-r">
            {a.brand.name} — {a.name}
          </div>
          <div className="p-4 text-sm font-medium text-slate-900">{b.brand.name} — {b.name}</div>
        </div>
        <div className="divide-y divide-slate-200">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-1 lg:grid-cols-3">
              <div className="bg-slate-50 p-4 text-sm text-slate-700 lg:border-r lg:border-slate-200">
                {r.label}
              </div>
              <div className="p-4 text-sm text-slate-900 lg:border-r lg:border-slate-200">
                {"isLink" in r && r.isLink && r.a !== "—" ? (
                  <a href={r.a} target="_blank" rel="nofollow" className="underline underline-offset-4">
                    View
                  </a>
                ) : (
                  r.a
                )}
              </div>
              <div className="p-4 text-sm text-slate-900">
                {"isLink" in r && r.isLink && r.b !== "—" ? (
                  <a href={r.b} target="_blank" rel="nofollow" className="underline underline-offset-4">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Why {a.brand.name} — {a.name}
          </h2>
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-900">Transparency</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {aT.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-900">Quality</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {aQ.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Why {b.brand.name} — {b.name}
          </h2>
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-900">Transparency</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {bT.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-900">Quality</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
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

