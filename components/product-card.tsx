import type { CoaStatus, OverallGrade, QualityTier, ProductForm, HeavyMetalsTested } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/components/ui";
import {
  gradeBadgeClasses,
  gradeAccentClass,
  gradeLabel,
  qualityTierClasses,
  coaStatusClasses,
} from "@/lib/grade-colors";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  form: ProductForm;
  dataCompleteness: "LOW" | "MEDIUM" | "HIGH";
  manufacturingCountryClaim: string | null;
  coaStatus: CoaStatus;
  coaUrl: string | null;
  transparencyGrade: string;
  qualityTier: QualityTier;
  overallGrade: OverallGrade | null;
  thirdPartyTestingLab: string | null;
  lastVerifiedAt: Date | null;
  heavyMetalsTested: HeavyMetalsTested | null;
  bestForTags: string[];
  pricePerServingCents: number | null;
  pricePerGramCents: number | null;
  brand: { name: string; slug: string };
};

function qualityTierLabel(tier: QualityTier): string {
  return tier.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function coaLabel(status: CoaStatus): string {
  switch (status) {
    case "PUBLIC":          return "Public COA";
    case "PUBLIC_EMBEDDED": return "COA embedded";
    case "REQUEST_ONLY":    return "COA on request";
    case "NONE":            return "No COA";
    case "UNKNOWN":         return "COA unknown";
  }
}

function formLabel(form: ProductForm): string {
  return form.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

// Category-specific colours for best-for tags
const TAG_STYLES: Record<string, string> = {
  best_tested:   "bg-sky-50 border-sky-200 text-sky-800",
  best_value:    "bg-emerald-50 border-emerald-200 text-emerald-800",
  best_resin:    "bg-amber-50 border-amber-200 text-amber-800",
  best_capsules: "bg-violet-50 border-violet-200 text-violet-800",
  verified_safe: "bg-teal-50 border-teal-200 text-teal-800",
  editors_pick:  "bg-rose-50 border-rose-200 text-rose-800",
};

function tagLabel(tag: string): string {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProductCard({ product: p }: { product: ProductCardData }) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-stone-200 border-l-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-stone-300",
        gradeAccentClass(p.overallGrade)
      )}
    >
      <div className="flex items-stretch gap-0">
        {/* Grade badge column */}
        <div className="flex w-16 shrink-0 flex-col items-center justify-center px-2 py-5">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl text-xl font-black tracking-tight shadow-sm",
              gradeBadgeClasses(p.overallGrade)
            )}
          >
            {gradeLabel(p.overallGrade)}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-stone-100 my-3" />

        {/* Main content */}
        <div className="min-w-0 flex-1 px-4 py-5">

          {/* Row 1: Name + brand */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/product/${p.slug}`}
                  className="text-base font-bold tracking-tight text-slate-900 hover:text-slate-700 hover:underline underline-offset-2 transition-colors leading-snug"
                >
                  {p.name}
                </Link>
                {p.dataCompleteness === "LOW" && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
                    Unverified
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{p.brand.name}</span>
                <span className="text-stone-300">·</span>
                <span>{formLabel(p.form)}</span>
              </div>
            </div>

            {/* Tier + COA badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  qualityTierClasses(p.qualityTier)
                )}
              >
                {qualityTierLabel(p.qualityTier)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  coaStatusClasses(p.coaStatus)
                )}
              >
                {coaLabel(p.coaStatus)}
              </span>
              {p.heavyMetalsTested === "CONFIRMED" && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>
                  Heavy metals
                </span>
              )}
              {p.heavyMetalsTested === "CLAIMED" && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-700">
                  Heavy metals (claimed)
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Best-for tags */}
          {p.bestForTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.bestForTags.map(tag => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    TAG_STYLES[tag] ?? "bg-amber-50 border-amber-200 text-amber-800"
                  )}
                >
                  ★ {tagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          {/* Row 3: Price + origin + lab (secondary meta) */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
            {p.pricePerGramCents != null && (
              <span className="flex items-center gap-1">
                <span className="text-stone-400">$/gram</span>
                <span className="font-semibold text-slate-700">${(p.pricePerGramCents / 100).toFixed(2)}</span>
              </span>
            )}
            {p.pricePerServingCents != null && (
              <span className="flex items-center gap-1">
                <span className="text-stone-400">$/serving</span>
                <span className="font-semibold text-slate-700">${(p.pricePerServingCents / 100).toFixed(2)}</span>
              </span>
            )}
            {p.manufacturingCountryClaim && (
              <span className="flex items-center gap-1">
                <span className="text-stone-400">Made in</span>
                <span className="text-slate-600">{p.manufacturingCountryClaim}</span>
              </span>
            )}
            {p.thirdPartyTestingLab && (
              <span className="flex items-center gap-1">
                <span className="text-stone-400">Lab</span>
                <span className="text-slate-600">{p.thirdPartyTestingLab}</span>
              </span>
            )}
            {p.lastVerifiedAt && (
              <span className="flex items-center gap-1">
                <span className="text-stone-400">Verified</span>
                <span className="text-slate-600">
                  {new Date(p.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </span>
            )}

            {/* COA CTA — solid when public, ghost otherwise */}
            {p.coaUrl && (
              <a
                href={p.coaUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className={cn(
                  "ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  p.coaStatus === "PUBLIC"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                )}
              >
                View COA
                <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2 10L10 2M10 2H5M10 2v5"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
