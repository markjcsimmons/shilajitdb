# URL CSV Extractor Pipeline

Extracts product data from URLs in a CSV file. Classifies each URL, fetches the page, and extracts structured data without polluting the canonical product database.

## Expected CSV Input Format

| Column | Required | Description |
|--------|----------|-------------|
| `name` or `NAME` | No | Product or brand name (hint for extraction) |
| `url` or `URL` | Yes | Full URL to fetch |
| `source` or `SOURCE` | No | Hint: `OFFICIAL`, `AMAZON`, `WALMART`, `OTHER_RETAILER` |

Example `data/in.csv`:

```csv
name,url,source
Root Labs Shilajit Gummies,https://rootlabs.co/products/root-labs-shilajit-gummies,OFFICIAL
Altay Mummiyo,https://www.amazon.com/dp/B0BDRPMQPP,AMAZON
Himalaya Shilajit,https://himalayausa.com/collections/shilajit,
```

## URL Classification Rules

| URL Kind | When | Example |
|----------|------|---------|
| `OFFICIAL_PRODUCT_PAGE` | Non-marketplace domain + path like `/products/`, `/product/`, `/p/` (NOT `/shop/`) | `rootlabs.co/products/shilajit-gummies` |
| `RETAILER_PRODUCT_PAGE` | iHerb, Vitacost, Swanson, Vitamin Shoppe + PDP path | `iherb.com/p/12345` |
| `MARKETPLACE_PRODUCT_PAGE` | amazon.com, walmart.com, etc. + PDP path (`/dp/`, `/ip/`) | `amazon.com/dp/B0BDRPMQPP` |
| `COLLECTION_PAGE` | Path like `/collections/`, `/search`, `/category/`, `/shop/` | `himalayausa.com/collections/shilajit` |
| `STORE_PAGE` | Path like `/stores/BrandName` | `amazon.com/stores/BrandName` |
| `HOMEPAGE` | Root or near-root path | `nurojit.com/` |
| `UNKNOWN` | No matching pattern | — |

**Note:** `/shop/` is treated as COLLECTION_PAGE by default (often a category/storefront, not a single PDP).

## Official vs Marketplace Behavior

**Official product pages** (brand websites) can become **canonical products** when:
- Product name and brand are extracted
- Page is clearly a product detail page

**Marketplace pages** (Amazon, Walmart, etc.) are **listing-only** by default:
- We extract title, brand, ASIN, size, GTIN when visible
- We do **not** treat marketplace pages as authoritative for COA, manufacturing country, or full ingredients
- Listings attach to existing canonical products when matched; we do not blindly create new products from marketplace URLs

This avoids polluting the database with low-trust data from third-party retailers.

## Output

### Enriched CSV Columns

- `input_name`, `input_url`, `source`
- `url_kind`, `canonicalized_url`
- `extracted_brand`, `extracted_product_name`
- `form`, `ingredients_text`, `manufacturing_claim`, `coa_url`, `gtin`, `net_quantity`
- `can_create_canonical`, `confidence`, `notes`

### JSON Summary

- `rowsProcessed`, `officialProductPages`, `marketplacePages`, `collectionPages`, `homepages`
- `canonicalCandidates`, `listingOnly`, `failed`

## How to Run

**Dry run (default)** — no DB writes:

```bash
npx tsx scripts/ingest/url_csv/runUrlCsvExtract.ts --input data/in.csv --output data/out.csv
```

Or:

```bash
npm run ingest:url-csv -- --input data/in.csv --output data/out.csv
```

**CLI flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--input` / `-i` | required | Path to input CSV |
| `--output` / `-o` | `{inputDir}/url_csv_enriched.csv` | Path to output CSV |
| `--dryRun` | `true` | If `false`, enables DB write mode |
| `--writeDb` | `false` | If `true` and `dryRun=false`, write to database |
| `--maxRows` | `9999` | Max rows to process |
| `--usePlaywrightOfficial` | `true` | Use Playwright for OFFICIAL_PRODUCT_PAGE (JS-rendered ecommerce) |
| `--usePlaywrightAll` | `false` | Use Playwright for all URL types |

## Enabling DB Writes

1. Set `--dryRun false` and `--writeDb true`
2. **Official product pages** with `can_create_canonical=true`: create/update Product, create OFFICIAL Listing, create Evidence
3. **Marketplace pages**: create Listing only, attach to existing Product if matched via GTIN/officialCanonicalUrl
4. **Collection/homepage**: discovery outputs only (no canonical product creation)

DB write integration uses the existing `resolveListingToProduct` and listing resolver logic.
