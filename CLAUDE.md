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

## Rendering strategy (don't re-litigate)
- `app/page.tsx` (homepage) — stays `force-dynamic`; uses searchParams for filtering/pagination
- All other public pages use `revalidate = 3600` + `generateStaticParams` (ISR)
- `app/best/[tag]/page.tsx` — also has `dynamicParams = false`; only 10 known tags
- Admin pages stay `force-dynamic` — correct, they need live DB
- Compare pages pre-render all 105 pairs from top 15 products at build time
- www → non-www 301 redirect in `next.config.mjs` AND Vercel domain settings (both configured)

## GSC / SEO status (May 2026)
- Sitemap: 540 pages discovered by Google, processed successfully
- 676 pages "Discovered - currently not indexed" as of 5/21/26 — validation started 5/25/26
- Only 12 pages indexed as of 5/21/26 — site is new, crawl budget building
- `/learn/shilajit-men-vs-women` ranking at avg position 7.8 with 10 impressions (0 clicks) — first organic signal
- Organic traffic: 21 sessions in 4 weeks (Apr 30–May 27), highest quality channel (132s avg engagement)
- Next GSC check: ~2 weeks from 5/28/26 — look for "discovered not indexed" count dropping

## Last worked on
- Brand descriptions generated for all 118 brands via admin route (May 2026)
- Google Search Console set up, sitemap submitted (693 pages)
- Internal linking added to all 25 learn articles
- All 5 GitHub Actions workflows disabled (job runner code lives in `claude/quirky-hamilton`, not merged)
- 301 redirects: `sunmed-rachaels-story` → `sunmed-shilajit-gummies`, `best_resin` → `best-resin`, `best-us-made` → `editors-pick`
- Sitemap SEO fixes (May 2026): switched from `force-dynamic` to `revalidate=3600`; filtered out products with <2 evidence sources (they get noindex on the page); added `lastModified` to brand pages
- Product noindex threshold raised to `evidence.length < 2` (was `=== 0`) — products with only 1 source are too thin to index; sitemap filter kept in sync via `_count.evidence >= 2`
- Fixed `best-us-made` redirect: was `permanent: false` (307), now `permanent: true` (301)
- ISR conversion (May 2026): converted all public pages from `force-dynamic` to `revalidate=3600` + `generateStaticParams`; added www → non-www redirect
- SEO noindex fixes (Jun 2026): filtered homepage URLs get `noindex, follow`; compare pages where either product has <2 evidence sources get `noindex, follow`; OG image paths added to robots.txt disallow
- OG image 5xx fix (Jun 2026): added `maxDuration = 30` and wrapped full render in try/catch on `app/product/[slug]/opengraph-image.tsx` — Satori crashes and DB timeouts now return fallback image instead of 5xx
- Redirects added for `/learn/product-lab-results-:slug` → `/product/:slug/lab-results` and `/learn/brand-lab-tests-:slug` → `/brand/:slug/lab-tests` (old ArticleSchema URLs Google had indexed)
- Homepage "last updated" label now reflects actual most-recent product verification date or article publish date, not current date

## Do not re-litigate
- Why no affiliate links (editorial independence is the value prop)
- Prisma must be in `serverExternalPackages` — native engine deadlocks if bundled
- `quirky-hamilton` branch has automation + old frontend code; not merged due to conflict risk
- Citation text color: `#8892B8` (was too dark at `#4A5070`, fixed May 2026)
- Homepage must stay `force-dynamic` — searchParams for filters/sort/pagination
