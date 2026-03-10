-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isCanonical" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_isCanonical_idx" ON "Product"("isCanonical");
