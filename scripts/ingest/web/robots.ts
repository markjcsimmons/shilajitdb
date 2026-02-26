import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";
import { fetchTextWithRetry } from "@/scripts/ingest/shared/http";

type RobotsRule = { type: "allow" | "disallow"; path: string };

function normalizePath(p: string) {
  if (!p.startsWith("/")) return `/${p}`;
  return p;
}

function parseRobotsTxt(text: string): RobotsRule[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.split("#")[0].trim())
    .filter(Boolean);

  const rules: RobotsRule[] = [];
  let applies = false;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase().includes("shilajittransparency");
      continue;
    }
    if (!applies) continue;
    if (key === "disallow") {
      if (!value) continue;
      rules.push({ type: "disallow", path: normalizePath(value) });
    }
    if (key === "allow") {
      if (!value) continue;
      rules.push({ type: "allow", path: normalizePath(value) });
    }
  }

  // Longest match wins; allow overrides disallow at same length.
  return rules;
}

function isAllowedPath(pathname: string, rules: RobotsRule[]) {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  let best: RobotsRule | null = null;
  for (const r of rules) {
    if (p.startsWith(r.path)) {
      if (!best) best = r;
      else if (r.path.length > best.path.length) best = r;
      else if (r.path.length === best.path.length && r.type === "allow") best = r;
    }
  }
  if (!best) return true;
  return best.type === "allow";
}

export async function getRobotsRulesForDomain(domain: string): Promise<RobotsRule[] | null> {
  const url = `https://${domain}/robots.txt`;
  const cached = await getCachedJson<{ rules: RobotsRule[] }>("robots", url);
  if (cached?.rules) return cached.rules;
  try {
    const text = await fetchTextWithRetry(url, { retries: 2, timeoutMs: 12000 });
    const rules = parseRobotsTxt(text);
    await setCachedJson("robots", url, { rules });
    return rules;
  } catch {
    await setCachedJson("robots", url, { rules: [] });
    return [];
  }
}

export async function isUrlAllowedByRobots(url: string, rules: RobotsRule[] | null) {
  if (!rules) return true;
  try {
    const u = new URL(url);
    return isAllowedPath(u.pathname, rules);
  } catch {
    return false;
  }
}

