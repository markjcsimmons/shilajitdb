-- Drop automation/pipeline tables and their enums

DROP TABLE IF EXISTS "JobRun" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "IngestionRun" CASCADE;
DROP TABLE IF EXISTS "MergeCandidate" CASCADE;
DROP TABLE IF EXISTS "BrandCompany" CASCADE;
DROP TABLE IF EXISTS "CompanyEntity" CASCADE;
DROP TABLE IF EXISTS "BrandAlias" CASCADE;

DROP TYPE IF EXISTS "JobType";
DROP TYPE IF EXISTS "JobStatus";
DROP TYPE IF EXISTS "IngestionRunType";
DROP TYPE IF EXISTS "IngestionRunStatus";
DROP TYPE IF EXISTS "MergeCandidateStatus";
DROP TYPE IF EXISTS "CompanyRole";

-- Remove relation columns from Brand that pointed to dropped tables
-- (aliases and companies relations are gone; no column changes needed on Brand itself)
