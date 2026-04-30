import type { CoaStatus, OverallGrade, QualityTier, ProductForm, HeavyMetalsTested } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/components/ui";
import {
  gradeBadgeClasses,
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

const TAG_STYLES: Record<string, string> = {
  best_tested:   "text-[#38BDF8] bg-[#041828] border border-[#38BDF8]/30",
  best_value:    "text-[#22C55E] bg-[#052010] border border-[#22C55E]/30",
  best_resin:    "text-[#EAB308] bg-[#201800] border border-[#EAB308]/30",
  best_capsules: "text-[#A78BFA] bg-[#160F28] border border-[#A78BFA]/30",
  best_gummies:  "text-[#F472B6] bg-[#1E0618] border border-[#F472B6]/30",
  editors_pick:  "text-[#FB923C] bg-[#1E0805] border border-[#FB923C]/30",
};

function tagLabel(tag: string): string {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProductCard({ product: p }: { product: ProductCardData }) {
  return (
    <div className="group rounded-lg border border-[#252A40] bg-[#0F1320] transition-all duration-100 hover:bg-[#171C2E] hover:shadow-[0_4px_16px_rgba(0,0,0,0.65)] shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
      <div className="p-4">

        {/* Top: brand + name + grade badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.07em] text-[#4A5070]">
                {p.brand.name}
              </span>
              {p.dataCompleteness === "LOW" && (
                <span className="text-[10px] text-[#4A5070] border border-[#252A40] rounded px-1.5 py-px">
                  Unverified
                </span>
              )}
            </div>
            <Link
              href={`/product/${p.slug}`}
              className="text-sm font-semibold text-[#EEF0F8] leading-snug hover:text-[#6E9FFF] transition-colors"
            >
              {p.name}
            </Link>
            <div className="mt-1 text-xs text-[#8892B8]">
              {formLabel(p.form)}
            </div>
          </div>

          {/* Grade badge */}
          <div
            className={cn(
              "shrink-0 h-12 w-12 rounded-lg flex items-center justify-center text-xl font-bold",
              gradeBadgeClasses(p.overallGrade)
            )}
          >
            {gradeLabel(p.overallGrade)}
          </div>
        </div>

        {/* Pills: quality tier + COA + signals */}
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("inline-flex items-center rounded px-1.5 py-px text-xs font-medium", qualityTierClasses(p.qualityTier))}>
            {qualityTierLabel(p.qualityTier)}
          </span>
          <span className={cn("inline-flex items-center rounded px-1.5 py-px text-xs", coaStatusClasses(p.coaStatus))}>
            {coaLabel(p.coaStatus)}
          </span>
          {p.heavyMetalsTested === "CONFIRMED" && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-px text-xs text-[#22C55E] bg-[#052010] border border-[#22C55E]/30">
              <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>
              Heavy metals
            </span>
          )}
          {p.heavyMetalsTested === "CLAIMED" && (
            <span className="inline-flex items-center rounded px-1.5 py-px text-xs text-[#EAB308] bg-[#201800] border border-[#EAB308]/30">
              Heavy metals tested (unverified)
            </span>
          )}
          {p.bestForTags.map(tag => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center rounded px-1.5 py-px text-xs font-medium",
                TAG_STYLES[tag] ?? "text-[#EAB308] bg-[#201800] border border-[#EAB308]/30"
              )}
            >
              ★ {tagLabel(tag)}
            </span>
          ))}
        </div>

        {/* Bottom: price + meta */}
        <div className="mt-3 pt-3 border-t border-[#252A40] flex items-end justify-between gap-3">
          <div className="text-xs text-[#4A5070] space-y-0.5">
            {p.pricePerGramCents != null && (
              <div>
                <span className="font-mono font-medium text-[#EEF0F8]">${(p.pricePerGramCents / 100).toFixed(2)}</span>
                <span className="ml-0.5">/gram</span>
              </div>
            )}
            {p.pricePerServingCents != null && (
              <div>
                <span className="font-mono font-medium text-[#EEF0F8]">${(p.pricePerServingCents / 100).toFixed(2)}</span>
                <span className="ml-0.5">/serving</span>
              </div>
            )}
            {p.manufacturingCountryClaim && (
              <div>Made in <span className="text-[#8892B8]">{p.manufacturingCountryClaim}</span></div>
            )}
            {p.thirdPartyTestingLab && (
              <div>Lab: <span className="text-[#8892B8]">{p.thirdPartyTestingLab}</span></div>
            )}
            {p.lastVerifiedAt && (
              <div>Verified <span className="text-[#8892B8]">{new Date(p.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span></div>
            )}
          </div>

          {/* COA button */}
          {p.coaUrl && (
            <a
              href={p.coaUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                p.coaStatus === "PUBLIC"
                  ? "bg-[#3D7AFF] text-[#080B14] hover:bg-[#6E9FFF]"
                  : "border border-[#252A40] text-[#8892B8] hover:border-[#313760] hover:text-[#EEF0F8]"
              )}
            >
              View COA
              <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 10L10 2M10 2H5M10 2v5"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
