# Grading Methodology

ShilajitDB uses two independent evaluation systems:

1. **Quality Tier** (ULTRA_PREMIUM, PREMIUM, AVERAGE, POOR) — criteria-based, all-or-nothing signals
2. **Overall Grade** (A+ through F) — weighted numeric scoring system

---

## Quality Tier (Criteria-Based)

### ULTRA_PREMIUM
**All 5 of the following:**
- Form = RESIN
- COA Status = PUBLIC (standalone, downloadable document)
- Named 3rd-party lab (e.g., Cambium Analytica, NSF, Eurofins)
- Manufacturing country stated
- GMP certified

Example: Pürblack products

### PREMIUM
**Both of the following:**
- COA Status = PUBLIC
- Named 3rd-party lab

Form and manufacturing country are NOT required. A well-tested product of any form (gummy, capsule, powder, resin) with public COA from a named lab qualifies.

Example: Pure Indian Foods Shilajit (Resin, USA, public COA, named lab, GMP) — missing only patent claim for ULTRA_PREMIUM

### AVERAGE
**Has some testing transparency but gaps remain:**
- COA exists (PUBLIC, PUBLIC_EMBEDDED, or REQUEST_ONLY) OR a named 3rd-party lab is disclosed
- But does NOT meet PREMIUM or ULTRA_PREMIUM criteria

Examples: Products with embedded COA only, or testing from a named lab but COA not independently available

### POOR
**No verifiable testing transparency:**
- No COA on record AND no named 3rd-party lab disclosed

---

## Overall Grade (A+ through F) — Weighted Scoring System

### Scoring Rubric (max 14 points)

| Factor | Data Field | Points | Notes |
|--------|-----------|--------|-------|
| **Form** | `Product.form` | RESIN = +4; others = 0 | Resin is least processed |
| **Manufacturing Country** | `manufacturingCountryClaim` | USA = +3; other = +1; none = 0 | USA has FDA 21 CFR Part 111 oversight |
| **Patent/IP Claim** | `hasPatentClaim` | +2 | Proprietary process signals differentiation |
| **COA Status** | `coaStatus` | PUBLIC = +2; PUBLIC_EMBEDDED = +1; REQUEST_ONLY = +1; else = 0 | PUBLIC is independently auditable |
| **Named 3rd-party Lab** | `thirdPartyTestingLab` | +2 if present; 0 if null/empty | Lab must be named (checkable & accountable) |
| **GMP Certified** | `gmpCertified` | +1 | Documented facility standard |

**Example calculations:**

| Product | Resin | USA | Patent | COA | Lab | GMP | Score | Grade |
|---------|-------|-----|--------|-----|-----|-----|-------|-------|
| Pürblack Shilajit | 4 | 3 | 2 | 2 | 2 | 1 | 14 | A+ |
| Pure Indian Foods | 4 | 3 | 0 | 2 | 2 | 1 | 12 | A |
| Life Cykel Gummies | 0 | 3 | 2 | 2 | 2 | 1 | 10 | A |
| Nurojit Gummies | 0 | 3 | 0 | 2 | 2 | 1 | 8 | B |

---

### Grade Bands (Score → Letter Grade)

| Score | Grade | Interpretation |
|-------|-------|-----------------|
| **≥13** | **A+** | Exceptional: all major signals present (typically resin + USA + patent + COA + lab + GMP, or similar high-signal combination) |
| **10–12** | **A** | Excellent: strong manufacturing quality and/or testing transparency (e.g., resin + USA + COA + lab, or non-resin with all documentation signals) |
| **7–9** | **B** | Good: some quality signals but gaps remain (e.g., resin + USA but minimal testing, or good testing but non-resin form) |
| **4–6** | **C** | Acceptable: basic transparency or quality signals present |
| **2–3** | **D** | Limited: minimal disclosure or verification |
| **1** | **E** | Poor: almost no supporting data |
| **0** | **F** | Failing: no verifiable quality or transparency signals |

---

## Signals Explained

### Form (Resin preferred)
- **Resin** is minimally processed and preserves the fulvic-humic matrix (Piccolo 2002). Scores highest.
- Capsule, powder, gummy, liquid, blend, and other forms are processed and score zero on form alone.

### Manufacturing Country
- **USA manufacturing** signals FDA 21 CFR Part 111 oversight and proven location. Scores +3.
- Any stated country (India, Nepal, etc.) scores +1 for traceability.
- No stated country scores 0.

### Patents
- Claimed patent or proprietary process signals innovation and differentiation. Scores +2.
- Only included if `hasPatentClaim` is true in the database.

### COA (Certificate of Analysis)
- **PUBLIC:** Standalone, downloadable document (e.g., PDF link on product page or Shopify CDN). **+2 points.** ← Only this is independently auditable by consumers.
- **PUBLIC_EMBEDDED:** COA shown as an image on the product page but not independently downloadable. **+1 point.** Visible but not audit-able.
- **REQUEST_ONLY:** Brand claims COA exists but must be requested. **+1 point.** Tested, but not openly disclosed.
- **NONE / UNKNOWN:** No COA found. **0 points.**

### Named 3rd-party Lab
- Lab must be **named and identifiable** (e.g., "Cambium Analytica", "NSF International", "Eurofins", "Matrix Sciences").
- Generic claims like "third-party tested" without a lab name do not count.
- Scores **+2** if present and named; 0 otherwise.

### GMP (Good Manufacturing Practice)
- Facility claims GMP certification. Scores **+1**.
- 80% of products claim GMP, so it's a weak signal alone.

---

## COA Quality Expectations

A **comprehensive COA** tests for:
- Heavy metals (As, Cd, Hg, Pb, Cr, etc.)
- Microbial contaminants (E. coli, Salmonella, coliforms)
- Mold/mycotoxins (aflatoxins, etc.)
- Active compounds (fulvic acids, dibenzo-α-pyrones) for potency
- Pesticide residues

A **minimal COA** (flagged on product pages) tests only:
- Heavy metals
- Or only one major category

Products with minimal COAs that are otherwise eligible for high grades (A or A+) will have a **COA Quality Issue warning** added to their product page to inform consumers.

---

## Implementation

**Score calculation:** `lib/grading.ts` → `overallGradeScore()` function.  
**Grade mapping:** `lib/grading.ts` → `computeOverallGrade()` function.  
**Recomputation:** Run `node recompute-grades.mjs` after database updates.

---

## History

- **v1 (old):** 10-point max, no patents, different scoring.
- **v2 (current):** 14-point max, patents +2, resin +4, USA +3, fair weighting of manufacturing quality + documentation.
