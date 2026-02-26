DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'IngestionRunStatus'
      AND e.enumlabel = 'CANCELED'
  ) THEN
    ALTER TYPE "IngestionRunStatus" ADD VALUE 'CANCELED';
  END IF;
END
$$;

ALTER TABLE "IngestionRun" ADD COLUMN "pid" INTEGER;

