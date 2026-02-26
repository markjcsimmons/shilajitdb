export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(pathname: string) {
  const base = getSiteUrl();
  if (!pathname.startsWith("/")) return `${base}/${pathname}`;
  return `${base}${pathname}`;
}

