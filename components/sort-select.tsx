"use client";

import { useRouter } from "next/navigation";
import { SORT_LABELS, type SortOption } from "@/lib/search";
import type { FilterState } from "@/components/filter-bar";

type Props = {
  current: SortOption;
  filters: FilterState;
};

function buildUrl(params: Record<string, string | undefined>): string {
  const urlParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") urlParams.set(k, v);
  }
  const qs = urlParams.toString();
  return qs ? `/?${qs}` : "/";
}

function filtersToParams(f: FilterState, sort: SortOption): Record<string, string | undefined> {
  return {
    q: f.q || undefined,
    qualityTier: f.qualityTier,
    coaStatus: f.coaStatus,
    thirdPartyTested: f.thirdPartyTested ? "true" : undefined,
    heavyMetalsTested: f.heavyMetalsTested ? "true" : undefined,
    form: f.form,
    manufacturingCountryClaim: f.manufacturingCountryClaim,
    minPriceGram: f.minPriceGram != null ? String(f.minPriceGram) : undefined,
    maxPriceGram: f.maxPriceGram != null ? String(f.maxPriceGram) : undefined,
    sort: sort !== "recommended" ? sort : undefined,
  };
}

export function SortSelect({ current, filters }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sort = e.target.value as SortOption;
    router.push(buildUrl(filtersToParams(filters, sort)), { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs text-[#8892B8]">Sort</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-[#252A40] bg-[#0F1320] px-3 py-2 text-xs font-medium text-[#B8C0D4] focus:border-[#3D7AFF] focus:outline-none focus:ring-1 focus:ring-[#3D7AFF]/30"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}
