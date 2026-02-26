-- Add canonical official URL fields to Product for deterministic matching.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "officialCanonicalUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "officialDomain" TEXT;

CREATE INDEX IF NOT EXISTS "Product_officialDomain_idx" ON "Product"("officialDomain");
