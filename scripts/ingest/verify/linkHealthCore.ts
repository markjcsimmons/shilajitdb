import "dotenv/config";

import { prisma } from "@/lib/db";
import type { LinkHealthStats } from "@/scripts/jobs/jobTypes";

const TIMEOUT_MS = 8000;

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      headers: { "user-agent": "ShilajitTransparencyDatabaseBot/0.1" },
      redirect: "follow",
    });
    clearTimeout(t);
    if (res.ok) return { ok: true, status: res.status };
    if (res.status === 405) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), TIMEOUT_MS);
      const res2 = await fetch(url, {
        method: "GET",
        signal: ctrl2.signal,
        headers: { "user-agent": "ShilajitTransparencyDatabaseBot/0.1" },
        redirect: "follow",
      });
      clearTimeout(t2);
      return { ok: res2.ok, status: res2.status };
    }
    return { ok: false, status: res.status };
  } catch {
    return { ok: false };
  }
}

export type CheckLinksOptions = {
  maxToCheck?: number;
};

/**
 * Check Product.coaUrl, Evidence.url, Listing.url. Mark OFFICIAL listings INACTIVE on 404.
 */
export async function checkLinks(opts: CheckLinksOptions = {}): Promise<LinkHealthStats> {
  const max = Math.max(1, opts.maxToCheck ?? 200);
  const stats: LinkHealthStats = {
    checkedCount: 0,
    deadCount: 0,
    inactiveListingsMarked: 0,
    errorsCount: 0,
  };

  const urlsToCheck: Array<{ url: string; kind: "coaUrl" | "evidence" | "listing"; id: string; source?: string }> = [];

  const productsWithCoa = await prisma.product.findMany({
    where: { coaUrl: { not: null } },
    select: { id: true, coaUrl: true },
    take: Math.ceil(max / 3),
  });
  for (const p of productsWithCoa) {
    if (p.coaUrl) urlsToCheck.push({ url: p.coaUrl, kind: "coaUrl", id: p.id });
  }

  const evidence = await prisma.evidence.findMany({
    where: { type: { in: ["COA", "MANUFACTURING", "INGREDIENTS"] } },
    select: { id: true, url: true },
    take: Math.ceil(max / 3),
  });
  for (const e of evidence) {
    urlsToCheck.push({ url: e.url, kind: "evidence", id: e.id });
  }

  const listings = await prisma.listing.findMany({
    select: { id: true, url: true, source: true },
    take: Math.ceil(max / 3),
  });
  for (const l of listings) {
    urlsToCheck.push({ url: l.url, kind: "listing", id: l.id, source: l.source });
  }

  const toCheck = urlsToCheck.slice(0, max);

  for (const { url, kind, id, source } of toCheck) {
    stats.checkedCount += 1;
    const result = await checkUrl(url);
    if (!result.ok) {
      stats.deadCount += 1;
      if (kind === "listing" && source === "OFFICIAL" && result.status === 404) {
        try {
          await prisma.listing.update({
            where: { id },
            data: { status: "INACTIVE" },
            select: { id: true },
          });
          stats.inactiveListingsMarked += 1;
        } catch {
          stats.errorsCount += 1;
        }
      }
    }
  }

  return stats;
}
