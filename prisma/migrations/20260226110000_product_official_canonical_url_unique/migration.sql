-- Ensure a canonical official URL can only be assigned to ONE product.
-- PostgreSQL UNIQUE allows multiple NULLs; only non-null values must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS "Product_officialCanonicalUrl_key" ON "Product"("officialCanonicalUrl");
