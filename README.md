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

This repo includes a **script-based ingestion pipeline** (no background queues) to operationally cover:

- DSLD coverage for shilajit + synonyms
- Brand-site enrichment for COA + manufacturing claims (robots.txt respected)
- Manual discovery CSV import for brands/products missing from DSLD

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
npm run ingest:discovery:csv -- --path /absolute/path/to/discovery.csv
```

To run import (if `DISCOVERY_CSV_PATH` is set) + then crawl:

```bash
npm run ingest:discovery:run
```

## Notes on DSLD API access

By default the scripts use `DSLD_API_BASE_URL` (see `.env.example`). The DSLD API has public rate limits; if you need higher throughput, set `DSLD_API_KEY` to a data.gov API key.

