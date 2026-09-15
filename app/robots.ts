import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const DISALLOW = ["/admin/", "/honeypot", "/opengraph-image", "/*/opengraph-image", "/cdn-cgi/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // Explicitly allow AI search/retrieval agents and model crawlers so
      // assistants can fetch and cite the database. Keep in sync with the
      // BLOCKED_USER_AGENTS list in middleware.ts and Cloudflare bot settings.
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "Claude-SearchBot",
          "Claude-User",
          "ClaudeBot",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: DISALLOW,
      },
      // Block bulk-dataset and scraper crawlers (Common Crawl is redistributed freely)
      {
        userAgent: ["CCBot", "Bytespider", "Diffbot", "ImagesiftBot", "YouBot"],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
