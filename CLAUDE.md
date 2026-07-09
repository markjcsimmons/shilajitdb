# ShilajitDB — Claude Context

## What this is
Transparency database for shilajit supplements. Neutral, editorial tone. Rates products on COA quality, lab credibility, heavy metals safety, manufacturing transparency. No affiliate links, no brand relationships.

## Stack
Next.js 15 App Router · TypeScript · Prisma 6 + PostgreSQL (Supabase) · Tailwind CSS · Vercel

## Architecture
- `app/` — all routes (no Pages Router)
- `app/learn/[slug]/` — 27 static editorial articles
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
- New learn articles (Jul 2026): added `/learn/shilajit-benefits-for-men` and `/learn/shilajit-benefits-for-women` from SEO keyword briefs (27.1k/mo and 14.8k/mo volume respectively). Skipped the briefs for "what is shilajit," "shilajit benefits," and "how to take shilajit" since those are already covered by existing articles (`what-is-shilajit`, `shilajit-benefits`, and the `best-time-to-take-shilajit`/`shilajit-dosing-timeline`/`shilajit-clinical-dosage` cluster) — check `app/learn/` before writing new briefs to avoid duplicating an existing slug/topic.
- Title dedup fix (Jul 2026): `/shilajit-comparison`, `/brand/[slug]/lab-tests`, `/product/[slug]/lab-results`, `/compare/[pair]` hardcoded `| ShilajitDB` in their title string on top of the root layout's `title.template: "%s | ShilajitDB"`, producing `"... | ShilajitDB | ShilajitDB"` in search results (visible in GA4 page-title report). Fixed by dropping the suffix from `title` (template adds it) and moving it to `openGraph.title` only (OG tags don't use the template).
- robots.txt (Jul 2026): allowed `ChatGPT-User` (OpenAI's live-browsing agent) through; kept `GPTBot` + other bulk training crawlers (`CCBot`, `anthropic-ai`, `Claude-Web`, `Bytespider`, `Diffbot`, `ImagesiftBot`, `YouBot`) disallowed. Rationale: chatgpt.com/ai-assistant is ~64% of site traffic (GA4, Jun 11–Jul 8 2026) — allow the user-triggered fetch bot, keep the training crawler blocked.
- GA4 landing-page analysis (Jul 2026): pulled landing page × session source/medium filtered to `*ai-assistant*` medium (chatgpt.com, claude.ai, gemini.google.com), Jun 11–Jul 8. Finding: `/best/best-third-party-tested` is the dominant AI-citation page — 93 of its ~97 total active users this period came via AI-assistant referral (nearly all its traffic), vs. only ~19% for the homepage. `/shilajit-comparison` is a distant second (36 sessions).
- FAQ + FAQPage schema expansion (Jul 2026): added to the remaining 9 of 10 `/best/[tag]` pages (`best_third_party_tested` first, given the finding above, then `best_resin`, `best_capsules`, `best_tested`, `best_value`, `editors_pick`, `best_for_men`, `best_for_women`, `best_himalayan_shilajit`). Only `best_gummies` had FAQ before this round; `/shilajit-comparison`'s existing 6-question FAQ was left as-is.
- Note: the OWOX BI data-mart MCP connector available in this dev environment is linked to **Purblack's** (a brand reviewed on the site) Shopify analytics account, not ShilajitDB's own GA4 property — do not use it for ShilajitDB traffic analysis; pull GA4 data via manual CSV export instead.
- GSC status (Jul 2026): 15 5xx (down from 19, Started validation), 6 404s (Started, unchanged), 178 discovered-not-indexed (down from 259, Started), 85 noindex (up from 52 — expected: filtered homepage URL combos + thin products/compare pairs), 32 blocked-by-robots.txt (expected: `/admin/` + OG image routes), 25 alternate-page-with-canonical (expected: homepage filter/pagination URLs self-canonicalizing to `/`), 14 crawled-currently-not-indexed, 1 page-with-redirect.
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
- SEO improvements (Jun 2026): rewrote titles/descriptions for `/shilajit-comparison`, `/learn/how-to-read-shilajit-coa`, and brand lab-tests template; fixed product page title template (deduplicate brand name prefix, buyer-focused description); added `review`+`reviewRating` schema to all graded product pages; expanded `/learn/shilajit-forms-compared` with bioavailability content, resin vs capsules table, and FAQ; added FAQ + FAQPage schema to `/best/best-gummies`; added internal links to under-linked learn articles
- Admin route `/api/admin-tmp-evidence-audit` exists (not yet run) — counts canonical products below 2-evidence threshold, broken down by COA status. Delete after use.
- GSC status (Jun 2026): 19 5xx errors (all OG image URLs, fix deployed — needs Validate Fix in GSC); 6 404s (old learn/ redirects live — needs Validate Fix in GSC); 52 noindex pages (expected: thin products + filtered homepage URLs); 259 discovered-not-indexed (validation started); impressions accelerating fast (50/day → 390/day in one month)

## Do not re-litigate
- Why no affiliate links (editorial independence is the value prop)
- Prisma must be in `serverExternalPackages` — native engine deadlocks if bundled
- `quirky-hamilton` branch has automation + old frontend code; not merged due to conflict risk
- Citation text color: `#8892B8` (was too dark at `#4A5070`, fixed May 2026)
- Homepage must stay `force-dynamic` — searchParams for filters/sort/pagination
- Local dev server (`npm run dev`) cannot start in the Claude Code sandbox — the `predev` script's `tsx scripts/checkPrisma.ts` fails with `tsx: command not found` because `node_modules/.bin` isn't on PATH in spawned shells, even with the sandbox disabled (confirmed Jul 2026). Not fixable from this environment — verify code changes by reading files directly, not via browser preview.
