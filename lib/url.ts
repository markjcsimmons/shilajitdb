export function deriveWebsiteDomain(website: string | null | undefined) {
  const raw = (website ?? "").trim();
  if (!raw) return null;
  try {
    const withScheme = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const u = new URL(withScheme);
    const host = u.hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

