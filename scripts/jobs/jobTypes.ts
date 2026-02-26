import type { JobStatus, JobType } from "@prisma/client";

export type { JobStatus, JobType };

export const JOB_TYPES = ["ENRICH_OFFICIAL", "LINK_HEALTH", "DISCOVERY_ROBOTS_ALLOWED"] as const;
export type JobTypeValue = (typeof JOB_TYPES)[number];

export function isJobType(s: string): s is JobTypeValue {
  return JOB_TYPES.includes(s as JobTypeValue);
}

export type EnrichOfficialStats = {
  productsProcessed: number;
  evidenceAdded: number;
  coaPublicFound: number;
  manufacturingClearFound: number;
  errorsCount: number;
};

export type LinkHealthStats = {
  checkedCount: number;
  deadCount: number;
  inactiveListingsMarked: number;
  errorsCount: number;
};

export type DiscoveryRobotsAllowedStats = {
  urlsDiscovered: number;
  listingsUpserted: number;
  placeholdersCreated: number;
  mergeCandidatesCreated: number;
  errorsCount: number;
};

export type JobStats = EnrichOfficialStats | LinkHealthStats | DiscoveryRobotsAllowedStats;
