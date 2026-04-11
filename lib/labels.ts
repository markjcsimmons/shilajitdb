import type { CoaStatus, ProductForm, QualityTier } from "@prisma/client";

export function labelEnum(s: string) {
  return s.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

export function labelForm(v: ProductForm) {
  return labelEnum(v);
}

export function labelCoaStatus(v: CoaStatus) {
  if (v === "PUBLIC_EMBEDDED") return "Public (page-embedded)";
  if (v === "REQUEST_ONLY") return "On request";
  return labelEnum(v);
}

export function labelQualityTier(v: QualityTier) {
  return labelEnum(v);
}

