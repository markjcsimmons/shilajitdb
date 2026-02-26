/**
 * Canonicalize URLs for deterministic matching (e.g. official product URLs).
 * - Lowercase hostname
 * - Remove utm_* query params
 * - Remove trailing slash
 * - Remove fragment (#...)
 * - Normalize http → https
 */
export function canonicalizeUrl(url: string): string {
  const s = String(url ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    u.protocol = "https:";
    u.hostname = u.hostname.toLowerCase();
    u.hash = "";
    const searchParams = u.searchParams;
    const toDelete: string[] = [];
    searchParams.forEach((_, key) => {
      if (key.toLowerCase().startsWith("utm_")) toDelete.push(key);
    });
    toDelete.forEach((key) => searchParams.delete(key));
    u.search = searchParams.toString();
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    u.pathname = pathname;
    return u.toString();
  } catch {
    return s;
  }
}

/**
 * Return hostname only (lowercase).
 */
export function extractDomain(url: string): string {
  const s = String(url ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}
