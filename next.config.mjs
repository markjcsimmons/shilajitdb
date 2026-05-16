/**
 * Next.js config — Prisma engine must NEVER be bundled.
 *
 * The native query engine (.node / N-API) deadlocks when bundled by
 * Turbopack or Webpack. We externalize Prisma via multiple mechanisms
 * so it loads only via Node.js require() at runtime.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// DEV-ONLY: verify this config is actually loaded.
if (process.env.NODE_ENV !== "production") {
  console.log("[next.config] loaded; externalizing prisma");
}

const PRISMA_PACKAGES = ["@prisma/client", ".prisma/client", "@prisma/engines", "prisma"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

  async redirects() {
    return [
      // Sunmed product slug changed after rename
      {
        source: "/product/sunmed-rachaels-story",
        destination: "/product/sunmed-shilajit-gummies",
        permanent: true,
      },
      // Underscore variant of best-resin (wrong URL format)
      {
        source: "/best/best_resin",
        destination: "/best/best-resin",
        permanent: true,
      },
    ];
  },

  // Server components / route handlers — Prisma must never be bundled
  serverExternalPackages: PRISMA_PACKAGES,

  // Belt-and-suspenders: webpack externals so Prisma is never bundled
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@prisma/client": "commonjs @prisma/client",
        ".prisma/client": "commonjs .prisma/client",
        "@prisma/engines": "commonjs @prisma/engines",
        prisma: "commonjs prisma",
      });
    }
    return config;
  },
};

export default nextConfig;
