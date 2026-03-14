# Product data to add manually (SEO + funnel to Purblack)

Goals: build SEO and domain authority, then send traffic from people searching for the best quality shilajit to Purblack.com.

All of the following can be filled manually from the brand’s product page, COA page, and “about”/manufacturing pages. They are **additions** to what you already store (grades, ingredients, COA, manufacturing claim, evidence).

---

## 1. SEO: meta and snippets

| Field | Purpose | Fill from |
|-------|---------|-----------|
| **Meta description** (`metaDescription` or `shortDescription`, 155–160 chars) | Custom meta description per product. Right now every product page uses the same template; a unique description improves CTR and long-tail keywords (“best shilajit resin with COA”, “USA-made shilajit”). Use in `<meta name="description">`, Open Graph, and Schema.org `Product.description`. | Product page headline + one key differentiator (e.g. “Resin, USA-made, COA on request”) |
| **Short tagline / one-liner** (`tagline` or `summary`, 1 sentence) | Marketing-style line for cards, brand pages, and “best of” lists. E.g. “Premium Himalayan shilajit resin, third-party tested.” Different from `ingredientText` (label copy). | Brand’s own tagline or your one-line summary |

**Implementation:** Add optional `metaDescription` (or `shortDescription`) and optionally `tagline` to Product. Use `metaDescription` in `generateMetadata()` and in Product JSON-LD `description`. Use `tagline` in product cards and brand/product listing pages.

---

## 2. Authority and trust (E-E-A-T)

| Field | Purpose | Fill from |
|-------|---------|-----------|
| **Verification / source URLs** (`verificationSourceUrls` – text or array) | “Where we got this.” List of URLs you used to verify the product (official product page, COA page, “about” or manufacturing page). Supports “last verified” and transparency. | Copy-paste 1–3 URLs from the tabs you used to verify the product |
| **Editorial note** (`editorialNote` or `methodologyNote`, optional) | Short note: “We verified COA on [date]; product page states USA-made.” Can stay internal or be shown as “Why we graded this” / “Methodology note” on the product page. | Your own note when you manually check the product |

**Implementation:** Optional `verificationSourceUrls` (e.g. newline-separated or `String[]`) and `editorialNote` (Text). Show “Sources we used” on the product page (links + last verified). Optionally show a short “Why we graded this” if you fill `editorialNote`.

---

## 3. Funnel to Purblack: “best quality” and comparison

| Field | Purpose | Fill from |
|-------|---------|-----------|
| **Pros / cons** (`prosCons` or separate `pros` / `cons` text or list) | Short bullets you write: “Pros: COA available, resin. Cons: Country not stated.” Powers comparison tables and “best shilajit” content; makes it easy to position Purblack as the one that meets all criteria. | Your assessment after reading the product page |
| **Best for** (`bestFor` or `useCase`, short text) | E.g. “Best for: buyers who want USA-made and full COA.” Enables “best for X” lists and guides where Purblack can be the top pick. | Your positioning for this product |
| **Where to buy (primary CTA)** | You may want one “official” or “buy” URL per product. For Purblack, that’s Purblack.com; for others, link to the brand’s official product page. Lets you add “Buy at [Brand]” and a clear “Our top pick: Purblack” CTA. | Official product URL (you may already have this in `officialCanonicalUrl`) |

**Implementation:** Optional `prosCons` (Text, e.g. markdown or plain bullets), `bestFor` (String). Use in compare page and in any “best shilajit” / “top picks” page. Reuse `officialCanonicalUrl` (or add `buyUrl`) for “Where to buy” so you don’t duplicate.

---

## 4. Optional: keywords and internal use

| Field | Purpose |
|-------|--------|
| **Target keywords** (optional) | Phrases you want this page to rank for. Use in meta keywords if you still use them, or only internally to plan content. Lower priority than meta description. |

---

## Priority for manual entry

1. **High impact, low effort**  
   - **Meta description** – One sentence per product; use in meta + JSON-LD.  
   - **Verification source URLs** – Paste 1–3 URLs when you verify a product.

2. **High impact for “best” content and Purblack funnel**  
   - **Pros/cons** (or short summary bullets).  
   - **Best for** (one line).  
   Use these on product and compare pages and in any “best shilajit” list.

3. **Nice to have**  
   - **Tagline** (for cards and lists).  
   - **Editorial note** (for “Why we graded this” and trust).

---

## Summary: suggested new Product fields

| Field | Type | Used for |
|-------|------|----------|
| `metaDescription` | String? (155–160 chars) | Meta description, OG, Schema.org Product.description |
| `tagline` | String? | Cards, brand page, “best of” lists |
| `verificationSourceUrls` | String? (newline-separated) or String[] | “Sources we used” / last-verified trust |
| `editorialNote` | String? @db.Text | Optional “Why we graded this” |
| `prosCons` | String? @db.Text | Comparison and “best shilajit” content |
| `bestFor` | String? | “Best for X” lists and funnel to Purblack |

All optional, all manually fillable from external product pages. No grading logic changes; these are for content, SEO, and funnel only.
