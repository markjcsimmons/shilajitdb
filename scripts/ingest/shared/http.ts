export type FetchRetryOptions = {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  headers?: Record<string, string | undefined>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(ms: number) {
  const delta = Math.round(ms * 0.25);
  return ms + Math.floor(Math.random() * (delta * 2 + 1)) - delta;
}

export async function fetchJsonWithRetry<T>(url: string, opts: FetchRetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 4;
  const minDelayMs = opts.minDelayMs ?? 500;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const timeoutMs = opts.timeoutMs ?? 20000;

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          ...opts.headers,
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} ${body.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      const backoff = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
      await sleep(jitter(backoff));
      attempt += 1;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchTextWithRetry(url: string, opts: FetchRetryOptions = {}): Promise<string> {
  const retries = opts.retries ?? 3;
  const minDelayMs = opts.minDelayMs ?? 500;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const timeoutMs = opts.timeoutMs ?? 20000;

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": "ShilajitTransparencyDatabaseBot/0.1 (+contact via NEXT_PUBLIC_REPORT_EMAIL)",
          ...opts.headers,
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} ${body.slice(0, 200)}`);
      }
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      const backoff = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
      await sleep(jitter(backoff));
      attempt += 1;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

