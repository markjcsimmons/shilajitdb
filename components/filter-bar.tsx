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
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
        active
          ? cn(activeClass, "border-transparent text-white shadow-md scale-[1.03]")
          : cn(
              inactiveClass ?? "border-stone-200 bg-white text-stone-600",
              "hover:scale-[1.03] hover:shadow-sm"
            )
      )}
    >
      {active && (
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-stone-400 w-16">
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
    optimistic.q;

  return (
    <div className="space-y-3">
      {/* Filter groups */}
      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm space-y-2.5">

        {/* Quality row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Quality</GroupLabel>
          <Chip
            active={optimistic.qualityTier === "ULTRA_PREMIUM"}
            activeClass="bg-emerald-600"
            inactiveClass="border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
            onClick={() => toggle("qualityTier", "ULTRA_PREMIUM")}
          >
            Ultra Premium
          </Chip>
          <Chip
            active={optimistic.qualityTier === "PREMIUM"}
            activeClass="bg-sky-600"
            inactiveClass="border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-100"
            onClick={() => toggle("qualityTier", "PREMIUM")}
          >
            Premium
          </Chip>
          <Chip
            active={optimistic.qualityTier === "AVERAGE"}
            activeClass="bg-amber-500"
            inactiveClass="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100"
            onClick={() => toggle("qualityTier", "AVERAGE")}
          >
            Average
          </Chip>
          <Chip
            active={optimistic.qualityTier === "POOR"}
            activeClass="bg-rose-600"
            inactiveClass="border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100"
            onClick={() => toggle("qualityTier", "POOR")}
          >
            Poor
          </Chip>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-100" />

        {/* Testing row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Testing</GroupLabel>
          <Chip
            active={optimistic.coaStatus === "PUBLIC"}
            activeClass="bg-slate-700"
            inactiveClass="border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            onClick={() => toggle("coaStatus", "PUBLIC")}
          >
            Public COA
          </Chip>
          <Chip
            active={!!optimistic.thirdPartyTested}
            activeClass="bg-slate-700"
            inactiveClass="border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            onClick={() => update({ thirdPartyTested: optimistic.thirdPartyTested ? undefined : true })}
          >
            Named lab
          </Chip>
          <Chip
            active={!!optimistic.heavyMetalsTested}
            activeClass="bg-slate-700"
            inactiveClass="border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            onClick={() => update({ heavyMetalsTested: optimistic.heavyMetalsTested ? undefined : true })}
          >
            Heavy metals tested
          </Chip>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-100" />

        {/* Form + origin row */}
        <div className="flex flex-wrap items-center gap-2">
          <GroupLabel>Form</GroupLabel>
          <Chip active={optimistic.form === "RESIN"} activeClass="bg-slate-700" inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100" onClick={() => toggle("form", "RESIN")}>Resin</Chip>
          <Chip active={optimistic.form === "CAPSULE"} activeClass="bg-slate-700" inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100" onClick={() => toggle("form", "CAPSULE")}>Capsule</Chip>
          <Chip active={optimistic.form === "TABLETS"} activeClass="bg-slate-700" inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100" onClick={() => toggle("form", "TABLETS")}>Tablet</Chip>
          <Chip active={optimistic.form === "POWDER"} activeClass="bg-slate-700" inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100" onClick={() => toggle("form", "POWDER")}>Powder</Chip>
          <Chip active={optimistic.form === "GUMMY"} activeClass="bg-slate-700" inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100" onClick={() => toggle("form", "GUMMY")}>Gummy</Chip>
          <span className="text-stone-200 select-none mx-1">|</span>
          <Chip
            active={optimistic.manufacturingCountryClaim === "United States"}
            activeClass="bg-slate-700"
            inactiveClass="border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100"
            onClick={() => toggle("manufacturingCountryClaim", "United States")}
          >
            US Made
          </Chip>
        </div>

        {/* Count + reset */}
        {active && (
          <div className="flex items-center justify-between border-t border-stone-100 pt-2.5">
            <span className="text-xs text-stone-500">
              <span className="font-semibold text-slate-800">{total}</span> product{total !== 1 ? "s" : ""} matched
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setOptimistic({});
                  router.push("/", { scroll: false });
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 underline underline-offset-2 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Glossary strip */}
      <details className="group rounded-xl border border-stone-200 bg-white text-xs text-stone-600 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 hover:text-stone-900 select-none">
          <svg className="h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
          <span className="font-medium">What do these filters mean?</span>
        </summary>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-stone-100 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="font-semibold text-stone-700 mb-1.5">Quality Tier</div>
            <ul className="space-y-1.5 text-stone-500">
              <li><span className="font-medium text-emerald-700">Ultra Premium</span> — standalone, verifiable COA from a named third-party lab; GMP certified</li>
              <li><span className="font-medium text-sky-700">Premium</span> — public COA and at least one other major transparency signal</li>
              <li><span className="font-medium text-amber-600">Average</span> — some transparency signals present but gaps remain</li>
              <li><span className="font-medium text-rose-600">Poor</span> — little or no verifiable transparency information</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-stone-700 mb-1.5">COA Status</div>
            <ul className="space-y-1.5 text-stone-500">
              <li><span className="font-medium text-stone-700">Public</span> — a downloadable or directly linkable Certificate of Analysis is publicly available</li>
              <li><span className="font-medium text-stone-700">Page-embedded</span> — COA shown as an image on the product page but not independently downloadable</li>
              <li><span className="font-medium text-stone-700">On request</span> — brand states a COA exists but you must contact them to receive it</li>
              <li><span className="font-medium text-stone-700">None / Unknown</span> — no COA evidence found</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-stone-700 mb-1.5">Other filters</div>
            <ul className="space-y-1.5 text-stone-500">
              <li><span className="font-medium text-stone-700">Named lab</span> — the brand publicly identifies the third-party testing laboratory (e.g. Eurofins, NSF)</li>
              <li><span className="font-medium text-stone-700">Heavy metals tested</span> — tested for lead, mercury, arsenic, and cadmium. &ldquo;Confirmed&rdquo; = verifiable evidence; &ldquo;Claimed&rdquo; = brand states testing but no independent verification</li>
              <li><span className="font-medium text-stone-700">Form</span> — the physical format of the supplement (resin, capsule, powder, etc.)</li>
              <li><span className="font-medium text-stone-700">US Made</span> — brand claims the product is manufactured in the United States</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
