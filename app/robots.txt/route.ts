import { absoluteUrl } from "@/lib/site";

// Served as a route rather than app/robots.ts because Next's MetadataRoute.Robots can't emit
// Content-Signal lines (https://contentsignals.org). Written in code rather than via Cloudflare's
// managed robots.txt, which also prepends Disallow rules for AI crawlers we allow.
export const dynamic = "force-static";

const DISALLOW = ["/admin/", "/honeypot", "/opengraph-image", "/*/opengraph-image", "/cdn-cgi/"];

// Search, AI answers and model training are all allowed (user decision, Sep 2026).
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

// Explicitly allow AI search/retrieval agents and model crawlers so assistants can fetch and
// cite the database. Keep in sync with BLOCKED_USER_AGENTS in middleware.ts and Cloudflare bot settings.
const AI_AGENTS = [
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
];

// Bulk-dataset and scraper crawlers (Common Crawl is redistributed freely)
const BLOCKED = ["CCBot", "Bytespider", "Diffbot", "ImagesiftBot", "YouBot"];

const group = (agents: string[], lines: string[]) =>
  [...agents.map((a) => `User-Agent: ${a}`), ...lines].join("\n");

const allowed = [`Content-Signal: ${CONTENT_SIGNAL}`, "Allow: /", ...DISALLOW.map((p) => `Disallow: ${p}`)];

export function GET() {
  const body = [
    group(["*"], allowed),
    group(AI_AGENTS, allowed),
    group(BLOCKED, ["Disallow: /"]),
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ].join("\n\n");
  return new Response(body + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
