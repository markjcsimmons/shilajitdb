import { DomainRateLimiter, Semaphore } from "@/scripts/ingest/web/rateLimit";

export function createDiscoveryLimiters() {
  const perDomainMs = Math.max(1000, Number(process.env.DISCOVERY_PER_DOMAIN_INTERVAL_MS ?? 1000));
  const globalConcurrency = Math.max(1, Math.min(10, Number(process.env.DISCOVERY_GLOBAL_CONCURRENCY ?? 4)));
  return {
    perDomain: new DomainRateLimiter(perDomainMs),
    global: new Semaphore(globalConcurrency),
  };
}

