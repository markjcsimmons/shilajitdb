export class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.available = Math.max(1, concurrency);
  }

  async acquire() {
    if (this.available > 0) {
      this.available -= 1;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.available -= 1;
  }

  release() {
    this.available += 1;
    const next = this.queue.shift();
    if (next) next();
  }
}

export class DomainRateLimiter {
  private perDomainIntervalMs: number;
  private lastByDomain = new Map<string, number>();

  constructor(perDomainIntervalMs: number) {
    this.perDomainIntervalMs = perDomainIntervalMs;
  }

  async wait(domain: string) {
    const now = Date.now();
    const last = this.lastByDomain.get(domain) ?? 0;
    const delta = now - last;
    if (delta < this.perDomainIntervalMs) {
      await new Promise((r) => setTimeout(r, this.perDomainIntervalMs - delta));
    }
    this.lastByDomain.set(domain, Date.now());
  }
}

