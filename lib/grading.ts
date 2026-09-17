import { gradeLabel } from "./grade-colors";
import type {
  Prisma,
  CoaDiscoverability,
  CoaIssuer,
  CoaStatus,
  HeavyMetalsResult,
  OverallGrade,
  ProductForm,
  QualityTier,
  TestScope,
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
  // ── COA review fields (drive the overall grade) ──
  /** True once a real lab document for this product has been reviewed. */
  coaVerified?: boolean;
  coaIssuer?: CoaIssuer | null;
  /** Date printed on the COA itself. */
  coaReportDate?: Date | string | null;
  labNamedOnCoa?: boolean;
  coaBatchIdentified?: boolean;
  heavyMetalsResult?: HeavyMetalsResult | null;
  heavyMetalsScope?: TestScope | null;
  microbialPanel?: boolean;
  /** How findable the COA is from the product page. Affects the transparency grade only. */
  coaDiscoverability?: CoaDiscoverability | null;
  /** Brand slug — used only to evaluate ULTRA_PREMIUM tier eligibility. */
  brandSlug?: string | null;
};

/**
 * Every column the grading functions read. Load products with this select and pass them
 * through toProductForGrading() — hand-building ProductForGrading from a partial select
 * silently drops the COA review fields and wipes a reviewed product's grade.
 */
export const GRADING_SELECT = {
  form: true,
  coaStatus: true,
  manufacturingCountryClaim: true,
  thirdPartyTestingLab: true,
  gmpCertified: true,
  hasPatentClaim: true,
  coaVerified: true,
  coaIssuer: true,
  coaReportDate: true,
  labNamedOnCoa: true,
  coaBatchIdentified: true,
  heavyMetalsResult: true,
  heavyMetalsScope: true,
  microbialPanel: true,
  coaDiscoverability: true,
  brand: { select: { slug: true } },
} as const satisfies Prisma.ProductSelect;

export type GradingRow = Prisma.ProductGetPayload<{ select: typeof GRADING_SELECT }>;

export function toProductForGrading({ brand, ...rest }: GradingRow): ProductForGrading {
  return { ...rest, brandSlug: brand.slug };
}

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
// Max score: 10 (COA public 4 + named lab 3 + USA 2 + GMP 1)
// Grades: A≥9, B≥6, C≥3, D≥1, F<1
//
// A published COA that a buyer cannot actually find is less transparent than one linked in
// plain sight, so a public COA loses points when it is buried or unlinked (see
// discoverabilityPenalty). The penalty only applies where there is a public COA to find.
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
  /** Deducted from a public COA's points when it is hard to find from the product page. */
  discoverabilityPenalty: {
    BURIED: 1,
    UNLINKED: 2,
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

  // Discoverability: only meaningful when there is a published COA to find.
  const coaIsPublished = product.coaStatus === "PUBLIC" || product.coaStatus === "PUBLIC_EMBEDDED";
  if (coaIsPublished) {
    if (product.coaDiscoverability === "BURIED") {
      score -= transparencyRubric.discoverabilityPenalty.BURIED;
      reasons.push("COA is published but buried — collapsed behind an accordion, or labelled so vaguely a buyer is unlikely to find it (-1)");
    } else if (product.coaDiscoverability === "UNLINKED") {
      score -= transparencyRubric.discoverabilityPenalty.UNLINKED;
      reasons.push("COA is published but nothing on the product page links to it (-2)");
    } else if (product.coaDiscoverability === "PROMINENT") {
      reasons.push("COA is linked in plain sight on the product page (+0)");
    }
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

  // A penalty must never drive the score below zero.
  score = Math.max(0, score);

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
 *   verified COA from an independent lab + that lab named on the COA +
 *   numeric heavy metals on the finished product + microbial panel + batch/lot on the COA
 *
 * The highest verifiable testing bar. Product form and patent claims are not
 * part of it: neither is evidence of what is actually in the product.
 */
function meetsUltraPremiumCriteria(product: ProductForGrading): boolean {
  return (
    !!product.coaVerified &&
    product.coaIssuer === "INDEPENDENT_LAB" &&
    !!product.labNamedOnCoa &&
    product.heavyMetalsResult === "NUMERIC" &&
    product.heavyMetalsScope !== "INGREDIENT" &&
    !!product.microbialPanel &&
    !!product.coaBatchIdentified
  );
}

/**
 * Criteria for PREMIUM: a verified COA from an independent lab that reports
 * actual heavy metal concentrations. Form is handled separately by FORM_TIER_CEILING; here what matters is that
 * someone independent measured the product and published the numbers.
 */
function meetsPremiumCriteria(product: ProductForGrading): boolean {
  return (
    !!product.coaVerified &&
    product.coaIssuer === "INDEPENDENT_LAB" &&
    product.heavyMetalsResult === "NUMERIC"
  );
}

// Form ceilings for the tier mirror the overall-grade ceilings: only resin can reach
// ULTRA_PREMIUM, and gummies, honey sticks and blends cannot rise above AVERAGE.
const TIER_ORDER: readonly QualityTier[] = ["ULTRA_PREMIUM", "PREMIUM", "AVERAGE", "POOR"];

export const FORM_TIER_CEILING: Record<ProductForm, QualityTier> = {
  RESIN: "ULTRA_PREMIUM",
  LIQUID: "PREMIUM",
  POWDER: "PREMIUM",
  CAPSULE: "PREMIUM",
  TABLETS: "PREMIUM",
  OTHER: "PREMIUM",
  GUMMY: "AVERAGE",
  HONEY_STICKS: "AVERAGE",
  BLEND: "AVERAGE",
};

export function computeQualityTier(
  product: ProductForGrading,
): QualityResult {
  const result = testingQualityTier(product);
  const ceiling = FORM_TIER_CEILING[product.form];
  if (TIER_ORDER.indexOf(result.tier) >= TIER_ORDER.indexOf(ceiling)) return result;
  const reason = FORM_CEILING_REASON[product.form];
  return {
    tier: ceiling,
    reasons: [
      `${ceiling}: testing meets ${result.tier} criteria, but product form caps the tier at ${ceiling}${reason ? ` — ${reason}` : ""}`,
      ...result.reasons.slice(1),
    ],
  };
}

/** The tier the product's testing alone qualifies for, before the form ceiling. */
function testingQualityTier(
  product: ProductForGrading,
): QualityResult {
  const reasons: string[] = [];

  if (meetsUltraPremiumCriteria(product)) {
    reasons.push("ULTRA_PREMIUM: verified independent COA naming the lab + numeric heavy metals on the finished product + microbial panel + batch/lot code");
    return { tier: "ULTRA_PREMIUM", reasons };
  }

  if (meetsPremiumCriteria(product)) {
    reasons.push("PREMIUM: verified independent COA with numeric heavy metal results");
    if (!product.labNamedOnCoa) reasons.push("Testing lab not named on the COA — required for ULTRA_PREMIUM");
    if (product.heavyMetalsScope === "INGREDIENT") reasons.push("Heavy metals tested on the incoming ingredient, not the finished product — finished-product testing required for ULTRA_PREMIUM");
    if (!product.microbialPanel) reasons.push("No microbial panel on the COA — required for ULTRA_PREMIUM");
    if (!product.coaBatchIdentified) reasons.push("No batch or lot code on the COA — required for ULTRA_PREMIUM");
    return { tier: "PREMIUM", reasons };
  }

  const hasCoa =
    product.coaStatus === "PUBLIC" ||
    product.coaStatus === "PUBLIC_EMBEDDED" ||
    product.coaStatus === "REQUEST_ONLY";
  const hasNamedLab = !!product.thirdPartyTestingLab?.trim();

  if (hasCoa || hasNamedLab) {
    reasons.push("AVERAGE: has some testing transparency (COA or named lab) but does not meet all PREMIUM criteria");
    if (!product.coaVerified) reasons.push("No COA document has been verified for this product");
    else if (product.coaIssuer !== "INDEPENDENT_LAB") reasons.push("COA was issued by the brand or its manufacturer, not an independent lab");
    else if (product.heavyMetalsResult !== "NUMERIC") reasons.push("COA does not report actual heavy metal concentrations");
    if (!hasCoa) reasons.push("No COA on file");
    if (!hasNamedLab) reasons.push("No named independent testing lab");
    return { tier: "AVERAGE", reasons };
  }

  reasons.push("POOR: no verifiable testing transparency (no COA and no named lab)");
  return { tier: "POOR", reasons };
}

// ---------------------------------------------------------------------------
// Overall Grade (A+ through F)
// Weighted score out of 14, built from what a product's COA actually documents.
//
// Scoring:
//   Verified COA from an independent lab:        +3
//   Manufacturer- or brand-issued COA:           +1
//   COA claimed but not verified:                +1
//   Numeric heavy metals, finished product:      +4  (halved for a manufacturer-issued COA)
//   Numeric heavy metals, ingredient only:       +2  (halved for a manufacturer-issued COA)
//   Heavy metals pass/fail only:                 +1
//   Independent lab named on the COA:            +2
//   Microbial panel on the COA:                  +1
//   Batch/lot code on the COA:                   +1
//   COA dated within the last 24 months:         +1
//   Country of manufacture stated:               +1
//   GMP certified:                               +1
//
// Not scored, but product form sets a grade ceiling (see FORM_GRADE_CEILING below).
// Deliberately NOT scored at all: patent claims and fulvic acid
// percentage (commercially available as an additive, and measured inconsistently
// between labs, so a high number proves neither identity nor quality).
//
// Grade thresholds (max 14): A+ ≥13, A ≥10, B ≥7, C ≥4, D ≥2, E ≥1, F 0
//
// Form ceilings: the score measures testing evidence, but the grade cannot exceed
// what the product's form can deliver. Resin is the whole, least-processed material
// used in clinical research; every step away from it (extraction, spray-drying,
// encapsulation, reheating into a sugar or honey base) adds processing and dilution.
//   Resin A+ · Liquid A · Powder, Capsule, Tablets, Other B · Gummy, Honey sticks, Blend C
// ---------------------------------------------------------------------------

const GRADE_ORDER: readonly OverallGrade[] = ["A_PLUS", "A", "B", "C", "D", "E", "F"];

export const FORM_GRADE_CEILING: Record<ProductForm, OverallGrade> = {
  RESIN: "A_PLUS",
  LIQUID: "A",
  POWDER: "B",
  CAPSULE: "B",
  TABLETS: "B",
  OTHER: "B",
  GUMMY: "C",
  HONEY_STICKS: "C",
  BLEND: "C",
};

const FORM_CEILING_REASON: Partial<Record<ProductForm, string>> = {
  LIQUID: "liquid extracts are processed out of the whole resin",
  POWDER: "powders are extract dried at high temperature, not whole resin",
  CAPSULE: "capsules hold extract powder dried at high temperature, at fixed low doses",
  TABLETS: "tablets are extract powder dried at high temperature and pressed with binders",
  OTHER: "the format is processed away from whole resin",
  GUMMY: "gummies use heat-processed, spray-dried extract diluted into a sugar and gelatin base, typically well below clinical doses",
  HONEY_STICKS: "honey sticks dilute processed extract into a honey base, typically well below clinical doses",
  BLEND: "blends dilute shilajit among other ingredients, typically well below clinical doses",
};

function gradeFromScore(score: number): OverallGrade {
  if (score >= 13) return "A_PLUS";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 4) return "C";
  if (score >= 2) return "D";
  if (score >= 1) return "E";
  return "F";
}

/** The better (higher) of two grades is the one earlier in GRADE_ORDER. */
function lowerGrade(a: OverallGrade, b: OverallGrade): OverallGrade {
  return GRADE_ORDER.indexOf(a) >= GRADE_ORDER.indexOf(b) ? a : b;
}

/** A COA counts as verified only when a real document for this product has been reviewed. */
export function hasCoaReview(product: ProductForGrading): boolean {
  return !!product.coaVerified || !!product.heavyMetalsResult;
}

const COA_RECENCY_MONTHS = 24;

export function isCoaRecent(
  coaReportDate: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!coaReportDate) return false;
  const d = coaReportDate instanceof Date ? coaReportDate : new Date(coaReportDate);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - COA_RECENCY_MONTHS);
  return d >= cutoff;
}

export const overallRubric = {
  score: {
    coaVerifiedIndependent: 3,
    coaManufacturerIssued: 1,
    coaClaimedUnverified: 1,
    heavyMetalsNumericFinished: 4,
    heavyMetalsNumericIngredient: 2,
    heavyMetalsPassFail: 1,
    labNamedOnCoa: 2,
    microbialPanel: 1,
    batchIdentified: 1,
    coaRecent: 1,
    manufacturingCountry: 1,
    gmpCertified: 1,
  },
  maxScore: 14,
} as const;

export type OverallBreakdown = {
  score: number;
  maxScore: number;
  reasons: string[];
};

/** Full overall-grade breakdown: score plus the reason for every point awarded. */
export function overallGradeBreakdown(
  product: ProductForGrading,
  now: Date = new Date(),
): OverallBreakdown {
  const r = overallRubric.score;
  const reasons: string[] = [];
  let score = 0;

  const verified = !!product.coaVerified;
  const manufacturerIssued =
    product.coaIssuer === "MANUFACTURER" || product.coaIssuer === "BRAND";
  const claimsCoa =
    product.coaStatus === "PUBLIC" ||
    product.coaStatus === "PUBLIC_EMBEDDED" ||
    product.coaStatus === "REQUEST_ONLY";

  if (verified && !manufacturerIssued) {
    score += r.coaVerifiedIndependent;
    reasons.push(`Verified COA from an independent laboratory (+${r.coaVerifiedIndependent})`);
  } else if (verified && manufacturerIssued) {
    score += r.coaManufacturerIssued;
    reasons.push(
      `COA issued by the ${product.coaIssuer === "BRAND" ? "brand" : "manufacturer"} rather than an independent lab (+${r.coaManufacturerIssued})`,
    );
  } else if (claimsCoa) {
    score += r.coaClaimedUnverified;
    reasons.push(`COA claimed but not verified against a lab document (+${r.coaClaimedUnverified})`);
  } else {
    reasons.push("No COA on file (+0)");
  }

  if (verified && product.heavyMetalsResult === "NUMERIC") {
    const ingredientOnly = product.heavyMetalsScope === "INGREDIENT";
    let points: number = ingredientOnly
      ? r.heavyMetalsNumericIngredient
      : r.heavyMetalsNumericFinished;
    if (manufacturerIssued) points = Math.floor(points / 2);
    score += points;
    reasons.push(
      `Numeric heavy metal results${ingredientOnly ? " on the incoming ingredient only" : " for the finished product"}${manufacturerIssued ? ", on a COA the manufacturer issued" : ""} (+${points})`,
    );
  } else if (product.heavyMetalsResult === "NUMERIC" || product.heavyMetalsResult === "PASS_FAIL") {
    score += r.heavyMetalsPassFail;
    reasons.push(`Heavy metals reported as pass/fail without concentrations (+${r.heavyMetalsPassFail})`);
  } else {
    reasons.push("No heavy metal results published (+0)");
  }

  if (verified && product.labNamedOnCoa && !manufacturerIssued) {
    score += r.labNamedOnCoa;
    reasons.push(
      `Testing laboratory named on the COA${product.thirdPartyTestingLab?.trim() ? `: ${product.thirdPartyTestingLab}` : ""} (+${r.labNamedOnCoa})`,
    );
  } else {
    reasons.push("No independent laboratory named on a verified COA (+0)");
  }

  if (verified && product.microbialPanel) {
    score += r.microbialPanel;
    reasons.push(`Microbial panel included on the COA (+${r.microbialPanel})`);
  }

  if (verified && product.coaBatchIdentified) {
    score += r.batchIdentified;
    reasons.push(`COA carries a batch or lot code (+${r.batchIdentified})`);
  } else if (verified) {
    reasons.push("COA has no batch or lot code, so it cannot be tied to the product sold (+0)");
  }

  if (verified && isCoaRecent(product.coaReportDate, now)) {
    score += r.coaRecent;
    reasons.push(`COA dated within the last ${COA_RECENCY_MONTHS} months (+${r.coaRecent})`);
  }

  if (hasManufacturingCountry(product.manufacturingCountryClaim)) {
    score += r.manufacturingCountry;
    reasons.push(`Country of manufacture stated: ${product.manufacturingCountryClaim} (+${r.manufacturingCountry})`);
  } else {
    reasons.push("Country of manufacture not disclosed (+0)");
  }

  if (product.gmpCertified) {
    score += r.gmpCertified;
    reasons.push(`GMP certified facility (+${r.gmpCertified})`);
  }

  const ceiling = FORM_GRADE_CEILING[product.form];
  const ceilingReason = FORM_CEILING_REASON[product.form];
  if (ceilingReason) {
    reasons.push(`Product form caps the grade at ${gradeLabel(ceiling)}: ${ceilingReason}`);
  }

  return { score, maxScore: overallRubric.maxScore, reasons };
}

/** Compute the weighted overall grade score (max 14). Exported for debugging. */
export function overallGradeScore(product: ProductForGrading): number {
  return overallGradeBreakdown(product).score;
}

/**
 * When the product's form holds its grade below what the score alone would earn,
 * a sentence explaining why; otherwise null.
 */
export function formCeilingNote(product: ProductForGrading): string | null {
  const ceiling = FORM_GRADE_CEILING[product.form];
  const fromScore = gradeFromScore(overallGradeScore(product));
  if (lowerGrade(fromScore, ceiling) === fromScore) return null;
  return `The score alone would earn ${gradeLabel(fromScore)}, but product form caps the grade at ${gradeLabel(ceiling)}: ${FORM_CEILING_REASON[product.form]}.`;
}

/** Compute the overall grade (A+ through F): the score's grade, capped by product form. */
export function computeOverallGrade(product: ProductForGrading): OverallGrade {
  return lowerGrade(gradeFromScore(overallGradeScore(product)), FORM_GRADE_CEILING[product.form]);
}

/** All three stored grades for a product, as written to the Product row. */
export function computeAllGrades(product: ProductForGrading): {
  overallGrade: OverallGrade;
  qualityTier: QualityTier;
  transparencyGrade: TransparencyGrade;
} {
  return {
    overallGrade: computeOverallGrade(product),
    qualityTier: computeQualityTier(product).tier,
    transparencyGrade: computeTransparencyGrade(product).grade,
  };
}
