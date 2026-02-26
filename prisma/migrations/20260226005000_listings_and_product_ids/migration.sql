-- Add enums for marketplace listings.
DO $$ BEGIN
  CREATE TYPE "ListingSource" AS ENUM ('OFFICIAL', 'AMAZON', 'WALMART', 'OTHER_RETAILER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Extend Product with identifiers + variant descriptors.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "gtin" TEXT,
  ADD COLUMN IF NOT EXISTS "mpn" TEXT,
  ADD COLUMN IF NOT EXISTS "brandSku" TEXT,
  ADD COLUMN IF NOT EXISTS "netQuantityText" TEXT,
  ADD COLUMN IF NOT EXISTS "servingsCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "capsuleCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "flavor" TEXT;

-- Uniques + indexes requested by Prisma schema.
DO $$ BEGIN
  CREATE UNIQUE INDEX "Product_gtin_key" ON "Product"("gtin");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "Product_brandSku_idx" ON "Product"("brandSku");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create Listing table.
CREATE TABLE IF NOT EXISTS "Listing" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "source" "ListingSource" NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "seller" TEXT,
  "priceCents" INTEGER,
  "currency" TEXT,
  "inStock" BOOLEAN,
  "shipsToUS" BOOLEAN,
  "observedGtin" TEXT,
  "observedSku" TEXT,
  "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ListingStatus" NOT NULL DEFAULT 'UNKNOWN',
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- Foreign key + unique constraint + indexes.
DO $$ BEGIN
  ALTER TABLE "Listing"
    ADD CONSTRAINT "Listing_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "Listing_url_key" ON "Listing"("url");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "Listing_productId_idx" ON "Listing"("productId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "Listing_source_idx" ON "Listing"("source");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "Listing_observedGtin_idx" ON "Listing"("observedGtin");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

