/**
 * Record 20260905192253_add_listing_is_affiliate in _prisma_migrations.
 *
 * The column was added to the live database on 2026-09-05 with $executeRawUnsafe (prisma migrate
 * hangs on the pgbouncer pooler) but the migration was never recorded, so `prisma migrate deploy`
 * would try to re-run the ALTER TABLE and fail on the existing column. This only inserts the
 * history row — it runs no DDL — and refuses to do so unless the column already matches the
 * migration.
 *
 * Idempotent: exits early if the migration is already recorded.
 *
 *   ./node_modules/.bin/tsx scripts/record-affiliate-migration.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

const prisma = new PrismaClient();
const MIGRATION = "20260905192253_add_listing_is_affiliate";

async function main() {
  const sql = readFileSync(`prisma/migrations/${MIGRATION}/migration.sql`, "utf8");

  const recorded = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
    `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
    MIGRATION,
  );
  if (recorded.length > 0) {
    console.log(`Already recorded: ${MIGRATION}`);
    return;
  }

  const column = await prisma.$queryRawUnsafe<{ data_type: string; is_nullable: string; column_default: string | null }[]>(
    `SELECT data_type, is_nullable, column_default FROM information_schema.columns
     WHERE table_name = 'Listing' AND column_name = 'isAffiliate'`,
  );
  const c = column[0];
  if (!c || c.data_type !== "boolean" || c.is_nullable !== "NO" || c.column_default !== "false") {
    throw new Error(`Listing.isAffiliate doesn't match the migration: ${JSON.stringify(c ?? null)}`);
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations"
       (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
    randomUUID(),
    createHash("sha256").update(sql).digest("hex"),
    MIGRATION,
  );
  console.log(`Recorded ${MIGRATION} in _prisma_migrations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
