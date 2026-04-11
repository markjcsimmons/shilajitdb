import type {
  CoaStatus,
  OverallGrade,
  ProductForm,
  QualityTier,
  TransparencyGrade,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Country of manufacture: USA → 2 points, any other stated country → 1 point, none → 0 */
export function manufacturingPointsFromCountry(country: string | null | undefined): 0 | 1 | 2 {
  const c = (country ?? "").trim();
  if (!c) return 0;
  const u = c.toUpperCase();
  if (u === "USA" || u === "US" || u === "UNITED STATES") return 2;
  return 1;
}

export function hasManufacturingCountry(country: string | null | undefined): boolean {
  return (country ?? "").trim().length > 0;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductForGrading = {
  form: ProductForm;
  coaStatus: CoaStatus;
  manufacturingCountryClaim?: string | null;
  /** Name of the 3rd-party testing lab, if any (e.g. "Cambium Analytica"). */
  thirdPartyTestingLab?: string | null;
  /** Whether the manufacturer claims GMP certification. */
  gmpCertified?: boolean;
  /** Whether the brand holds a patent on their manufacturing process. Display only — not scored. */
  hasPatentClaim?: boolean;
  /** Brand slug — used only to evaluate ULTRA_PREMIUM tier eligibility. */
  brandSlug?: string | null;
};

export type TransparencyResult = {
  grade: TransparencyGrade;
  score: number;
  reasons: string[];
};

export type QualityResult = {
  tier: QualityTier;
  reasons: string[];
};

// ---------------------------------------------------------------------------
// Transparency Grade
// Signals: how openly documented is this product's safety and origin?
// Max score: 11 (COA public 4 + named lab 3 + USA 2 + request-only 1 + other country 1 + GMP 1)
// Grades: A≥9, B≥6, C≥3, D≥1, F<1
// ---------------------------------------------------------------------------

export const transparencyRubric = {
  score: {
    coaPublic: 4,
    coaPublicEmbedded: 2,
    coaRequestOnly: 1,
    namedThirdPartyLab: 3,
    manufacturingCountryUSA: 2,
    manufacturingCountryOther: 1,
    gmpCertified: 1,
  },
  gradeByScore(score: number): TransparencyGrade {
    if (score >= 9) return "A";
    if (score >= 6) return "B";
    if (score >= 3) return "C";
    if (score >= 1) return "D";
    return "F";
  },
} as const;

export function computeTransparencyGrade(
  product: ProductForGrading,
): TransparencyResult {
  const reasons: string[] = [];
  let score = 0;

  // COA status
  if (product.coaStatus === "PUBLIC") {
    score += transparencyRubric.score.coaPublic;
    reasons.push("COA is publicly available as a standalone document (+4)");
  } else if (product.coaStatus === "PUBLIC_EMBEDDED") {
    score += transparencyRubric.score.coaPublicEmbedded;
    reasons.push("COA visible on product page (embedded image) — not an independently auditable document (+2)");
  } else if (product.coaStatus === "REQUEST_ONLY") {
    score += transparencyRubric.score.coaRequestOnly;
    reasons.push("COA available on request only — not openly published (+1)");
  } else if (product.coaStatus === "NONE") {
    reasons.push("No COA disclosed (+0)");
  } else {
    reasons.push("COA status unknown (+0)");
  }

  // Named 3rd-party lab
  const hasNamedLab = !!product.thirdPartyTestingLab?.trim();
  if (hasNamedLab) {
    score += transparencyRubric.score.namedThirdPartyLab;
    reasons.push(`Independent testing lab named: ${product.thirdPartyTestingLab} (+3)`);
  } else {
    reasons.push("No named independent testing lab (+0)");
  }

  // Manufacturing country
  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  if (mfgPoints === 2) {
    score += transparencyRubric.score.manufacturingCountryUSA;
    reasons.push("Manufactured in USA — FDA 21 CFR Part 111 oversight (+2)");
  } else if (mfgPoints === 1) {
    score += transparencyRubric.score.manufacturingCountryOther;
    reasons.push(`Country of manufacture stated: ${product.manufacturingCountryClaim} (+1)`);
  } else {
    reasons.push("Country of manufacture not disclosed (+0)");
  }

  // GMP certified
  if (product.gmpCertified) {
    score += transparencyRubric.score.gmpCertified;
    reasons.push("GMP certified facility (+1)");
  } else {
    reasons.push("GMP certification not confirmed (+0)");
  }

  const grade = transparencyRubric.gradeByScore(score);
  return { grade, score, reasons };
}

// ---------------------------------------------------------------------------
// Quality Tier
// Fully criteria-based — no brand-name hard-coding.
// ULTRA_PREMIUM requires all 5 major quality signals simultaneously.
// ---------------------------------------------------------------------------

/**
 * Criteria for ULTRA_PREMIUM: ALL of
 *   form=RESIN + coaStatus=PUBLIC + named 3rd-party lab + mfg country stated + GMP certified
 *
 * This is the highest verifiable bar. Any brand meeting all 5 criteria qualifies.
 * Pürblack is currently the only brand in the database meeting all 5.
 */
function meetsUltraPremiumCriteria(product: ProductForGrading): boolean {
  return (
    product.form === "RESIN" &&
    product.coaStatus === "PUBLIC" &&
    !!product.thirdPartyTestingLab?.trim() &&
    hasManufacturingCountry(product.manufacturingCountryClaim) &&
    !!product.gmpCertified
  );
}

/**
 * Criteria for PREMIUM: ALL of
 *   coaStatus=PUBLIC + named 3rd-party lab
 *
 * Form and manufacturing country are NOT required — a well-documented product
 * of any form earns PREMIUM if it has a public COA from a named independent lab.
 * The distinction from ULTRA_PREMIUM is resin form + stated country + GMP.
 */
function meetsPremiumCriteria(product: ProductForGrading): boolean {
  return (
    product.coaStatus === "PUBLIC" &&
    !!product.thirdPartyTestingLab?.trim()
  );
}

export function computeQualityTier(
  product: ProductForGrading,
): QualityResult {
  const reasons: string[] = [];

  if (meetsUltraPremiumCriteria(product)) {
    reasons.push("ULTRA_PREMIUM: resin form + public COA + named 3rd-party lab + stated manufacturing country + GMP certified");
    return { tier: "ULTRA_PREMIUM", reasons };
  }

  if (meetsPremiumCriteria(product)) {
    reasons.push("PREMIUM: public COA + named 3rd-party lab (any form qualifies)");
    if (product.form !== "RESIN") reasons.push("Not resin form — resin required for ULTRA_PREMIUM");
    if (!hasManufacturingCountry(product.manufacturingCountryClaim)) reasons.push("Manufacturing country not stated — required for ULTRA_PREMIUM");
    if (!product.gmpCertified) reasons.push("GMP certification not confirmed — required for ULTRA_PREMIUM");
    return { tier: "PREMIUM", reasons };
  }

  const hasCoa =
    product.coaStatus === "PUBLIC" ||
    product.coaStatus === "PUBLIC_EMBEDDED" ||
    product.coaStatus === "REQUEST_ONLY";
  const hasNamedLab = !!product.thirdPartyTestingLab?.trim();

  if (hasCoa || hasNamedLab) {
    reasons.push("AVERAGE: has some testing transparency (COA or named lab) but does not meet all PREMIUM criteria");
    if (product.form !== "RESIN") reasons.push("Not resin form — resin required for PREMIUM or higher");
    if (product.coaStatus === "PUBLIC_EMBEDDED") reasons.push("COA is page-embedded only — a standalone document is required for PREMIUM");
    if (!hasCoa) reasons.push("No COA on file");
    if (!hasNamedLab) reasons.push("No named independent testing lab");
    if (!hasManufacturingCountry(product.manufacturingCountryClaim)) reasons.push("Manufacturing country not stated");
    return { tier: "AVERAGE", reasons };
  }

  reasons.push("POOR: no verifiable testing transparency (no COA and no named lab)");
  return { tier: "POOR", reasons };
}

// ---------------------------------------------------------------------------
// Overall Grade (A+ through F)
// Weighted score out of 14 based on scientific quality signals.
//
// Scoring:
//   COA PUBLIC:           +4  (FDA/FTC transparency standard; only 33% of products)
//   Named 3rd-party lab:  +3  (names the tester — checkable & accountable; only 31%)
//   Form = RESIN:         +2  (least processed; preserves fulvic-humic matrix — Piccolo 2002)
//   Manufacturing USA:    +2  (FDA 21 CFR Part 111 oversight)
//   COA REQUEST_ONLY:     +1  (tested but not openly disclosed)
//   Mfg country other:   +1  (at least traceable)
//   GMP certified:        +1  (documented standard; 80% of products claim it — weak signal)
//
// Patent claim: displayed on product page but NOT scored.
//   (Patents protect IP, not product quality. No independent authority uses patents as quality signals.)
//
// Grade thresholds (max 14):
//   A+: ≥12  (requires all top signals: public COA + named lab + resin + USA + GMP = 12)
//   A:  ≥9
//   B:  ≥6
//   C:  ≥3
//   D:  ≥2
//   E:  ≥1
//   F:  0
// ---------------------------------------------------------------------------

export const overallRubric = {
  score: {
    coaPublic: 4,
    coaPublicEmbedded: 2,
    coaRequestOnly: 1,
    namedThirdPartyLab: 3,
    formResin: 2,
    manufacturingUSA: 2,
    manufacturingOther: 1,
    gmpCertified: 1,
  },
} as const;

/** Compute the weighted overall grade score (max 14). Exported for debugging. */
export function overallGradeScore(product: ProductForGrading): number {
  let score = 0;

  if (product.coaStatus === "PUBLIC") score += overallRubric.score.coaPublic;
  else if (product.coaStatus === "PUBLIC_EMBEDDED") score += overallRubric.score.coaPublicEmbedded;
  else if (product.coaStatus === "REQUEST_ONLY") score += overallRubric.score.coaRequestOnly;

  if (product.thirdPartyTestingLab?.trim()) score += overallRubric.score.namedThirdPartyLab;

  if (product.form === "RESIN") score += overallRubric.score.formResin;

  const mfgPoints = manufacturingPointsFromCountry(product.manufacturingCountryClaim);
  if (mfgPoints === 2) score += overallRubric.score.manufacturingUSA;
  else if (mfgPoints === 1) score += overallRubric.score.manufacturingOther;

  if (product.gmpCertified) score += overallRubric.score.gmpCertified;

  return score;
}

/** Compute the overall grade (A+ through F). */
export function computeOverallGrade(product: ProductForGrading): OverallGrade {
  const score = overallGradeScore(product);
  if (score >= 12) return "A_PLUS";
  if (score >= 9) return "A";
  if (score >= 6) return "B";
  if (score >= 3) return "C";
  if (score >= 2) return "D";
  if (score >= 1) return "E";
  return "F";
}
