import type { QualityTier, TransparencyGrade } from "@prisma/client";
import { cn } from "@/components/ui";

export function TransparencyBadge({ grade }: { grade: TransparencyGrade }) {
  const cls =
    grade === "A"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : grade === "B"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : grade === "C"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : grade === "D"
            ? "border-orange-200 bg-orange-50 text-orange-900"
            : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", cls)}>
      Transparency: {grade}
    </span>
  );
}

export function QualityBadge({ tier }: { tier: QualityTier }) {
  const cls =
    tier === "ULTRA_PREMIUM"
      ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
      : tier === "PREMIUM"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : tier === "AVERAGE"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", cls)}>
      {tier === "ULTRA_PREMIUM" ? "★ " : ""}Quality: {tier.replaceAll("_", " ")}
    </span>
  );
}

