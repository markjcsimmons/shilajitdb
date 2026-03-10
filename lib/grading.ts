import type {
  CoaStatus,
  ManufacturingClarity,
  ProductForm,
  QualityTier,
  TransparencyGrade,
} from "@prisma/client";

export type ProductForGrading = {
  form: ProductForm;
  ingredientText: string;
  ingredientsNormalized: string[];
  manufacturingClarity: ManufacturingClarity;
  coaStatus: CoaStatus;
  /** Brand slug for tier rules (e.g. Purblack → ULTRA_PREMIUM when criteria met) */
  brandSlug?: string | null;
  /** Has official supplement labels (DSLD or ≥2 evidence) */
  hasOfficialLabels?: boolean;
};

export type EvidenceForGrading = { count: number };

export type TransparencyResult = {
  grade: TransparencyGrade;
  score: number;
  reasons: string[];
};

export type QualityResult = {
  tier: QualityTier;
  reasons: string[];
};

export const transparencyRubric = {
  ingredientTextLengthThreshold: 80,
  score: {
    coaPublic: 3,
    coaRequestOnly: 1,
    manufacturingClear: 2,
    manufacturingAmbiguous: 1,
    ingredientsNormalizedNonEmpty: 1,
    ingredientTextLongEnough: 1,
    evidenceAtLeast2: 1,
  },
  gradeByScore(score: number): TransparencyGrade {
    if (score >= 7) return "A";
    if (score >= 5) return "B";
    if (score >= 3) return "C";
    if (score >= 1) return "D";
    return "F";
  },
} as const;

export function computeTransparencyGrade(
  product: ProductForGrading,
  evidence: EvidenceForGrading
): TransparencyResult {
  const reasons: string[] = [];
  let score = 0;

  if (product.coaStatus === "PUBLIC") {
    score += transparencyRubric.score.coaPublic;
    reasons.push("COA is publicly available (+3)");
  } else if (product.coaStatus === "REQUEST_ONLY") {
    score += transparencyRubric.score.coaRequestOnly;
    reasons.push("COA is available on request (+1)");
  } else if (product.coaStatus === "NONE") {
    reasons.push("No COA disclosed (+0)");
  } else {
    reasons.push("COA status is unknown (+0)");
  }

  if (product.manufacturingClarity === "CLEAR") {
    score += transparencyRubric.score.manufacturingClear;
    reasons.push("Manufacturing claim is clear (+2)");
  } else if (product.manufacturingClarity === "AMBIGUOUS") {
    score += transparencyRubric.score.manufacturingAmbiguous;
    reasons.push("Manufacturing claim is ambiguous (+1)");
  } else {
    reasons.push("Manufacturing claim not stated (+0)");
  }

  const normalized = (product.ingredientsNormalized ?? []).map((s) => s.trim()).filter(Boolean);
  if (normalized.length > 0) {
    score += transparencyRubric.score.ingredientsNormalizedNonEmpty;
    reasons.push("Ingredients normalized list present (+1)");
  } else {
    reasons.push("No normalized ingredients list (+0)");
  }

  const ingredientTextLength = (product.ingredientText ?? "").trim().length;
  if (ingredientTextLength >= transparencyRubric.ingredientTextLengthThreshold) {
    score += transparencyRubric.score.ingredientTextLongEnough;
    reasons.push("Ingredient disclosure text is detailed (+1)");
  } else if (ingredientTextLength > 0) {
    reasons.push("Ingredient disclosure text is minimal (+0)");
  } else {
    reasons.push("No ingredient disclosure text (+0)");
  }

  if (evidence.count >= 2) {
    score += transparencyRubric.score.evidenceAtLeast2;
    reasons.push("At least 2 evidence items provided (+1)");
  } else if (evidence.count === 1) {
    reasons.push("Only 1 evidence item provided (+0)");
  } else {
    reasons.push("No evidence items provided (+0)");
  }

  const grade = transparencyRubric.gradeByScore(score);
  return { grade, score, reasons };
}

const proprietaryBlendRegex = /\bproprietary\s+blend\b/i;
const blendIndicatorRegex =
  /\b(blend|gummies|gummy|nootropic|energy|focus)\b/i;
/** "proprietary blend" etc. as a positive claim (product contains it), not negative (e.g. "no proprietary blends") */
const proprietaryPositiveRegex =
  /(?<!(?:no|without|free of|zero)\s)proprietary\s+(?:blend|formula|mix)s?\b/i;

function onlyShilajitIngredients(ingredientsNormalized: string[], ingredientText: string) {
  const normalized = (ingredientsNormalized ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return false;
  const allowed = new Set([
    "shilajit",
    "purified shilajit",
    "himalayan shilajit",
    "shilajit resin",
  ]);
  const allAllowed = normalized.every((x) => allowed.has(x));
  if (!allAllowed) return false;
  if (blendIndicatorRegex.test(ingredientText ?? "")) return false;
  if (proprietaryPositiveRegex.test(ingredientText ?? "")) return false;
  return true;
}

const PURBLACK_SLUGS = ["p-rblack", "purblack"];

function isPurblack(brandSlug?: string | null): boolean {
  if (!brandSlug) return false;
  const slug = brandSlug.toLowerCase().replace(/ü/g, "u");
  return PURBLACK_SLUGS.some((s) => slug === s || slug.includes(s));
}

function baselineTierForTransparency(grade: TransparencyGrade): QualityTier {
  if (grade === "A") return "PREMIUM";
  if (grade === "B") return "AVERAGE";
  if (grade === "C") return "AVERAGE";
  return "POOR";
}

/** Criteria for PREMIUM (other brands): resin, shilajit only, clear mfg, COA, official labels */
function meetsPremiumCriteria(
  product: ProductForGrading,
  transparency: TransparencyResult
): boolean {
  const isResin = product.form === "RESIN";
  const hasCoa = product.coaStatus === "PUBLIC" || product.coaStatus === "REQUEST_ONLY";
  const hasClearMfg = product.manufacturingClarity === "CLEAR";
  const simpleShilajit = onlyShilajitIngredients(
    product.ingredientsNormalized,
    product.ingredientText
  );
  const hasOfficialLabels =
    product.hasOfficialLabels ??
    transparency.reasons.some((r) => r.includes("At least 2 evidence"));

  return isResin && hasCoa && hasClearMfg && simpleShilajit && hasOfficialLabels;
}

/** Criteria for ULTRA_PREMIUM (Purblack): COA + clear mfg + shilajit only + official labels (no resin requirement) */
function meetsPurblackUltraCriteria(
  product: ProductForGrading,
  transparency: TransparencyResult
): boolean {
  const hasCoa = product.coaStatus === "PUBLIC" || product.coaStatus === "REQUEST_ONLY";
  const hasClearMfg = product.manufacturingClarity === "CLEAR";
  const simpleShilajit = onlyShilajitIngredients(
    product.ingredientsNormalized,
    product.ingredientText
  );
  const hasOfficialLabels =
    product.hasOfficialLabels ??
    transparency.reasons.some((r) => r.includes("At least 2 evidence"));

  return hasCoa && hasClearMfg && simpleShilajit && hasOfficialLabels;
}

export function computeQualityTier(
  product: ProductForGrading,
  transparency: TransparencyResult
): QualityResult {
  const reasons: string[] = [];
  let tier: QualityTier = baselineTierForTransparency(transparency.grade);
  reasons.push(`Baseline from Transparency Grade ${transparency.grade} → ${tier}`);

  const isResin = product.form === "RESIN";
  const isGummyOrBlend = product.form === "GUMMY" || product.form === "BLEND";

  const meetsPurblackUltra = isPurblack(product.brandSlug) && meetsPurblackUltraCriteria(product, transparency);
  const meetsOtherBrandPremium = meetsPremiumCriteria(product, transparency);

  if (meetsPurblackUltra) {
    tier = "ULTRA_PREMIUM";
    reasons.push(
      "ULTRA_PREMIUM (Purblack with COA, clear manufacturing, simple shilajit, official labels)"
    );
  } else if (meetsOtherBrandPremium) {
    tier = "PREMIUM";
    reasons.push(
      "PREMIUM (resin, COA, clear manufacturing, simple shilajit, official labels)"
    );
  }

  const hasProprietaryBlendIndicator = proprietaryBlendRegex.test(product.ingredientText ?? "");
  const weakEvidenceCombo =
    (product.coaStatus === "NONE" || product.coaStatus === "UNKNOWN") &&
    product.manufacturingClarity === "NOT_STATED";

  if (isGummyOrBlend && hasProprietaryBlendIndicator) {
    tier = "POOR";
    reasons.push('Downgraded to POOR (gummy/blend with "proprietary blend" indicator)');
  } else if (weakEvidenceCombo) {
    tier = "POOR";
    reasons.push("Downgraded to POOR (no/unknown COA and manufacturing not stated)");
  }

  return { tier, reasons };
}

