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
  /\b(blend|gummies|gummy|nootropic|energy|focus|proprietary)\b/i;

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
  return true;
}

function baselineTierForTransparency(grade: TransparencyGrade): QualityTier {
  if (grade === "A") return "PREMIUM";
  if (grade === "B") return "AVERAGE";
  if (grade === "C") return "AVERAGE";
  return "POOR";
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

  const canBoostUltra =
    transparency.grade === "A" &&
    isResin &&
    product.coaStatus === "PUBLIC" &&
    product.manufacturingClarity === "CLEAR" &&
    onlyShilajitIngredients(product.ingredientsNormalized, product.ingredientText);

  if (canBoostUltra) {
    tier = "ULTRA_PREMIUM";
    reasons.push(
      "Boosted to ULTRA_PREMIUM (A-grade resin, public COA, clear manufacturing, simple shilajit ingredients)"
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

