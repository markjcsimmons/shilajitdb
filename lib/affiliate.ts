// Known affiliate-network tracking domains. Used to auto-flag Listing.isAffiliate
// on import, and to detect affiliate links in fields (like officialCanonicalUrl)
// that aren't tied to a Listing row.
const AFFILIATE_TRACKING_DOMAINS = [
  "pxf.io", "sjv.io", "shareasale.com", "awin1.com", "viglink.com",
  "skimresources.com", "linksynergy.com", "impact.com", "cj.com",
  "rewardstyle.com", "refersion.com", "avantlink.com", "flexoffers.com",
  "pjatr.com", "prf.hn", "anrdoezrs.net", "tkqlhce.com", "kqzyfj.com",
];

export function isAffiliateTrackingUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return AFFILIATE_TRACKING_DOMAINS.some((d) => lower.includes(d));
}
