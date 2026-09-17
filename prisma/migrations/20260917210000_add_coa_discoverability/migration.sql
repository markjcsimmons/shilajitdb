-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CoaDiscoverability" AS ENUM ('PROMINENT', 'BURIED', 'UNLINKED', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "coaDiscoverability" "CoaDiscoverability" NOT NULL DEFAULT 'UNKNOWN';
