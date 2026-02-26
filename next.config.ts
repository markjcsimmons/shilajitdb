import type { NextConfig } from "next";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure env vars load even if Next.js infers workspace root incorrectly.
dotenv.config({ path: path.join(__dirname, ".env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

