-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('UNKNOWN', 'MANUFACTURER', 'DISTRIBUTOR', 'MARKETER', 'PACKAGER', 'RESELLER', 'OTHER');

-- CreateTable
CREATE TABLE "BrandAlias" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "website" TEXT,
    "websiteDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandCompany" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'UNKNOWN',
    "sourceDsldId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandAlias_brandId_alias_key" ON "BrandAlias"("brandId", "alias");

-- CreateIndex
CREATE INDEX "BrandAlias_alias_idx" ON "BrandAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyEntity_normalizedName_key" ON "CompanyEntity"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "BrandCompany_brandId_companyId_role_key" ON "BrandCompany"("brandId", "companyId", "role");

-- CreateIndex
CREATE INDEX "BrandCompany_companyId_idx" ON "BrandCompany"("companyId");

-- AddForeignKey
ALTER TABLE "BrandAlias" ADD CONSTRAINT "BrandAlias_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCompany" ADD CONSTRAINT "BrandCompany_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandCompany" ADD CONSTRAINT "BrandCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

