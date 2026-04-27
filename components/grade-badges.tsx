import type { QualityTier, TransparencyGrade } from "@prisma/client";
import { cn } from "@/components/ui";

export function TransparencyBadge({ grade }: { grade: TransparencyGrade }) {
  const cls =
    grade === "A"
      ? "border-[#22C55E]/30 bg-[#052010] text-[#22C55E]"
      : grade === "B"
        ? "border-[#3B82F6]/30 bg-[#051428] text-[#3B82F6]"
        : grade === "C"
          ? "border-[#EAB308]/30 bg-[#201800] text-[#EAB308]"
          : grade === "D"
            ? "border-[#EF4444]/30 bg-[#200505] text-[#EF4444]"
            : "border-[#EF4444]/30 bg-[#200505] text-[#EF4444]";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", cls)}>
      Transparency: {grade}
    </span>
  );
}

export function QualityBadge({ tier }: { tier: QualityTier }) {
  const cls =
    tier === "ULTRA_PREMIUM"
      ? "border-[#22C55E]/30 bg-[#052010] text-[#22C55E]"
      : tier === "PREMIUM"
        ? "border-[#3B82F6]/30 bg-[#051428] text-[#3B82F6]"
        : tier === "AVERAGE"
          ? "border-[#EAB308]/30 bg-[#201800] text-[#EAB308]"
          : "border-[#EF4444]/30 bg-[#200505] text-[#EF4444]";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", cls)}>
      Quality: {tier.replaceAll("_", " ")}
    </span>
  );
}

