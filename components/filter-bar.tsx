"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/components/ui";

// Serialisable filter state — plain primitives only, no Prisma imports
export type FilterState = {
  qualityTier?: string;
  coaStatus?: string;
  thirdPartyTested?: boolean;
  heavyMetalsTested?: boolean;
  form?: string;
  manufacturingCountryClaim?: string;
  q?: string;
  page?: number;
  sort?: string;
  minPriceGram?: number;
  maxPriceGram?: number;
};

type Props = {
  filters: FilterState;
  total: number;
  active?: boolean;
};

function buildUrl(params: Record<string, string | undefined>): string {
  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") urlParams.set(k, v);
  }
  const qs = urlParams.toString();
  return qs ? `/?${qs}` : "/";
}

function filtersToParams(f: FilterState): Record<string, string | undefined> {
  return {
    qualityTier: f.qualityTier,
    coaStatus: f.coaStatus,
    thirdPartyTested: f.thirdPartyTested ? "true" : undefined,
    heavyMetalsTested: f.heavyMetalsTested ? "true" : undefined,
    form: f.form,
    manufacturingCountryClaim: f.manufacturingCountryClaim,
    q: f.q || undefined,
    sort: f.sort && f.sort !== "recommended" ? f.sort : undefined,
    minPriceGram: f.minPriceGram != null ? String(f.minPriceGram) : undefined,
    maxPriceGram: f.maxPriceGram != null ? String(f.maxPriceGram) : undefined,
  };
}

type ChipProps = {
  active: boolean;
  /** Tailwind classes applied when active (bg + text) */
  activeClass: string;
  /** Tailwind classes applied when inactive — lets each chip carry its own colour */
  inactiveClass?: string;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ active, activeClass, inactiveClass, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-100",
        active
          ? cn(activeClass, "shadow-sm")
          : cn(
              inactiveClass ?? "border-[#313760] bg-transparent text-[#8892B8] hover:text-[#EEF0F8] hover:border-[#4A5070]",
            )
      )}
    >
      {active && (
        <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#4A5070] w-16">
      {children}
    </span>
  );
}

export function FilterBar({ filters, total, active = false }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<FilterState>(filters);

  useEffect(() => {
    setOptimistic(filters);
  }, [filters]);

  function update(patch: Partial<FilterState>) {
    const next = { ...optimistic, ...patch };
    setOptimistic(next);
    router.push(buildUrl(filtersToParams(next)), { scroll: false });
  }

  function toggle(key: keyof FilterState, value: string) {
    const isActive = (optimistic[key] as string) === value;
    update({ [key]: isActive ? undefined : value });
  }

  const hasFilters =
    optimistic.qualityTier ||
    optimistic.coaStatus ||
    optimistic.thirdPartyTested ||
    optimistic.heavyMetalsTested ||
    optimistic.form ||
    optimistic.manufacturingCountryClaim ||
    optimistic.q ||
    optimistic.minPriceGram != null ||
    optimistic.maxPriceGram != null;

  return (
    <div className="space-y-3">
      {/* Filter groups */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] px-4 py-3 space-y-2.5">

        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#252A40]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#4A5070]">Filter by</span>
        </div>

        {/* Quality row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Quality</GroupLabel>
          <Chip active={optimistic.qualityTier === "ULTRA_PREMIUM"} activeClass="bg-[#052010] text-[#22C55E] border-[#22C55E]/30" onClick={() => toggle("qualityTier", "ULTRA_PREMIUM")}>Ultra Premium</Chip>
          <Chip active={optimistic.qualityTier === "PREMIUM"} activeClass="bg-[#051428] text-[#3B82F6] border-[#3B82F6]/30" onClick={() => toggle("qualityTier", "PREMIUM")}>Premium</Chip>
          <Chip active={optimistic.qualityTier === "AVERAGE"} activeClass="bg-[#201800] text-[#EAB308] border-[#EAB308]/30" onClick={() => toggle("qualityTier", "AVERAGE")}>Average</Chip>
          <Chip active={optimistic.qualityTier === "POOR"} activeClass="bg-[#200505] text-[#EF4444] border-[#EF4444]/30" onClick={() => toggle("qualityTier", "POOR")}>Poor</Chip>
        </div>

        {/* Divider */}
        <div className="border-t border-[#252A40]" />

        {/* Testing row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Testing</GroupLabel>
          <Chip active={optimistic.coaStatus === "PUBLIC"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("coaStatus", "PUBLIC")}>Public COA</Chip>
          <Chip active={!!optimistic.thirdPartyTested} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => update({ thirdPartyTested: optimistic.thirdPartyTested ? undefined : true })}>Named lab</Chip>
          <Chip active={!!optimistic.heavyMetalsTested} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => update({ heavyMetalsTested: optimistic.heavyMetalsTested ? undefined : true })}>Heavy metals tested</Chip>
        </div>

        {/* Divider */}
        <div className="border-t border-[#252A40]" />

        {/* Form + origin row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Form</GroupLabel>
          <Chip active={optimistic.form === "RESIN"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("form", "RESIN")}>Resin</Chip>
          <Chip active={optimistic.form === "CAPSULE"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("form", "CAPSULE")}>Capsule</Chip>
          <Chip active={optimistic.form === "TABLETS"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("form", "TABLETS")}>Tablet</Chip>
          <Chip active={optimistic.form === "POWDER"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("form", "POWDER")}>Powder</Chip>
          <Chip active={optimistic.form === "GUMMY"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("form", "GUMMY")}>Gummy</Chip>
          <span className="text-[#252A40] select-none mx-1">|</span>
          <Chip active={optimistic.manufacturingCountryClaim === "United States"} activeClass="bg-[#060E28] text-[#6E9FFF] border-[#3D7AFF]/40" onClick={() => toggle("manufacturingCountryClaim", "United States")}>US Made</Chip>
        </div>

        {/* Divider */}
        <div className="border-t border-[#252A40]" />

        {/* Price row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Price</GroupLabel>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#4A5070]">$/g</span>
            <input
              type="number" min="0" max="100" step="0.01" placeholder="Min"
              value={optimistic.minPriceGram ?? ""}
              onChange={(e) => { const v = e.target.value === "" ? undefined : parseFloat(e.target.value); update({ minPriceGram: v }); }}
              className="w-20 rounded border border-[#252A40] bg-[#1F2540] px-2.5 py-1 text-xs text-[#EEF0F8] placeholder-[#4A5070] focus:border-[#3D7AFF] focus:outline-none"
            />
            <span className="text-xs text-[#4A5070]">—</span>
            <input
              type="number" min="0" max="100" step="0.01" placeholder="Max"
              value={optimistic.maxPriceGram ?? ""}
              onChange={(e) => { const v = e.target.value === "" ? undefined : parseFloat(e.target.value); update({ maxPriceGram: v }); }}
              className="w-20 rounded border border-[#252A40] bg-[#1F2540] px-2.5 py-1 text-xs text-[#EEF0F8] placeholder-[#4A5070] focus:border-[#3D7AFF] focus:outline-none"
            />
          </div>
        </div>

        {/* Count + reset */}
        {active && (
          <div className="flex items-center justify-between border-t border-[#252A40] pt-2.5">
            <span className="text-xs text-[#4A5070]">
              <span className="font-semibold text-[#EEF0F8]">{total}</span> product{total !== 1 ? "s" : ""} matched
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setOptimistic({});
                  router.push("/", { scroll: false });
                }}
                className="text-xs font-medium text-[#6E9FFF] hover:text-[#EEF0F8] underline underline-offset-2 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Glossary strip */}
      <details className="group rounded-lg border border-[#252A40] bg-[#0F1320] text-xs text-[#8892B8]">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 hover:text-[#EEF0F8] select-none transition-colors">
          <svg className="h-3.5 w-3.5 shrink-0 text-[#4A5070] transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
          <span className="font-medium text-[#4A5070] group-hover:text-[#8892B8] transition-colors">What do these filters mean?</span>
        </summary>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-[#252A40] px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="font-semibold text-[#EEF0F8] mb-1.5">Quality Tier</div>
            <ul className="space-y-1.5 text-[#8892B8]">
              <li><span className="font-medium text-[#22C55E]">Ultra Premium</span> — standalone, verifiable COA from a named third-party lab; GMP certified</li>
              <li><span className="font-medium text-[#3B82F6]">Premium</span> — public COA and at least one other major transparency signal</li>
              <li><span className="font-medium text-[#EAB308]">Average</span> — some transparency signals present but gaps remain</li>
              <li><span className="font-medium text-[#EF4444]">Poor</span> — little or no verifiable transparency information</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[#EEF0F8] mb-1.5">COA Status</div>
            <ul className="space-y-1.5 text-[#8892B8]">
              <li><span className="font-medium text-[#EEF0F8]">Public</span> — a downloadable or directly linkable Certificate of Analysis is publicly available</li>
              <li><span className="font-medium text-[#EEF0F8]">Page-embedded</span> — COA shown as an image on the product page but not independently downloadable</li>
              <li><span className="font-medium text-[#EEF0F8]">On request</span> — brand states a COA exists but you must contact them to receive it</li>
              <li><span className="font-medium text-[#EEF0F8]">None / Unknown</span> — no COA evidence found</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-[#EEF0F8] mb-1.5">Other filters</div>
            <ul className="space-y-1.5 text-[#8892B8]">
              <li><span className="font-medium text-[#EEF0F8]">Named lab</span> — the brand publicly identifies the third-party testing laboratory (e.g. Eurofins, NSF)</li>
              <li><span className="font-medium text-[#EEF0F8]">Heavy metals tested</span> — tested for lead, mercury, arsenic, and cadmium. &ldquo;Confirmed&rdquo; = verifiable evidence; &ldquo;Claimed&rdquo; = brand states testing but no independent verification</li>
              <li><span className="font-medium text-[#EEF0F8]">Form</span> — the physical format of the supplement (resin, capsule, powder, etc.)</li>
              <li><span className="font-medium text-[#EEF0F8]">US Made</span> — brand claims the product is manufactured in the United States</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
