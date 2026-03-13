# Product fields: what’s needed for scoring and display

## Used by grading (keep)

| Field | Role |
|-------|------|
| `form` | Overall grade: resin gets 2 points |
| `ingredientText` | Purity, ingredient disclosure point, proprietary-blend F |
| `ingredientsNormalized` | Purity, ingredients-list point |
| `manufacturingCountryClaim` | USA → 3 pts, other country → 1 pt; F if proprietary blend + no COA + no country |
| `coaStatus` | PUBLIC/REQUEST_ONLY → 3/2 points; Purblack A+ when COA |
| `brandId` → brand slug | Purblack rule (A / A+) |
| Evidence count / `sourceDsldLabelId` | Quality tier “official labels” |

`coaUrl` is not used in the formula but is the link shown for COA; keep for display.

---

## Used on public/search (keep)

- **Public product page:** manufacturingCountryClaim, manufacturingClaimText, manufacturingEvidenceUrl, coaUrl, lastVerifiedAt, form, grades, evidence, listings.
- **Homepage / search:** form, dataCompleteness, manufacturingCountryClaim, coaStatus, coaUrl, transparencyGrade, qualityTier, lastVerifiedAt.
- **Search filter:** manufacturingCountryClaim.
- **Ordering:** dataCompleteness, isCanonical.

So keep: manufacturingCountryClaim, manufacturingClaimText, manufacturingEvidenceUrl, lastVerifiedAt, dataCompleteness, isCanonical, officialCanonicalUrl/officialDomain (product URL).

---

## Not used by grading or public product page

These are only in admin form, data-import, or ingestion (listings/merge):

| Field | Used by | Safe to hide from admin form? |
|-------|--------|-------------------------------|
| **gtin** | Crawl dedup, unique constraint, listing match | Yes* – optional; crawl can set it |
| **mpn** | Admin + data-import only | Yes |
| **brandSku** | Admin + listing resolver (observed SKU) | Yes |
| **flavor** | Admin + data-import only | Yes |
| **netQuantityText** | Discovery merge, listing resolver, admin | Yes** – optional |
| **servingsCount** | Admin + data-import only | Yes |
| **capsuleCount** | Admin + data-import only | Yes |

\* Keep gtin in DB and in form if you want to manually enter barcodes for matching.  
\** Keep if you use discovery/merge by quantity.

---

## Internal/ingestion-only (do not remove from schema)

- `sourceDsldLabelId`, `sourceDsldUrl` – DSLD pipeline, quality tier “official labels”.
- `dataCompleteness` – search order, noindex for LOW.
- `isCanonical` – search and public visibility.

These are set by scripts/crawl; no need to show in the main admin form.

---

## Summary: safe to remove from the admin form

If you only care about **scoring** and **what’s shown on the public product page**, you can **hide** these from the product edit/new form (they stay in the DB; crawl/import can still set them):

- **MPN**
- **Brand SKU**
- **Flavor**
- **Servings count**
- **Capsule count**

Optionally also hide **Net quantity text** if you don’t use discovery/merge by quantity, and **GTIN** if you don’t manually enter barcodes. **Last verified date** can stay (it’s shown on the public page) or be hidden if you don’t use it.

No schema changes are required; removing these from the form only simplifies manual data entry.
