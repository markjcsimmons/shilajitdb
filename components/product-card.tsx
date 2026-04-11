import type { CoaStatus, OverallGrade, QualityTier, ProductForm } from "@prisma/client";
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
  brand: { name: string; slug: string };
};

function qualityTierLabel(tier: QualityTier): string {
  return tier.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function coaLabel(status: CoaStatus): string {
  switch (status) {
    case "PUBLIC":          return "Public";
    case "PUBLIC_EMBEDDED": return "Page-embedded";
    case "REQUEST_ONLY":    return "On request";
    case "NONE":            return "None";
    case "UNKNOWN":         return "Unknown";
  }
}

function formLabel(form: ProductForm): string {
  return form.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

export function ProductCard({ product: p }: { product: ProductCardData }) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 border-l-4 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md", gradeAccentClass(p.overallGrade))}>
      <div className="flex items-start gap-4">
        {/* Overall Grade badge */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
            gradeBadgeClasses(p.overallGrade)
          )}
        >
          {gradeLabel(p.overallGrade)}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/product/${p.slug}`}
                className="text-base font-semibold tracking-tight text-stone-900 hover:underline"
              >
                {p.name}
              </Link>
              <div className="mt-0.5 text-sm text-slate-500">
                <Link href={`/brand/${p.brand.slug}`} className="hover:underline">
                  {p.brand.name}
                </Link>
                {" · "}
                {formLabel(p.form)}
              </div>
            </div>

            {/* Tier + COA badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  qualityTierClasses(p.qualityTier)
                )}
              >
                {qualityTierLabel(p.qualityTier)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
                  coaStatusClasses(p.coaStatus)
                )}
              >
                COA: {coaLabel(p.coaStatus)}
              </span>
              {p.dataCompleteness === "LOW" && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500">
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            {p.manufacturingCountryClaim && (
              <span>
                <span className="text-stone-400">Made in:</span>{" "}
                <span className="text-stone-700">{p.manufacturingCountryClaim}</span>
              </span>
            )}
            {p.thirdPartyTestingLab && (
              <span>
                <span className="text-stone-400">Lab:</span>{" "}
                <span className="text-stone-700">{p.thirdPartyTestingLab}</span>
              </span>
            )}
            {p.coaUrl && (
              <a
                href={p.coaUrl}
                className="text-slate-500 underline underline-offset-2 hover:text-slate-700"
                rel="nofollow"
                target="_blank"
              >
                View COA →
              </a>
            )}
            {p.lastVerifiedAt && (
              <span>
                <span className="text-stone-400">Verified:</span>{" "}
                {new Date(p.lastVerifiedAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
