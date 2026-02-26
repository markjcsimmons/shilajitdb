import { getRobotsRulesForDomain, isUrlAllowedByRobots } from "@/scripts/ingest/web/robots";

export type RobotsDecision = { allowed: boolean; reason: string };

export async function isAllowedByRobots(url: string): Promise<RobotsDecision> {
  try {
    const u = new URL(url);
    const domain = u.hostname;
    const rules = await getRobotsRulesForDomain(domain);
    const allowed = await isUrlAllowedByRobots(url, rules);
    return { allowed, reason: allowed ? "allowed" : "disallowed" };
  } catch {
    // If URL is malformed or robots fetch fails, be conservative.
    return { allowed: false, reason: "robots-check-failed" };
  }
}

