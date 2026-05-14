"use client";

import { createContext, useContext, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/components/ui";
import { gradeBadgeClasses, gradeLabel } from "@/lib/grade-colors";
import type { OverallGrade } from "@prisma/client";

export type CompareItem = { slug: string; name: string; grade: OverallGrade | null };

type CompareContextValue = {
  selected: CompareItem[];
  toggle: (item: CompareItem) => void;
  isSelected: (slug: string) => boolean;
};

const CompareContext = createContext<CompareContextValue>({
  selected: [],
  toggle: () => {},
  isSelected: () => false,
});

export function useCompare() {
  return useContext(CompareContext);
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<CompareItem[]>([]);

  const toggle = useCallback((item: CompareItem) => {
    setSelected((prev) => {
      if (prev.some((p) => p.slug === item.slug)) {
        return prev.filter((p) => p.slug !== item.slug);
      }
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
  }, []);

  const isSelected = useCallback(
    (slug: string) => selected.some((p) => p.slug === slug),
    [selected],
  );

  const remove = useCallback((slug: string) => {
    setSelected((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  return (
    <CompareContext.Provider value={{ selected, toggle, isSelected }}>
      {children}
      {/* Spacer so the tray doesn't overlap the last card */}
      {selected.length > 0 && <div className="h-20" />}
      <CompareTray selected={selected} onRemove={remove} />
    </CompareContext.Provider>
  );
}

function CompareTray({
  selected,
  onRemove,
}: {
  selected: CompareItem[];
  onRemove: (slug: string) => void;
}) {
  if (selected.length === 0) return null;

  const compareUrl =
    selected.length === 2
      ? `/compare/${[selected[0].slug, selected[1].slug].sort().join("-vs-")}`
      : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#252A40] bg-[#0A0E1F]/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.8)]">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-[#6E7A9A]">
          Compare
        </span>

        <div className="flex flex-1 items-center gap-2 min-w-0 overflow-hidden">
          {selected.map((item) => (
            <div
              key={item.slug}
              className="flex items-center gap-2 rounded-lg border border-[#252A40] bg-[#171C2E] px-3 py-2 min-w-0"
            >
              <span
                className={cn(
                  "shrink-0 h-7 w-7 rounded flex items-center justify-center text-xs font-bold",
                  gradeBadgeClasses(item.grade),
                )}
              >
                {gradeLabel(item.grade)}
              </span>
              <span className="text-xs text-[#C8D0E8] truncate max-w-[140px] sm:max-w-xs">
                {item.name}
              </span>
              <button
                onClick={() => onRemove(item.slug)}
                className="shrink-0 ml-1 text-[#4A5070] hover:text-[#EEF0F8] transition-colors text-base leading-none"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}

          {selected.length === 1 && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#313760] px-3 py-2">
              <span className="text-xs text-[#4A5070]">Pick one more…</span>
            </div>
          )}
        </div>

        {compareUrl ? (
          <Link
            href={compareUrl}
            className="shrink-0 rounded-lg bg-[#3D7AFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6E9FFF] transition-colors"
          >
            Compare →
          </Link>
        ) : (
          <button
            onClick={() => selected[0] && onRemove(selected[0].slug)}
            className="shrink-0 text-xs text-[#4A5070] hover:text-[#EEF0F8] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
