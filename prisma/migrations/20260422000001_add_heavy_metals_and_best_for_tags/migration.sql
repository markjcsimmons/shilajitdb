-- CreateEnum
CREATE TYPE "HeavyMetalsTested" AS ENUM ('CONFIRMED', 'CLAIMED', 'NONE');

-- Convert existing varchar heavyMetalsTested to the new enum
ALTER TABLE "Product"
  ALTER COLUMN "heavyMetalsTested" TYPE "HeavyMetalsTested"
  USING CASE
    WHEN "heavyMetalsTested" = 'CONFIRMED' THEN 'CONFIRMED'::"HeavyMetalsTested"
    WHEN "heavyMetalsTested" = 'CLAIMED'   THEN 'CLAIMED'::"HeavyMetalsTested"
    WHEN "heavyMetalsTested" = 'NONE'      THEN 'NONE'::"HeavyMetalsTested"
    ELSE NULL
  END;

-- Add bestForTags
ALTER TABLE "Product" ADD COLUMN "bestForTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
