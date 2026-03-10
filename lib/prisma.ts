/**
 * Canonical Prisma client singleton for Next.js App Router.
 *
 * Rules:
 *  - ONE PrismaClient instance per Node.js process.
 *  - In development, cache on globalThis so Next.js hot-module reload
 *    does not create a new instance (and open a new connection) on every
 *    file change.
 *  - Never import from "@prisma/client" directly in app code — always
 *    import { prisma } from "@/lib/prisma" (or "@/lib/db" which re-exports
 *    this).
 *
 * Why this file exists:
 *  @prisma/client ships a native N-API addon (.node file) for its query
 *  engine. Native addons cannot be bundled by Turbopack/webpack — they must
 *  be loaded by Node.js require() directly. next.config.ts marks
 *  @prisma/client as a serverExternalPackage so the bundler skips it.
 */

// lib/prisma.ts — re-exports the singleton from lib/db.ts.
// Exists so health-check routes and new code can import from either path.
export { prisma, prisma as default } from "./db";
