import { NextRequest, NextResponse } from "next/server";

const BLOCKED_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "Bytespider",
  "Diffbot",
  "ImagesiftBot",
  "YouBot",
  "DataForSeoBot",
  "PetalBot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
];

// Simple in-memory rate limiter (per cold-start instance)
// For distributed rate limiting across serverless instances, configure Upstash below.
const ipHits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.reset) {
    ipHits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  // Canonical domain enforcement: www → non-www (301 permanent)
  // Canonical tags and sitemap point to shilajitdb.com (non-www).
  // Any request arriving on www.shilajitdb.com is redirected so Google
  // sees only one version and link equity is not split.
  if (hostname.startsWith("www.")) {
    const nonWwwHost = hostname.slice(4); // strip "www."
    const url = `https://${nonWwwHost}${pathname}${search}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // Honeypot trap — any request to /honeypot gets a 404 and we can log the IP
  if (pathname.startsWith("/honeypot")) {
    return new NextResponse(null, { status: 404 });
  }

  // Block known AI/scraper crawlers
  const ua = req.headers.get("user-agent") ?? "";
  const blocked = BLOCKED_USER_AGENTS.some((bot) =>
    ua.toLowerCase().includes(bot.toLowerCase())
  );
  if (blocked) {
    return new NextResponse("Access denied", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Rate limiting on API and page routes
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Content-Type": "text/plain",
        "Retry-After": "60",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except: Next.js internals, static files, images.
     * Keep /admin in scope so rate limiting applies there too.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)).*)",
  ],
};
