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
  };
}

type ChipProps = {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ active, activeClass, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
        active
          ? cn(activeClass, "border-transparent text-white")
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:shadow-sm"
      )}
    >
      {active && (
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function FilterBar({ filters, total, active = false }: Props) {
  const router = useRouter();
  // Optimistic state — updates instantly on click, syncs back when navigation resolves
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
    optimistic.q;

  return (
    <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2 py-1">
      {/* Quality */}
      <Chip active={optimistic.qualityTier === "ULTRA_PREMIUM"} activeClass="bg-emerald-600" onClick={() => toggle("qualityTier", "ULTRA_PREMIUM")}>
        Ultra Premium
      </Chip>
      <Chip active={optimistic.qualityTier === "PREMIUM"} activeClass="bg-sky-600" onClick={() => toggle("qualityTier", "PREMIUM")}>
        Premium
      </Chip>
      <Chip active={optimistic.qualityTier === "AVERAGE"} activeClass="bg-amber-500" onClick={() => toggle("qualityTier", "AVERAGE")}>
        Average
      </Chip>
      <Chip active={optimistic.qualityTier === "POOR"} activeClass="bg-rose-600" onClick={() => toggle("qualityTier", "POOR")}>
        Poor
      </Chip>

      <span className="text-stone-300" aria-hidden>·</span>

      {/* Testing */}
      <Chip active={optimistic.coaStatus === "PUBLIC"} activeClass="bg-slate-700" onClick={() => toggle("coaStatus", "PUBLIC")}>
        Public COA
      </Chip>
      <Chip active={!!optimistic.thirdPartyTested} activeClass="bg-slate-700" onClick={() => update({ thirdPartyTested: optimistic.thirdPartyTested ? undefined : true })}>
        Named lab
      </Chip>
      <Chip active={!!optimistic.heavyMetalsTested} activeClass="bg-slate-700" onClick={() => update({ heavyMetalsTested: optimistic.heavyMetalsTested ? undefined : true })}>
        Heavy metals tested
      </Chip>

      <span className="text-stone-300" aria-hidden>·</span>

      {/* Form */}
      <Chip active={optimistic.form === "RESIN"} activeClass="bg-slate-700" onClick={() => toggle("form", "RESIN")}>Resin</Chip>
      <Chip active={optimistic.form === "CAPSULE"} activeClass="bg-slate-700" onClick={() => toggle("form", "CAPSULE")}>Capsule</Chip>
      <Chip active={optimistic.form === "TABLETS"} activeClass="bg-slate-700" onClick={() => toggle("form", "TABLETS")}>Tablet</Chip>
      <Chip active={optimistic.form === "POWDER"} activeClass="bg-slate-700" onClick={() => toggle("form", "POWDER")}>Powder</Chip>
      <Chip active={optimistic.form === "GUMMY"} activeClass="bg-slate-700" onClick={() => toggle("form", "GUMMY")}>Gummy</Chip>

      <span className="text-stone-300" aria-hidden>·</span>

      {/* Origin */}
      <Chip active={optimistic.manufacturingCountryClaim === "United States"} activeClass="bg-slate-700" onClick={() => toggle("manufacturingCountryClaim", "United States")}>
        US Made
      </Chip>

      {/* Count + reset — only shown when a filter is active */}
      {active && (
        <span className="ml-auto flex items-center gap-3 text-xs text-stone-500">
          <span><span className="font-semibold text-stone-800">{total}</span> product{total !== 1 ? "s" : ""}</span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setOptimistic({});
                router.push("/", { scroll: false });
              }}
              className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-600 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all duration-150"
            >
              Reset
            </button>
          )}
        </span>
      )}
    </div>

    {/* Glossary strip */}
    <details className="group rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-600">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3.5 py-2 hover:text-stone-900">
        <svg className="h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
        What do these filters mean?
      </summary>
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-stone-200 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">

        <div>
          <div className="font-semibold text-stone-700 mb-1">Quality Tier</div>
          <ul className="space-y-1 text-stone-500">
            <li><span className="font-medium text-emerald-700">Ultra Premium</span> — standalone, verifiable COA from a named third-party lab; GMP certified</li>
            <li><span className="font-medium text-sky-700">Premium</span> — public COA and at least one other major transparency signal</li>
            <li><span className="font-medium text-amber-600">Average</span> — some transparency signals present but gaps remain (e.g. no named lab, embedded-only COA)</li>
            <li><span className="font-medium text-rose-600">Poor</span> — little or no verifiable transparency information</li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-stone-700 mb-1">COA Status</div>
          <ul className="space-y-1 text-stone-500">
            <li><span className="font-medium text-stone-700">Public</span> — a downloadable or directly linkable Certificate of Analysis is publicly available</li>
            <li><span className="font-medium text-stone-700">Page-embedded</span> — COA is shown as an image on the product page but is not independently downloadable</li>
            <li><span className="font-medium text-stone-700">On request</span> — brand states a COA exists but you must contact them to receive it</li>
            <li><span className="font-medium text-stone-700">None / Unknown</span> — no COA evidence found</li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-stone-700 mb-1">Other filters</div>
          <ul className="space-y-1 text-stone-500">
            <li><span className="font-medium text-stone-700">Named lab</span> — the brand publicly identifies the third-party testing laboratory by name (e.g. Eurofins, NSF)</li>
            <li><span className="font-medium text-stone-700">Heavy metals tested</span> — the product has been tested for lead, mercury, arsenic, and cadmium. &ldquo;Confirmed&rdquo; = verifiable evidence; &ldquo;Claimed&rdquo; = brand states testing but no independent verification</li>
            <li><span className="font-medium text-stone-700">Form</span> — the physical format of the supplement (resin, capsule, powder, etc.)</li>
            <li><span className="font-medium text-stone-700">US Made</span> — brand claims the product is manufactured in the United States</li>
          </ul>
        </div>

      </div>
    </details>
    </div>
  );
}
