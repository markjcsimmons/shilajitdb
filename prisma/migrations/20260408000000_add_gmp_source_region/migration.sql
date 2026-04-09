-- Add GMP certified flag and source region to Product
ALTER TABLE "Product" ADD COLUMN "gmpCertified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "sourceRegion" TEXT;
