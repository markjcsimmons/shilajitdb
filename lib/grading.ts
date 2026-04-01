import type {
  CoaStatus,
  OverallGrade,
  ProductForm,
  QualityTier,
  TransparencyGrade,
} from "@prisma/client";

/** Country of manufacture: USA → 3 points, any other country → 1 point, none → 0 */
export function manufacturingPointsFromCountry(country: string | null | undefined): 0 | 1 | 3 {
  const c = (country ?? "").trim();
  if (!c) return 0;
  const u = c.toUpperCase();
  if (u === "USA" || u === "US" || u === "UNITED STATES") return 3;
  return 1;
}

export function hasManufacturingCountry(country: string | null | undefined): boolean {
  return (country ?? "").trim().length > 0;
}

export type ProductForGrading = {
  form: ProductForm;
  ingredientText: string;
  ingredientsNormalized: string[];
  /** Country of manufacture (e.g. USA, India). Used for grading: USA → 3 pts, other → 1 pt. */
  manufacturingCountryClaim?: string | null;
  coaStatus: CoaStatus;
  /** Has official supplement labels (DSLD or ≥2 evidence) */
  hasOfficialLabels?: boolean;
  /** Number of evidence items — used for ULTRA_PREMIUM threshold (≥3 required) */
  evidenceCount?: number;
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
    manufacturingCountryUSA: 3,
    manufacturingCountryOther: 1,
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

  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  if (mfgPoints === 3) {
    score += transparencyRubric.score.manufacturingCountryUSA;
    reasons.push("Country of manufacture is USA (+3)");
  } else if (mfgPoints === 1) {
    score += transparencyRubric.score.manufacturingCountryOther;
    reasons.push("Country of manufacture stated (+1)");
  } else {
    reasons.push("Country of manufacture not stated (+0)");
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

/** Inactive/filler ingredients we ignore when checking "shilajit-only" */
const ALLOWED_INACTIVES = new Set([
  "capsule",
  "vegetarian capsule",
  "cellulose",
  "magnesium stearate",
  "rice flour",
  "silica",
  "gelatin",
  "gum acacia",
  "starch",
  "microcrystalline cellulose",
  "hypromellose",
  "pullulan",
  "water",
  "oleoresin",
  "resin",
]);

function onlyShilajitIngredients(ingredientsNormalized: string[], ingredientText: string) {
  const normalized = (ingredientsNormalized ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return false;
  const shilajitTerms = new Set([
    "shilajit",
    "purified shilajit",
    "himalayan shilajit",
    "shilajit resin",
  ]);
  const hasShilajit = normalized.some((x) => shilajitTerms.has(x) || x.includes("shilajit"));
  const onlyShilajitAndInactives = normalized.every(
    (x) => shilajitTerms.has(x) || x.includes("shilajit") || ALLOWED_INACTIVES.has(x)
  );
  if (!hasShilajit || !onlyShilajitAndInactives) return false;
  if (blendIndicatorRegex.test(ingredientText ?? "")) return false;
  if (proprietaryPositiveRegex.test(ingredientText ?? "")) return false;
  return true;
}

function baselineTierForTransparency(grade: TransparencyGrade): QualityTier {
  if (grade === "A") return "PREMIUM";
  if (grade === "B") return "PREMIUM";
  if (grade === "C") return "AVERAGE";
  return "POOR";
}

/** Criteria for PREMIUM (other brands): resin, shilajit only, country of manufacture, COA, official labels */
function meetsPremiumCriteria(
  product: ProductForGrading,
  transparency: TransparencyResult
): boolean {
  const isResin = product.form === "RESIN";
  const hasCoa = product.coaStatus === "PUBLIC" || product.coaStatus === "REQUEST_ONLY";
  const hasMfgCountry = hasManufacturingCountry(product.manufacturingCountryClaim);
  const simpleShilajit = onlyShilajitIngredients(
    product.ingredientsNormalized,
    product.ingredientText
  );
  const hasOfficialLabels =
    product.hasOfficialLabels ??
    transparency.reasons.some((r) => r.includes("At least 2 evidence"));

  return isResin && hasCoa && hasMfgCountry && simpleShilajit && hasOfficialLabels;
}

/**
 * Criteria for ULTRA_PREMIUM: resin + public COA (not just request-only) + country of
 * manufacture + shilajit-only ingredients + ≥3 evidence items.
 * Brand-agnostic: any product meeting all criteria qualifies.
 */
function meetsUltraPremiumCriteria(product: ProductForGrading): boolean {
  const isResin = product.form === "RESIN";
  const hasPublicCoa = product.coaStatus === "PUBLIC";
  const hasMfgCountry = hasManufacturingCountry(product.manufacturingCountryClaim);
  const simpleShilajit = onlyShilajitIngredients(
    product.ingredientsNormalized,
    product.ingredientText
  );
  const hasStrongEvidence = (product.evidenceCount ?? 0) >= 3;

  return isResin && hasPublicCoa && hasMfgCountry && simpleShilajit && hasStrongEvidence;
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

  const meetsUltraPremium = meetsUltraPremiumCriteria(product);
  const meetsPremium = meetsPremiumCriteria(product, transparency);

  if (meetsUltraPremium) {
    tier = "ULTRA_PREMIUM";
    reasons.push(
      "ULTRA_PREMIUM (resin, public COA, country of manufacture, simple shilajit, ≥3 evidence items)"
    );
  } else if (meetsPremium) {
    tier = "PREMIUM";
    reasons.push(
      "PREMIUM (resin, COA, country of manufacture, simple shilajit, official labels)"
    );
  }

  const hasProprietaryBlendIndicator = proprietaryBlendRegex.test(product.ingredientText ?? "");
  const weakEvidenceCombo =
    (product.coaStatus === "NONE" || product.coaStatus === "UNKNOWN") &&
    !hasManufacturingCountry(product.manufacturingCountryClaim);

  if (isGummyOrBlend && hasProprietaryBlendIndicator) {
    tier = "POOR";
    reasons.push('Downgraded to POOR (gummy/blend with "proprietary blend" indicator)');
  } else if (weakEvidenceCombo) {
    tier = "POOR";
    reasons.push("Downgraded to POOR (no/unknown COA and country of manufacture not stated)");
  }

  return { tier, reasons };
}

// --- Overall grade (A+ through F) per methodology ---

/**
 * Weighted score (max 10) for overall grade. COA=3, mfg clear=2, form resin=2, purity=2, ingredients list=1.
 * Exported for debugging / grade explanation.
 */
export function overallGradeScore(product: ProductForGrading): number {
  let score = 0;
  if (product.coaStatus === "PUBLIC") score += 3;
  else if (product.coaStatus === "REQUEST_ONLY") score += 2;
  score += manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  // Only resin gets form points; other forms (capsule, powder, gummy, etc.) get 0
  if (product.form === "RESIN") score += 2;
  const highPurity = onlyShilajitIngredients(
    product.ingredientsNormalized ?? [],
    product.ingredientText ?? ""
  );
  if (highPurity) score += 2;
  const hasNorm = (product.ingredientsNormalized ?? []).filter(Boolean).length > 0;
  if (hasNorm) score += 1;
  // Some ingredient disclosure (even without normalized list) avoids zero score
  if ((product.ingredientText ?? "").trim().length > 0) score += 1;
  return Math.min(10, score);
}

/**
 * Overall grade A+–F. Weighted: 7+ A/A+, 5–6 B, 4 C, 2–3 D, 1 E, 0 F. Purblack: A default; A+ if COA.
 */
export function computeOverallGrade(product: ProductForGrading): OverallGrade {
  const hasCoa = product.coaStatus === "PUBLIC" || product.coaStatus === "REQUEST_ONLY";
  const hasMfgCountry = hasManufacturingCountry(product.manufacturingCountryClaim);
  const isResin = product.form === "RESIN";
  const highPurity = onlyShilajitIngredients(
    product.ingredientsNormalized ?? [],
    product.ingredientText ?? ""
  );
  const hasProprietaryBlend = proprietaryBlendRegex.test(product.ingredientText ?? "");

  if (hasProprietaryBlend && !hasCoa && !hasMfgCountry) return "F";

  const score = overallGradeScore(product);
  // Bands: 7+ A/A+, 5–6 B, 4 C, 2–3 D, 1 E, 0 F (tuned so COA + one other signal can reach B)
  if (score >= 7) return isResin && highPurity ? "A_PLUS" : "A";
  if (score >= 5) return "B";
  if (score >= 4) return "C";
  if (score >= 2) return "D";
  if (score >= 1) return "E";
  return "F";
}

