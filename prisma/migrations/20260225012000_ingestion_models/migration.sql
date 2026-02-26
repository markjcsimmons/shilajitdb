-- CreateEnum
CREATE TYPE "DataCompleteness" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IngestionRunType" AS ENUM ('DSLD', 'BRAND_CRAWL', 'DISCOVERY', 'REFRESH');

-- CreateEnum
CREATE TYPE "IngestionRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "websiteDomain" TEXT;

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "sourceDsldLabelId" TEXT,
ADD COLUMN "sourceDsldUrl" TEXT,
ADD COLUMN "dataCompleteness" "DataCompleteness" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "Evidence"
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "hash" TEXT;

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "type" "IngestionRunType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "IngestionRunStatus" NOT NULL DEFAULT 'RUNNING',
    "statsJson" JSONB,
    "errorText" TEXT,
    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sourceDsldLabelId_key" ON "Product"("sourceDsldLabelId");

