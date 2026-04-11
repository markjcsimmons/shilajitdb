import type { CoaStatus, OverallGrade, QualityTier } from "@prisma/client";

/** Tailwind bg + text classes for the grade badge square. */
export function gradeBadgeClasses(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS": return "bg-emerald-600 text-white";
    case "A":      return "bg-emerald-500 text-white";
    case "B":      return "bg-sky-600 text-white";
    case "C":      return "bg-amber-500 text-white";
    case "D":      return "bg-orange-500 text-white";
    case "E":      return "bg-red-500 text-white";
    case "F":      return "bg-rose-700 text-white";
    default:       return "bg-slate-200 text-slate-500";
  }
}

/** Tailwind border-l color class for card left accent stripe. */
export function gradeAccentClass(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS":
    case "A":  return "border-l-emerald-400";
    case "B":  return "border-l-sky-400";
    case "C":  return "border-l-amber-400";
    case "D":  return "border-l-orange-400";
    case "E":
    case "F":  return "border-l-rose-400";
    default:   return "border-l-stone-200";
  }
}

/** Display label for the overall grade (converts A_PLUS → "A+"). */
export function gradeLabel(grade: OverallGrade | null): string {
  if (!grade) return "—";
  return grade === "A_PLUS" ? "A+" : grade;
}

/** Tailwind border + bg + text classes for quality tier pill. */
export function qualityTierClasses(tier: QualityTier): string {
  switch (tier) {
    case "ULTRA_PREMIUM": return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "PREMIUM":       return "border-sky-200 bg-sky-50 text-sky-800";
    case "AVERAGE":       return "border-amber-200 bg-amber-50 text-amber-900";
    case "POOR":          return "border-rose-200 bg-rose-50 text-rose-900";
  }
}

/** Tailwind border + bg + text classes for COA status pill. */
export function coaStatusClasses(status: CoaStatus): string {
  switch (status) {
    case "PUBLIC":       return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "REQUEST_ONLY": return "border-amber-200 bg-amber-50 text-amber-900";
    case "NONE":
    case "UNKNOWN":      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}
