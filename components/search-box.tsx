"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { FilterState } from "@/components/filter-bar";

type Props = {
  initialQ?: string;
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

function filtersToParams(f: FilterState, q: string | undefined): Record<string, string | undefined> {
  return {
    q,
    qualityTier: f.qualityTier,
    coaStatus: f.coaStatus,
    thirdPartyTested: f.thirdPartyTested ? "true" : undefined,
    form: f.form,
    manufacturingCountryClaim: f.manufacturingCountryClaim,
  };
}

export function SearchBox({ initialQ, filters }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQ ?? "");

  // Keep input in sync when URL changes (e.g. filter chip clears q)
  useEffect(() => {
    setValue(initialQ ?? "");
  }, [initialQ]);

  function navigate(q: string | undefined) {
    router.push(buildUrl(filtersToParams(filters, q)), { scroll: false });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    // If the field is cleared (native × button or select-all+delete), remove q from URL immediately
    if (v === "") navigate(undefined);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      navigate(value.trim() || undefined);
    }
  }

  return (
    <div className="relative mt-4">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
      </svg>
      <input
        type="search"
        value={value}
        placeholder="Search brand or product name…"
        onChange={handleChange}
        onKeyDown={handleKey}
        className="w-full rounded-xl border border-stone-200 bg-white py-3.5 pl-12 pr-20 text-base text-slate-900 shadow-sm placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:shadow-md"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-400 sm:block">
        ↵ Enter
      </span>
    </div>
  );
}
