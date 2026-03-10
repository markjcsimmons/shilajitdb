-- Add two new job types for DSLD label image OCR discovery and sitemap harvesting.
-- PostgreSQL: ADD VALUE is not transactional; run outside a transaction block.
ALTER TYPE "JobType" ADD VALUE IF NOT EXISTS 'DISCOVER_OFFICIAL_FROM_DSLD_IMAGES';
ALTER TYPE "JobType" ADD VALUE IF NOT EXISTS 'DISCOVER_OFFICIAL_FROM_SITEMAPS';
