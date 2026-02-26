-- Extend ListingSource enum with additional sources.
DO $$ BEGIN
  ALTER TYPE "ListingSource" ADD VALUE IF NOT EXISTS 'IHERB';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ListingSource" ADD VALUE IF NOT EXISTS 'GOOGLE_SHOPPING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ListingSource" ADD VALUE IF NOT EXISTS 'MANUAL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create MergeCandidateStatus enum.
DO $$ BEGIN
  CREATE TYPE "MergeCandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create MergeCandidate table.
CREATE TABLE IF NOT EXISTS "MergeCandidate" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "candidateProductId" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "MergeCandidateStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MergeCandidate_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "MergeCandidate"
    ADD CONSTRAINT "MergeCandidate_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "MergeCandidate"
    ADD CONSTRAINT "MergeCandidate_candidateProductId_fkey"
    FOREIGN KEY ("candidateProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX "MergeCandidate_listingId_candidateProductId_key"
    ON "MergeCandidate"("listingId", "candidateProductId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "MergeCandidate_listingId_idx" ON "MergeCandidate"("listingId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "MergeCandidate_candidateProductId_idx" ON "MergeCandidate"("candidateProductId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "MergeCandidate_status_idx" ON "MergeCandidate"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

