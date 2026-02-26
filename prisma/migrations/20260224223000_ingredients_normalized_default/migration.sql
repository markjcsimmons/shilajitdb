-- Ensure scalar list defaults are non-null
UPDATE "Product"
SET "ingredientsNormalized" = ARRAY[]::TEXT[]
WHERE "ingredientsNormalized" IS NULL;

ALTER TABLE "Product"
ALTER COLUMN "ingredientsNormalized" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Product"
ALTER COLUMN "ingredientsNormalized" SET NOT NULL;

