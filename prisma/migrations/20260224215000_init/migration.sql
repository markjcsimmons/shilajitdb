-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductForm" AS ENUM ('RESIN', 'CAPSULE', 'POWDER', 'GUMMY', 'LIQUID', 'BLEND', 'OTHER');

-- CreateEnum
CREATE TYPE "ManufacturingClarity" AS ENUM ('CLEAR', 'AMBIGUOUS', 'NOT_STATED');

-- CreateEnum
CREATE TYPE "CoaStatus" AS ENUM ('PUBLIC', 'REQUEST_ONLY', 'NONE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TransparencyGrade" AS ENUM ('F', 'D', 'C', 'B', 'A');

-- CreateEnum
CREATE TYPE "QualityTier" AS ENUM ('POOR', 'AVERAGE', 'PREMIUM', 'ULTRA_PREMIUM');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('COA', 'MANUFACTURING', 'INGREDIENTS', 'TESTING', 'OTHER');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "form" "ProductForm" NOT NULL,
    "ingredientText" TEXT NOT NULL,
    "ingredientsNormalized" TEXT[],
    "manufacturingCountryClaim" TEXT,
    "manufacturingClarity" "ManufacturingClarity" NOT NULL,
    "manufacturingClaimText" TEXT,
    "manufacturingEvidenceUrl" TEXT,
    "coaStatus" "CoaStatus" NOT NULL,
    "coaUrl" TEXT,
    "transparencyGrade" "TransparencyGrade" NOT NULL,
    "qualityTier" "QualityTier" NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "url" TEXT NOT NULL,
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Evidence_productId_idx" ON "Evidence"("productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

