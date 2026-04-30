import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/honeypot"],
      },
      // Block AI training crawlers
      {
        userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "Claude-Web", "Bytespider", "Diffbot", "ImagesiftBot", "YouBot"],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
