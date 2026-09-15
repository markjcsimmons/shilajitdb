/**
 * Apply the COA review field migration to the live database.
 *
 * `prisma migrate dev` hangs against the pgbouncer pooler (no shadow DB / advisory
 * locks), so the DDL is applied with $executeRawUnsafe and recorded in
 * _prisma_migrations by hand — same approach as 20260905192253_add_listing_is_affiliate.
 *
 * Idempotent: exits early if the columns already exist.
 *
 *   ./node_modules/.bin/tsx scripts/apply-coa-migration.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";

const prisma = new PrismaClient();
const MIGRATION = "20260915210000_add_coa_review_fields";
const NEW_COLUMNS = [
  "coaVerified",
  "coaIssuer",
  "coaReportDate",
  "labNamedOnCoa",
  "coaBatchIdentified",
  "heavyMetalsResult",
  "heavyMetalsScope",
  "microbialPanel",
];

async function main() {
  const sql = readFileSync(`prisma/migrations/${MIGRATION}/migration.sql`, "utf8");

  const existing = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Product' AND column_name = ANY($1::text[])`,
    NEW_COLUMNS,
  );
  if (existing.length > 0) {
    console.log("Already applied; columns present:", existing.map((r) => r.column_name).join(", "));
    return;
  }

  // Statements are separated by blank lines: DO $$ ... $$ blocks contain their own
  // semicolons, so splitting on ";" would tear them apart.
  const statements = sql
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
        .replace(/;$/, ""),
    )
    .filter((block) => block.length > 0);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
    console.log("applied:", statement.split("\n")[0].slice(0, 72));
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations"
       (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
    randomUUID(),
    createHash("sha256").update(sql).digest("hex"),
    MIGRATION,
  );

  const after = await prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'Product' AND column_name = ANY($1::text[]) ORDER BY column_name`,
    NEW_COLUMNS,
  );
  console.table(after);
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
