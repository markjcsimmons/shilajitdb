# Shilajit Transparency Database

A production-ready, database-driven web app for a **public, neutral, fact-based** database of shilajit products sold in the United States.

Users can **search, filter, and compare** products by objective transparency and quality signals, with sources/evidence and “last verified” dates.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod validation

No user accounts (MVP). Admin is protected by a simple password in env.

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy the example and edit as needed:

```bash
cp .env.example .env
```

Required env vars:

- `DATABASE_URL`: Postgres connection string
- `ADMIN_PASSWORD`: admin password for `/admin`
- `NEXT_PUBLIC_SITE_URL`: canonical base URL (local dev: `http://localhost:3000`)
- `NEXT_PUBLIC_REPORT_EMAIL`: email used for “Report an update” mailto links

### 3) Create the database schema (migrations)

Run migrations against your Postgres database:

```bash
npx prisma migrate dev
```

### 4) Seed sample data

```bash
npx prisma db seed
```

### 5) Start the app

```bash
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Prisma notes

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/*`
- Seed script: `prisma/seed.ts`

Useful commands:

```bash
# Studio
npx prisma studio

# Recompute grades for all products
npm run db:recompute
```

## Key features (MVP)

### Public pages

- `/` — **SSR search + filters** with pagination and best-first default sorting
- `/brand/[slug]` — brand page with summary badges and product list
- `/product/[slug]` — product detail (ingredients, COA, manufacturing claims, evidence, last verified)
- `/compare/[slugA]-vs-[slugB]` — side-by-side comparison page (canonicalized)
- `/methodology` — rubric definitions and evidence policy

### Admin (password-protected)

- `/admin/login` — password gate sets an httpOnly cookie (no full auth system)
- `/admin/brands` — list/create/edit brands
- `/admin/products` — list/create/edit products
- Product edit supports:
  - inline evidence add/delete
  - **Recompute grades** (runs rules in `lib/grading.ts` and saves to DB)

## Grading logic

Grading functions live in:

- `lib/grading.ts`

They compute:

- `computeTransparencyGrade(product, evidenceCount)` → `{ grade: A–F, score, reasons[] }`
- `computeQualityTier(product, transparencyResult)` → `{ tier, reasons[] }`

Grades are stored in the database, and recomputed:

- on seed (`prisma/seed.ts`)
- on admin save / evidence edits (`app/admin/actions.ts`)
- manually via `npm run db:recompute`

## Search + filters implementation

Homepage filtering/parsing is implemented in:

- `lib/search.ts` (Zod parsing, Prisma `where` builder, pagination)
- `app/page.tsx` (server-rendered results)

Filters live in URL query params for shareable/searchable links.

## SEO

Implemented:

- Dynamic metadata + canonical URLs for brand/product/compare pages
- OpenGraph basics
- JSON-LD structured data:
  - `WebSite` + `SearchAction` on homepage
  - `BreadcrumbList` on brand/product pages
  - conservative `Product` schema on product pages

## Deployment (Vercel + managed Postgres)

1) Create a managed Postgres (Neon, Supabase, RDS, etc.)
2) Set Vercel environment variables:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
   - `NEXT_PUBLIC_REPORT_EMAIL`
3) Ensure migrations run during deploy (common options):
   - Run `prisma migrate deploy` in a Vercel build step, or
   - Use a CI workflow to run migrations.

## Data ingestion (populate “all” US products)

This repo includes a **script-based ingestion pipeline** to operationally cover:

- DSLD coverage for shilajit + synonyms
- Brand-site enrichment for COA + manufacturing claims (robots.txt respected)
- Discovery + Listings ingestion for products beyond DSLD (official + marketplaces + retailers)
- Manual merge review queue for uncertain matches (never auto-merge on fuzzy matching alone)

### IngestionRun observability

Each ingestion script creates an `IngestionRun` record (type, status, started/finished timestamps, stats summary, error text).

You can also run ingestion from the Admin UI:

- `/admin/ingestion`

### Stage 1 — DSLD backbone ingest

Ingests DSLD labels for all required terms:

- shilajit, shilajeet, mumijo, mumie, asphaltum, mineral pitch

Command:

```bash
npm run ingest:dsld:shilajit
```

Options:

```bash
# Dry-run (no DB writes)
npm run ingest:dsld:shilajit -- --dry-run

# Limit labels for testing
npm run ingest:dsld:shilajit -- --max 200
```

Expected outcomes:

- Upserts brands/products, stores `sourceDsldLabelId` + `sourceDsldUrl`
- Sets `dataCompleteness=MEDIUM`, `coaStatus=UNKNOWN`, `lastVerifiedAt=now`
- Adds Evidence (sourceName “DSLD”), then recomputes grades/tier

### Stage 2 — Brand-site enrichment crawl

Crawls each brand with `websiteDomain`:

- respects robots.txt (skips disallowed)
- rate limits to ~1 req/sec/domain with small global concurrency
- extracts objective COA + manufacturing snippets and stores Evidence

Command:

```bash
npm run ingest:web:brands
```

Options:

```bash
npm run ingest:web:brands -- --dry-run
npm run ingest:web:brands -- --max-brands 50
```

Expected outcomes:

- Updates `coaStatus`/`coaUrl` if found (PUBLIC/REQUEST_ONLY)
- Updates manufacturing fields if stronger than existing
- Promotes `dataCompleteness` to HIGH when criteria are met
- Recomputes grades/tier and updates `lastVerifiedAt`

### Stage 3 — Discovery CSV import (manual)

Import a CSV of additional brands/products not present in DSLD (MVP discovery is manual by design).

CSV columns:

- `brandName` (required)
- `website` (optional)
- `productName` (optional)
- `form` (optional; one of RESIN/CAPSULE/POWDER/GUMMY/LIQUID/BLEND/OTHER)

Command:

```bash
npm run ingest:discovery:csv -- --path /absolute/path/to/brand-websites.csv
```

## Discovery & Coverage (beyond DSLD)

DSLD is a backbone import, but it is **not complete** for “all products for sale online in the US.”
To build complete coverage, we ingest **Listings** (places a product is sold) and dedupe them into **canonical Products**.

### Key rules

- Canonical **Products** are the only searchable/indexable items.
- **Listings** never appear as search results; they appear only on the Product page (“Where it’s sold”).
- **Evidence** is for transparency proof (COA/manufacturing/ingredients/testing), not for distribution URLs.
- Do **not** scrape Amazon/Walmart/Google Shopping at scale. Prefer approved APIs or manual CSV exports.

### Listings CSV format

CSV columns:

- `url` (required)
- `source` (OFFICIAL|AMAZON|WALMART|IHERB|OTHER_RETAILER|GOOGLE_SHOPPING|MANUAL)
- `title` (optional)
- `brandName` (optional)
- `observedGtin` (optional)
- `observedSku` (optional)
- `netQuantityText` (optional)
- `form` (optional)

Example:

```csv
url,source,title,brandName,observedGtin,observedSku,netQuantityText,form
https://examplebrand.com/products/shilajit-resin-30g,OFFICIAL,Shilajit Resin 30g,Example Brand,,,,30g,RESIN
https://www.amazon.com/dp/B000000000,AMAZON,Example Brand Shilajit Resin 30g,Example Brand,123456789012,,30g,RESIN
```

### Run discovery imports

```bash
# Ingest a Listings CSV (creates Listings and placeholder Products when needed)
npm run discover:csv -- --path /absolute/path/to/listings.csv

# Orchestrator (safe defaults; iHerb is robots-respecting; marketplaces via CSV)
npm run discover:run -- --provider all --csvPath /absolute/path/to/listings.csv
```

### Manual merge review queue

When the resolver finds a high-confidence match (>= 0.95) based on brand/title/form/quantity, it creates a
`MergeCandidate` (PENDING) for review instead of auto-merging.

Use the Admin UI:

- `/admin/discovery` → Upload Listings CSV + approve/reject merge candidates

### Enrich official listings into Evidence

For Products that have an OFFICIAL listing, you can enrich transparency data from the official page:

```bash
npm run enrich:official -- --max 50
```

This will:

- add Evidence for COA/manufacturing links/snippets found on official pages (robots respected, rate limited)
- update Product fields when stronger
- recompute grades/tier

To run legacy brand website import (if `DISCOVERY_CSV_PATH` is set) + then crawl:

```bash
npm run ingest:discovery:run
```

## Automation Pipeline (recommended)

The **Full Pipeline** runs three discovery and enrichment stages automatically, in sequence.

### What the pipeline does

1. **OCR Discovery** — downloads DSLD label images for all products with a DSLD ID, runs `tesseract.js` OCR to extract brand domains, and creates OFFICIAL listings + Evidence records (max 200 products per run).
2. **Sitemap Harvest** — fetches `sitemap.xml` for every known official domain, classifies product-path URLs, and resolves them through the Listings → Resolver → MergeCandidate pipeline (max 50 domains × 200 URLs per run).
3. **Enrichment** — visits official pages, extracts COA links, manufacturing claims, and ingredient snippets, stores Evidence records, and recomputes transparency grades (max 50 products per run).

### Running the pipeline

**Admin UI (recommended):**

1. Go to `/admin/populate`
2. Click **Run Full Pipeline**
3. The pipeline runs in the background; the page auto-refreshes and shows live stage progress and final stats.

**CLI:**

```bash
tsx scripts/jobs/runFullPipeline.ts
```

**Recommended cadence:** Run weekly (Sunday) after the DSLD import.

### Individual jobs (CLI)

```bash
# OCR discovery
npm run discover:dsld-images -- --max 200

# Sitemap harvest
npm run discover:sitemaps -- --maxDomains 50 --maxUrlsPerDomain 200

# Enrich official pages (default max 50)
npm run job -- --type ENRICH_OFFICIAL --max 50

# Link health (default max 200)
npm run job -- --type LINK_HEALTH --max 200

# Discovery (robots-allowed + CSV inbox)
npm run job -- --type DISCOVERY_ROBOTS_ALLOWED
```

### Scheduling with GitHub Actions

Workflows in `.github/workflows/` run on a schedule (requires `DATABASE_URL` secret in GitHub Actions):

- `enrich_official.yml` — daily 03:00 UTC
- `link_health.yml` — Mondays 06:00 UTC
- `discovery.yml` — daily 02:00 UTC
- `discover_dsld_images.yml` — Sundays 01:00 UTC (DSLD label OCR)
- `discover_sitemaps.yml` — Sundays 04:00 UTC (sitemap harvest)

### Admin UI

- **Populate page:** `/admin/populate` — one-click **Run Full Pipeline** with a live results panel, plus numbered individual step buttons.
- **Automation dashboard:** `/admin/automation` — view all jobs, last run status, enable/disable, run now, full run history and stats.

## Troubleshooting

### "Engine is not yet connected" / `_napi_register_module_v1` deadlock

**Cause:** Next.js/Turbopack/Webpack bundled `@prisma/client` through its module bundler.
Prisma's query engine is a native N-API addon (`.node` binary) that **must** be
loaded by Node.js `require()` directly — it cannot be bundled.

**Fix (already applied):** `next.config.mjs` externalizes Prisma via:
- `serverExternalPackages`
- `experimental.serverComponentsExternalPackages`
- `webpack.externals` (belt-and-suspenders)

**Verify config is loaded:** On dev startup you should see:

```
[next.config] loaded; externalizing prisma
```

If that line is missing, the config is not being loaded — ensure only one
`next.config.*` file exists (we use `next.config.mjs`).

**Hard reset (clears stale build + Prisma artifacts):**

```bash
npm run reset:prisma-next
npm run dev
```

**If the issue persists:** Try `npm run dev:webpack` to confirm whether
Turbopack is the trigger (diagnostic only).

---

### Stale generated Prisma client

Running `prisma generate` multiple times with different `engineType` settings
leaves stale files in `node_modules/.prisma/client/` that can conflict.

**Fix:**

```bash
npm run reset:prisma-next
# equivalent to:
rm -rf .next node_modules/.prisma && npx prisma generate
```

---

### "DATABASE_URL is not set" on first run

Copy the example env file and fill in your Postgres connection string:

```bash
cp .env.example .env
# then edit .env and set DATABASE_URL
```

---

### Pre-flight check fails before `npm run dev`

`npm run dev` runs `scripts/checkPrisma.ts` automatically (via `predev` hook).
It checks:
1. `DATABASE_URL` is set
2. `node_modules/.prisma/client` exists
3. The database responds to `SELECT 1` within 5 seconds

If any check fails, follow the printed instructions. To skip the check
temporarily (not recommended):

```bash
npx next dev   # bypasses predev hook
```

---

### Quick DB health check

After the dev server is running, hit the health endpoint to confirm
Prisma connects successfully:

```
GET http://localhost:3000/api/health/db
→ {"ok":true,"latencyMs":42}
```

---

### Turbopack compatibility note

This project runs `next dev` with **Turbopack** (the default in Next.js 15).
Turbopack requires `serverExternalPackages` to be set for any package that
ships a native Node.js addon. **Do not remove `@prisma/client` from that
list** — doing so will reintroduce the pthread deadlock.

---

## Notes on DSLD API access

By default the scripts use `DSLD_API_BASE_URL` (see `.env.example`). The DSLD API has public rate limits; if you need higher throughput, set `DSLD_API_KEY` to a data.gov API key.

