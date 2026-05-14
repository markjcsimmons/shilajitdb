"use client";

import { useCompare } from "@/components/compare-provider";
import { cn } from "@/components/ui";
import type { OverallGrade } from "@prisma/client";

export function CompareButton({
  slug,
  name,
  grade,
}: {
  slug: string;
  name: string;
  grade: OverallGrade | null;
}) {
  const { toggle, isSelected, selected } = useCompare();
  const active = isSelected(slug);
  const disabled = !active && selected.length >= 2;

  return (
    <button
      onClick={() => toggle({ slug, name, grade })}
      disabled={disabled}
      className={cn(
        "w-full mt-2 rounded-lg border py-1.5 text-xs font-medium transition-all duration-100",
        active
          ? "border-[#3D7AFF] bg-[#060E28] text-[#6E9FFF]"
          : disabled
          ? "border-[#252A40] text-[#313760] cursor-not-allowed"
          : "border-[#252A40] text-[#8892B8] hover:border-[#3D7AFF] hover:text-[#6E9FFF] hover:bg-[#060E28]",
      )}
    >
      {active ? "✓ Added to compare" : disabled ? "Max 2 selected" : "+ Compare"}
    </button>
  );
}
