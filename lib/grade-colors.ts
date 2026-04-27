import type { CoaStatus, OverallGrade, QualityTier } from "@prisma/client";

/** Tailwind classes for the grade badge pill — dark theme */
export function gradeBadgeClasses(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS":
    case "A":  return "text-[#22C55E] bg-[#052010] border border-[#22C55E]/30 font-mono";
    case "B":  return "text-[#3B82F6] bg-[#051428] border border-[#3B82F6]/30 font-mono";
    case "C":  return "text-[#EAB308] bg-[#201800] border border-[#EAB308]/30 font-mono";
    case "D":
    case "E":
    case "F":  return "text-[#EF4444] bg-[#200505] border border-[#EF4444]/30 font-mono";
    default:   return "text-[#4A5070] bg-[#1F2540] border border-[#252A40] font-mono";
  }
}

/** Color class for the grade letter used as a large accent */
export function gradeColorClass(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS":
    case "A":  return "text-[#22C55E]";
    case "B":  return "text-[#3B82F6]";
    case "C":  return "text-[#EAB308]";
    case "D":
    case "E":
    case "F":  return "text-[#EF4444]";
    default:   return "text-[#4A5070]";
  }
}

/** No longer used as a left border — kept for backward compat */
export function gradeAccentClass(_grade: OverallGrade | null): string {
  return "";
}

/** Display label for the overall grade (converts A_PLUS → "A+"). */
export function gradeLabel(grade: OverallGrade | null): string {
  if (!grade) return "—";
  return grade === "A_PLUS" ? "A+" : grade;
}

/** Tailwind classes for quality tier pill — dark theme */
export function qualityTierClasses(tier: QualityTier): string {
  switch (tier) {
    case "ULTRA_PREMIUM": return "text-[#22C55E] bg-[#052010] border border-[#22C55E]/30";
    case "PREMIUM":       return "text-[#3B82F6] bg-[#051428] border border-[#3B82F6]/30";
    case "AVERAGE":       return "text-[#EAB308] bg-[#201800] border border-[#EAB308]/30";
    case "POOR":          return "text-[#EF4444] bg-[#200505] border border-[#EF4444]/30";
  }
}

/** Tailwind classes for COA status pill — dark theme */
export function coaStatusClasses(status: CoaStatus): string {
  switch (status) {
    case "PUBLIC":          return "text-[#22C55E] bg-[#052010] border border-[#22C55E]/30";
    case "PUBLIC_EMBEDDED": return "text-[#EAB308] bg-[#201800] border border-[#EAB308]/30";
    case "REQUEST_ONLY":    return "text-[#8892B8] bg-[#1F2540] border border-[#252A40]";
    case "NONE":
    case "UNKNOWN":         return "text-[#4A5070] bg-[#1F2540] border border-[#252A40]";
  }
}
