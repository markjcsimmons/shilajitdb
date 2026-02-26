import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";
import { fetchJsonWithRetry } from "@/scripts/ingest/shared/http";

const DEFAULT_BASE = "https://dsld-dev-api.app.cloud.gov/api/v9";

export type DsldClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  cacheNamespace?: string;
  timeoutMs?: number;
};

export class DsldClient {
  private baseUrl: string;
  private apiKey?: string;
  private cacheNamespace: string;
  private timeoutMs: number;

  constructor(opts: DsldClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? process.env.DSLD_API_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
    this.apiKey = opts.apiKey ?? process.env.DSLD_API_KEY;
    this.cacheNamespace = opts.cacheNamespace ?? "dsld";
    this.timeoutMs = opts.timeoutMs ?? Number(process.env.DSLD_API_TIMEOUT_MS ?? 60000);
  }

  private withKey(url: string) {
    if (!this.apiKey) return url;
    const u = new URL(url);
    if (!u.searchParams.get("api_key")) u.searchParams.set("api_key", this.apiKey);
    return u.toString();
  }

  async searchFilter(params: { q: string; from?: number; size?: number }) {
    const u = new URL(`${this.baseUrl}/search-filter`);
    u.searchParams.set("q", params.q);
    if (params.from !== undefined) u.searchParams.set("from", String(params.from));
    if (params.size !== undefined) u.searchParams.set("size", String(params.size));
    const url = this.withKey(u.toString());
    const cached = await getCachedJson<unknown>(this.cacheNamespace, url);
    if (cached) return cached;
    const json = await fetchJsonWithRetry<unknown>(url, { retries: 5, timeoutMs: this.timeoutMs });
    await setCachedJson(this.cacheNamespace, url, json);
    return json;
  }

  async getLabel(dsldId: string | number) {
    const url = this.withKey(`${this.baseUrl}/label/${dsldId}`);
    const cached = await getCachedJson<unknown>(this.cacheNamespace, url);
    if (cached) return cached;
    const json = await fetchJsonWithRetry<unknown>(url, { retries: 5, timeoutMs: this.timeoutMs });
    await setCachedJson(this.cacheNamespace, url, json);
    return json;
  }
}

