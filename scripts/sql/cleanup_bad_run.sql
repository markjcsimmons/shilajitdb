-- ============================================================
-- cleanup_bad_run.sql
-- ============================================================
-- Removes junk Products created by the bad pipeline run that:
--   • produced thousands of "Unknown Brand Shilajit" placeholders
--   • imported non-shilajit products from brand sitemaps
--
-- WHAT THIS SCRIPT DOES
-- 1. Previews (SELECT COUNT) everything before touching a single row.
-- 2. Moves Listings from junk products to their domain's Quarantine product
--    (slug "quarantine-{domain}") so discovered URLs are NOT lost.
--    If no quarantine product exists for a domain, the listing is deleted.
-- 3. Deletes Evidence and MergeCandidates for junk products.
-- 4. Deletes the junk Products.
--
-- SAFETY RULES
-- Only targets Products where ALL of:
--   • dataCompleteness = 'LOW'
--   • sourceDsldLabelId IS NULL  (not from a verified DSLD label)
--   • zero Evidence rows         (no transparency data)
--
-- NEVER deletes products that have:
--   • any Evidence rows
--   • a DSLD label source
--   • dataCompleteness != 'LOW'
--
-- HOW TO RUN
-- 1. Take a database backup FIRST:
--      pg_dump $DATABASE_URL > backup_before_cleanup_$(date +%Y%m%d).sql
-- 2. Open a psql session:
--      psql $DATABASE_URL
-- 3. Run this file (psql REPL):
--      \i scripts/sql/cleanup_bad_run.sql
-- 4. Review ALL preview counts printed before any DELETE.
-- 5. If counts look correct, uncomment COMMIT at the bottom and re-run,
--    OR type COMMIT; at the psql prompt.
-- 6. If anything looks wrong, type ROLLBACK; at the psql prompt.
-- ============================================================

BEGIN;

-- ── Step 0: Full preview BEFORE any write ───────────────────────────────────

\echo ''
\echo '=== PREVIEW — NO ROWS DELETED YET ==='
\echo ''

SELECT
  'OLD-STYLE placeholders  (name = ''Unknown Brand Shilajit'')' AS category,
  COUNT(*) AS products_to_delete
FROM "Product" p
WHERE
  p.name = 'Unknown Brand Shilajit'
  AND p."dataCompleteness" = 'LOW'
  AND p."sourceDsldLabelId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id);

SELECT
  'NEW-STYLE domain placeholders  (name ILIKE ''Unknown (%'')' AS category,
  COUNT(*) AS products_to_delete
FROM "Product" p
WHERE
  p.name ILIKE 'Unknown (%'
  AND p."dataCompleteness" = 'LOW'
  AND p."sourceDsldLabelId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id);

SELECT
  'NON-SHILAJIT products  (name has no shilajit term, LOW completeness, no evidence)' AS category,
  COUNT(*) AS products_to_delete
FROM "Product" p
WHERE
  p."dataCompleteness" = 'LOW'
  AND p."sourceDsldLabelId" IS NULL
  AND p.name NOT ILIKE '%shilajit%'
  AND p.name NOT ILIKE '%shilajeet%'
  AND p.name NOT ILIKE '%mumio%'
  AND p.name NOT ILIKE '%mumijo%'
  AND p.name NOT ILIKE '%mineral-pitch%'
  AND p.name NOT ILIKE '%fulvic%'
  AND p.name NOT ILIKE '%asphaltum%'
  AND p.name NOT ILIKE '%humic%'
  AND p.name NOT ILIKE '%live-resin%'
  AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id);

-- ── Step 1: Collect target product IDs ──────────────────────────────────────

CREATE TEMP TABLE _junk_products AS

  -- 1a. Old-style "Unknown Brand Shilajit" placeholders
  SELECT p.id, 'unknown-brand-shilajit' AS reason
  FROM "Product" p
  WHERE
    p.name = 'Unknown Brand Shilajit'
    AND p."dataCompleteness" = 'LOW'
    AND p."sourceDsldLabelId" IS NULL
    AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id)

  UNION

  -- 1b. New-style "Unknown (domain.com)" placeholders
  SELECT p.id, 'unknown-domain-placeholder' AS reason
  FROM "Product" p
  WHERE
    p.name ILIKE 'Unknown (%'
    AND p."dataCompleteness" = 'LOW'
    AND p."sourceDsldLabelId" IS NULL
    AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id)

  UNION

  -- 1c. Non-shilajit products ingested by mistake from brand sitemaps
  SELECT p.id, 'non-shilajit-sitemap-product' AS reason
  FROM "Product" p
  WHERE
    p."dataCompleteness" = 'LOW'
    AND p."sourceDsldLabelId" IS NULL
    AND p.name NOT ILIKE '%shilajit%'
    AND p.name NOT ILIKE '%shilajeet%'
    AND p.name NOT ILIKE '%mumio%'
    AND p.name NOT ILIKE '%mumijo%'
    AND p.name NOT ILIKE '%mineral-pitch%'
    AND p.name NOT ILIKE '%fulvic%'
    AND p.name NOT ILIKE '%asphaltum%'
    AND p.name NOT ILIKE '%humic%'
    AND p.name NOT ILIKE '%live-resin%'
    AND NOT EXISTS (SELECT 1 FROM "Evidence" e WHERE e."productId" = p.id);

\echo ''
\echo '=== SCOPE BY REASON ==='
SELECT reason, COUNT(*) AS count FROM _junk_products GROUP BY reason ORDER BY reason;

-- ── Step 2: Preview Listings that will be affected ──────────────────────────

\echo ''
\echo '=== LISTINGS ATTACHED TO JUNK PRODUCTS ==='

SELECT
  'Listings on junk products' AS category,
  COUNT(*) AS listing_count
FROM "Listing" l
WHERE l."productId" IN (SELECT id FROM _junk_products);

-- Show how many of those have a quarantine product they can be moved to.
SELECT
  'Listings moveable to domain quarantine product' AS category,
  COUNT(*) AS listing_count
FROM "Listing" l
JOIN "Product" src ON src.id = l."productId"
WHERE
  l."productId" IN (SELECT id FROM _junk_products)
  -- A quarantine product exists for this domain
  AND EXISTS (
    SELECT 1 FROM "Product" q
    WHERE q.slug = 'quarantine-' || REPLACE(REPLACE(LOWER(
      COALESCE(src."officialDomain",
               REGEXP_REPLACE(l.url, '^https?://([^/]+).*', '\1'))
    ), '.', '-'), 'www-', '')
  );

SELECT
  'Listings that will be DELETED (no quarantine product for their domain)' AS category,
  COUNT(*) AS listing_count
FROM "Listing" l
JOIN "Product" src ON src.id = l."productId"
WHERE
  l."productId" IN (SELECT id FROM _junk_products)
  AND NOT EXISTS (
    SELECT 1 FROM "Product" q
    WHERE q.slug = 'quarantine-' || REPLACE(REPLACE(LOWER(
      COALESCE(src."officialDomain",
               REGEXP_REPLACE(l.url, '^https?://([^/]+).*', '\1'))
    ), '.', '-'), 'www-', '')
  );

\echo ''
\echo '=== IF THE COUNTS ABOVE LOOK WRONG, RUN: ROLLBACK; AND STOP ==='
\echo ''

-- ── Step 3: Move Listings to quarantine products where possible ──────────────

-- Build a mapping: listingId → quarantine productId (for those that exist).
CREATE TEMP TABLE _listing_quarantine_map AS
SELECT
  l.id AS listing_id,
  q.id AS quarantine_product_id
FROM "Listing" l
JOIN "Product" src ON src.id = l."productId"
JOIN "Product" q ON q.slug = 'quarantine-' || REPLACE(REPLACE(LOWER(
    COALESCE(src."officialDomain",
             REGEXP_REPLACE(l.url, '^https?://([^/]+).*', '\1'))
  ), '.', '-'), 'www-', '')
WHERE l."productId" IN (SELECT id FROM _junk_products);

-- Move: reassign productId to the quarantine product.
UPDATE "Listing" l
SET "productId" = m.quarantine_product_id
FROM _listing_quarantine_map m
WHERE l.id = m.listing_id;

-- ── Step 4: Delete remaining Listings (no quarantine product for domain) ─────

DELETE FROM "Listing"
WHERE "productId" IN (SELECT id FROM _junk_products);

-- ── Step 5: Delete MergeCandidates pointing to junk products ─────────────────

DELETE FROM "MergeCandidate"
WHERE "candidateProductId" IN (SELECT id FROM _junk_products);

-- ── Step 6: Delete Evidence (defensive; filter already ensures 0 rows) ───────

DELETE FROM "Evidence"
WHERE "productId" IN (SELECT id FROM _junk_products);

-- ── Step 7: Delete the junk Products ─────────────────────────────────────────

DELETE FROM "Product"
WHERE id IN (SELECT id FROM _junk_products);

-- ── Step 8: Final summary ─────────────────────────────────────────────────────

\echo ''
\echo '=== DELETION SUMMARY ==='

SELECT
  'Products deleted' AS label,
  COUNT(*) AS count
FROM _junk_products;

-- ── Step 9: COMMIT or ROLLBACK ────────────────────────────────────────────────
--
-- Review the output above.
-- If everything looks correct, run:  COMMIT;
-- If anything looks wrong, run:      ROLLBACK;
--
-- Uncomment ONE of the lines below to auto-commit/rollback:
-- COMMIT;
-- ROLLBACK;
