# ShilajitDB — Claude Context

## What this is
Transparency database for shilajit supplements. Neutral, editorial tone. Rates products on COA quality, lab credibility, heavy metals safety, manufacturing transparency. No affiliate links, no brand relationships.

## Stack
Next.js 15 App Router · TypeScript · Prisma 6 + PostgreSQL (Supabase) · Tailwind CSS · Vercel

## Architecture
- `app/` — all routes (no Pages Router)
- `app/learn/[slug]/` — 25 static editorial articles
- `app/best/[tag]/` — 10 ranking pages, driven by `bestForTags` field
- `app/product/[slug]/` + `/lab-results` — per-product pages
- `app/brand/[slug]/` + `/lab-tests` — per-brand pages
- `app/compare/[pair]/` — compare pages (top 15 products = 105 pairs)
- `components/product-card.tsx` — shared card used everywhere
- `lib/db.ts` — Prisma singleton
- `prisma/schema.prisma` — source of truth for all enums

## Key enums (don't re-ask)
- `OverallGrade`: A_PLUS, A, B, C, D, E, F (no B_PLUS)
- `QualityTier`: ULTRA_PREMIUM, PREMIUM, AVERAGE, POOR
- `CoaStatus`: PUBLIC, PUBLIC_EMBEDDED, REQUEST_ONLY, NONE, UNKNOWN
- `HeavyMetalsTested`: CONFIRMED (numeric ppm on public COA), CLAIMED, NONE
- `bestForTags`: String[] — drives all /best/[tag] pages, 2-per-brand cap, 15 max per tag

## DB access
Local scripts can't reach Supabase directly (IP blocked). Use one-shot admin API routes deployed to Vercel, call from browser console, then delete the route. Direct URL (port 5432) occasionally works; pooler (port 6543) does not from local.

## Conventions
- All DB queries filter `isCanonical: true, dataCompleteness: { not: "LOW" }`
- Dark theme throughout: bg `#0F1320`, text `#EEF0F8`, muted `#8892B8`, subtle `#4A5070`
- No product images — grade badge is the visual anchor
- Ranking pages read only from `bestForTags`; never hardcode product queries per tag
- Learn articles: ArticleSchema component, breadcrumb, category badge, h1, "Last reviewed", browse link, CTA block with /best/[tag] links, 2 related articles

## Last worked on
- Brand descriptions generated for all 118 brands via admin route (May 2026)
- Google Search Console set up, sitemap submitted (693 pages)
- Internal linking added to all 25 learn articles
- All 5 GitHub Actions workflows disabled (job runner code lives in `claude/quirky-hamilton`, not merged)
- 301 redirects: `sunmed-rachaels-story` → `sunmed-shilajit-gummies`, `best_resin` → `best-resin`, `best-us-made` → `editors-pick`
- Sitemap SEO fixes (May 2026): switched from `force-dynamic` to `revalidate=3600`; filtered out evidence-less products (they get noindex on the page); added `lastModified` to brand pages

## Do not re-litigate
- Why no affiliate links (editorial independence is the value prop)
- Prisma must be in `serverExternalPackages` — native engine deadlocks if bundled
- `quirky-hamilton` branch has automation + old frontend code; not merged due to conflict risk
- Citation text color: `#8892B8` (was too dark at `#4A5070`, fixed May 2026)
