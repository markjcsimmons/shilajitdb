import type { JobStatus, JobType } from "@prisma/client";

export type { JobStatus, JobType };

export const JOB_TYPES = [
  "ENRICH_OFFICIAL",
  "LINK_HEALTH",
  "DISCOVERY_ROBOTS_ALLOWED",
  "DISCOVER_OFFICIAL_FROM_DSLD_IMAGES",
  "DISCOVER_OFFICIAL_FROM_SITEMAPS",
] as const;
export type JobTypeValue = (typeof JOB_TYPES)[number];

export function isJobType(s: string): s is JobTypeValue {
  return JOB_TYPES.includes(s as JobTypeValue);
}

export type EnrichOfficialStats = {
  productsSelected: number;
  productsProcessed: number;
  skippedNoProductUrl: number;
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

export type DsldImageDiscoveryStats = {
  productsScanned: number;
  productsSkipped: number;
  imagesDownloaded: number;
  imagesCachedHit: number;
  domainsFound: number;
  officialListingsCreated: number;
  evidenceCreated: number;
  errorsCount: number;
};

export type UrlCsvExtractStats = {
  rowsProcessed: number;
  officialProductPages: number;
  retailerProductPages: number;
  marketplacePages: number;
  failed: number;
  listingsWritten?: number;
};

export type SitemapHarvestStats = {
  domainsScanned: number;
  sitemapsFetched: number;
  productUrlsFound: number;
  /** URLs skipped because slug contains no shilajit term (Fix 1 / Ref A). */
  skippedNonShilajit: number;
  /** URLs skipped because a Listing already exists for them (Fix 3). */
  skippedAlreadySeen: number;
  /** Ref A — Weak-term URLs rejected after page-title check found no strong term. */
  skippedWeakTermNotConfirmed: number;
  /** Ref A — Number of page-title HTTP fetches attempted. */
  titleFetchAttempts: number;
  /** Ref A — Fetches that returned null (timeout / blocked / error). */
  titleFetchFailures: number;
  /** Ref D — Listings attached to per-domain quarantine products. */
  quarantinedListingsCreated: number;
  listingsUpserted: number;
  placeholdersCreated: number;
  mergeCandidatesCreated: number;
  errorsCount: number;
};

export type JobStats =
  | EnrichOfficialStats
  | LinkHealthStats
  | DiscoveryRobotsAllowedStats
  | DsldImageDiscoveryStats
  | SitemapHarvestStats
  | UrlCsvExtractStats;
