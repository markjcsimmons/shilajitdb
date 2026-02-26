import type { ProductForm } from "@prisma/client";

export function normalizeBrandName(input: string) {
  return String(input ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProductTitle(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNetQuantityText(input: string | null | undefined) {
  const s = String(input ?? "").trim();
  if (!s) return null;
  // Keep as-is for now; we mainly need stable normalization for matching.
  return s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function inferFormFromTitle(title: string | null | undefined): ProductForm | null {
  const t = String(title ?? "").toLowerCase();
  if (!t) return null;
  if (/\bresin\b/.test(t)) return "RESIN";
  if (/\bcapsule(s)?\b/.test(t)) return "CAPSULE";
  if (/\bpowder\b/.test(t)) return "POWDER";
  if (/\bgumm(y|ies)\b/.test(t)) return "GUMMY";
  if (/\bdrops?\b|\bliquid\b|\btincture\b/.test(t)) return "LIQUID";
  if (/\bblend\b/.test(t)) return "BLEND";
  return null;
}

export function normalizeGtin(input: string | null | undefined) {
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 14) return null;
  return digits;
}

