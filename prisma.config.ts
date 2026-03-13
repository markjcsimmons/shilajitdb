import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load .env from same directory as this config file (project root) so Prisma sees DATABASE_URL
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});

