# Grading Methodology

Quality and transparency scores are based only on **data already in the database** or **data we can obtain from crawl**. The **overall grade (A+–F)** uses a **weighted scoring system** (see “Overall grade: weighted scoring system” below); factors and possible extensions are described in the rest of the doc.

**Objective data only.** We do not encode “manufactured by” or any other unverifiable relationship. Every product receives the grade that the **objective, available data** supports. The only brand-specific rule is Purblack (A by default; A+ when COA is present). All other brands are graded solely by the weighted criteria.

---

## 1. Purity (how much shilajit is in the product)

**Idea:** Prefer products that are predominantly or solely shilajit; blends and “proprietary blends” score lower.

**Data today:**

- `ingredientText` – full disclosure text from the label/page  
- `ingredientsNormalized` – normalized list (e.g. `["shilajit resin", "vegetarian capsule"]`)

**Scoring options (using existing data):**

- **Shilajit-only (no other actives):**  
  Normalized list contains only shilajit-related terms + allowed inactives (capsule, cellulose, etc.) → **high purity**.
- **Shilajit plus other actives / “blend”:**  
  Other herbs, nootropics, “proprietary blend”, etc. → **medium or low purity** (e.g. downgrade or cap tier).

**Optional (crawl addition):**  
If we add parsing in the official-product extractor we can support:

- **Stated concentration:** e.g. “X% shilajit”, “X mg shilajit per serving” in `ingredientText` (regex).  
- Store in a new field, e.g. `shilajitPercentClaim` or `shilajitMgPerServingClaim`, and use bands (e.g. ≥X% or ≥Y mg → higher purity score).

**Recommendation:**  
Use “shilajit-only vs blend/other actives” from current fields for v1; add concentration parsing later if we want finer purity bands.

---

## 2. Form (resin preferred; other forms “insufficient” for top tier)

**Idea:** Resin is treated as the best form; other forms (capsule, powder, gummy, liquid, blend) are sufficient for lower tiers but not for the highest.

**Data today:**

- `Product.form` – enum: `RESIN | CAPSULE | POWDER | GUMMY | LIQUID | BLEND | OTHER`  
- Set from crawl (title + page text) and admin.

**Scoring (implemented):**

- **RESIN** → 2 points in overall weighted score; only resin gets any form points.  
- **CAPSULE / POWDER / GUMMY / LIQUID / BLEND / OTHER** → 0 form points.

**No schema or crawl change needed** – use `form` as-is.

---

## 3. Third-party testing and COA

**Idea:** We distinguish between (1) **actual COA** (a real certificate or document) and (2) **testing mentioned only** (e.g. “third-party tested” or “tested by Lab X” with no link to the certificate). Only actual COA gets full weight; “testing mentioned” gets a small credit so we don’t ignore it.

### How we assess it

| Situation | How we record it | Points (overall grade) |
|-----------|-------------------|-------------------------|
| **Actual COA on page** | `coaStatus = PUBLIC`, set `coaUrl` (and add Evidence `type: "COA"` with the link). | 3 |
| **COA on request** | `coaStatus = REQUEST_ONLY` (company says they’ll provide COA). | 2 |
| **Testing mentioned, no COA** | `coaStatus = NONE` or `UNKNOWN`. Add Evidence `type: "TESTING"` with a quote (e.g. “Tested by X for heavy metals”). | 1 (if at least one TESTING evidence and no COA) |
| **No COA, no testing claim** | `coaStatus = NONE` or `UNKNOWN`, no TESTING evidence. | 0 |

So: **actual COA** = document or link (PUBLIC/REQUEST_ONLY). **Testing mentioned only** = no document, but we record it as TESTING evidence and give 1 point so it’s above “nothing”.

**Data today:**

- `coaStatus` – `PUBLIC | REQUEST_ONLY | NONE | UNKNOWN`  
- `coaUrl` – link to the actual COA when available  
- Evidence `type: "COA"` – link to the certificate (from crawl or admin)  
- Evidence `type: "TESTING"` – quote/capture where the product page mentions third-party testing without providing the actual COA

---

## 4. Transparency of manufacturing (where it’s made)

**Idea:** We score manufacturing transparency by **country of manufacture only** (no separate “manufacture clarity” field). A stated country → credit; USA gets the most; not stated → no points.

**Data today:**

- `manufacturingCountryClaim` – e.g. “USA”, “India” (country of manufacture)  
- `manufacturingClaimText` – full claim  
- `manufacturingEvidenceUrl` – optional link  
- Evidence `type: "MANUFACTURING"` from crawl.

**Scoring:**

- **Country of manufacture stated:** USA (or “US” / “United States”) → 3 points; any other country → 1 point.  
- **Not stated** → 0 manufacturing points.

---

## 5. Patents

**Idea:** Patented process or formulation can be a positive signal (innovation / substantiation).

**Data today:**

- **None.** We do not store patent info.  
- Evidence types: `COA | MANUFACTURING | INGREDIENTS | TESTING | OTHER` – no `PATENT`.

**Options (crawl + schema):**

- **A. Evidence-based:**  
  - Add `EvidenceType.PATENT`.  
  - In official-product extractor: detect “patent”, “patented”, “US Patent”, “USPTO”, patent numbers in page text and links; create Evidence with `type: PATENT`, `url` (link or USPTO/search link), optional `quote`.  
  - Grading: e.g. “has at least one PATENT evidence” → +1 factor or small boost.  
- **B. Boolean on product:**  
  - Add `hasPatentClaim: Boolean` on Product; set from same crawl logic; grading reads the flag.  
- **C. No patents:**  
  - Leave patents out until we add one of the above.

**Recommendation:**  
Add patent detection in crawl (regex + link heuristics) and either Evidence `PATENT` or `hasPatentClaim`; use as one factor in the overall score so it doesn’t dominate.

---

## 6. Other factors (recommended, using existing or easy crawl data)

- **Third-party testing / certifications**  
  - We have Evidence `type: "TESTING"`.  
  - Use “has at least one TESTING evidence” as a positive factor (e.g. small boost or requirement for top tier).

- **Official labeling / trust**  
  - `evidence.length` and `sourceDsldLabelId` already used for “official labels”.  
  - Keep using: e.g. 2+ evidence items or DSLD label → qualifies for higher tiers when other criteria (form, COA, manufacturing, purity) are met.

- **Net quantity / serving clarity**  
  - `netQuantityText`, `servingsCount`, `capsuleCount` – already on Product.  
  - Optional: “has clear net quantity and/or serving info” as a small positive (label transparency).

- **Data completeness**  
  - `dataCompleteness` – `LOW | MEDIUM | HIGH`.  
  - Optional: use as a modifier (e.g. HIGH completeness can slightly boost, LOW can cap tier) so we favor well-filled records.

---

## Summary: factors and data source

| Factor                    | In DB / crawl today?        | Needed for scoring              |
|---------------------------|-----------------------------|----------------------------------|
| Purity                    | Yes (ingredients only)      | Optional: % or mg from crawl    |
| Form                      | Yes (`form`)                | Nothing                         |
| COA                       | Yes (`coaStatus`, evidence) | Nothing                         |
| Manufacturing (country)   | Yes (`manufacturingCountryClaim`)   | Nothing                  |
| Patents                   | No                          | Crawl + PATENT evidence or flag |
| Third-party testing       | Yes (Evidence TESTING)      | Nothing                         |
| Official / trust          | Yes (evidence count, DSLD)  | Nothing                         |
| Net qty / serving clarity | Yes                         | Optional                         |
| Data completeness         | Yes                         | Optional                         |

---

## Overall grade: weighted scoring system (implemented)

**Output:** One overall grade per product: **A+**, **A**, **B**, **C**, **D**, **E**, **F**.  
All grades are determined only from objective data in the database (and evidence from crawl).  
**COA = third-party testing** — we use it as a single factor and do not double-count.

---

### 1. Weighted score (max 10)

Each product gets a **numeric score** from the following. Partial credit means one strong signal (e.g. COA) can already move the grade up.

| Factor | Data | Points |
|--------|------|--------|
| **COA / third-party testing** | `coaStatus` + Evidence TESTING | PUBLIC → 3 · REQUEST_ONLY → 2 · NONE/UNKNOWN but ≥1 TESTING evidence → 1 · else → 0 |
| **Country of manufacture** | `manufacturingCountryClaim` | USA → 3 · other country → 1 · not stated → 0 |
| **Form** | `Product.form` | RESIN → 2 · all other forms → 0 |
| **Purity** | `ingredientText` + `ingredientsNormalized` | Shilajit-only (with allowed inactives) → 2 · else → 0 |
| **Ingredients list** | `ingredientsNormalized` | Non-empty list → 1 · empty → 0 |
| **Ingredient disclosure** | `ingredientText` | Non-empty text → 1 · empty → 0 |

Total score is capped at 10. “Shilajit-only” uses the same rules as elsewhere (allowed inactives: capsule, cellulose, magnesium stearate, etc.; no proprietary blend / other actives).

---

### 2. Score → grade bands

| Score | Grade | Meaning |
|-------|--------|--------|
| **7+** | **A** or **A+** | A+ only if resin + high purity; else A. |
| **5–6** | **B** | Good transparency; missing some top signals. |
| **4** | **C** | Adequate; e.g. COA or clear mfg plus some form/purity. |
| **2–3** | **D** | Limited disclosure. |
| **1** | **E** | Minimal data (e.g. only ingredient text). |
| **0** | **F** | No supporting data, or proprietary blend with no COA and no clear mfg. |

**Proprietary blend:** If the product has a “proprietary blend”–style claim and no COA and no clear manufacturing, grade is **F** regardless of score.

---

### 3. Purblack (only brand-specific rule)

- **If brand is Purblack** (slug matches e.g. purblack, pur-black):  
  - **Default grade = A** (no points required).  
  - **If the product has COA (public or request)** → **grade = A+**.  
- All other brands use the weighted score and bands above only.

---

### 4. Computation flow (as implemented)

1. **Brand:** If Purblack → apply Purblack rule; done.  
2. **F override:** If proprietary blend and no COA and no clear mfg → F.  
3. **Score:** Sum points from COA, country of manufacture, form, purity, ingredients list, ingredient text (see table).  
4. **Band:** Map score to A+ / A / B / C / D / E / F using the score bands.  
5. **Store:** Persist in `Product.overallGrade`; recompute on save/crawl or via `npm run db:recompute-overall-grades`.

---

### 5. Data sources

- **Product:** `form`, `coaStatus`, `coaUrl`, `manufacturingCountryClaim`, `manufacturingClaimText`, `ingredientText`, `ingredientsNormalized`, `brandId` (→ brand slug).  
- **Evidence:** used indirectly (e.g. COA evidence when setting `coaStatus`).  
- **No** “manufactured by” or similar; grade depends only on these objective fields.
