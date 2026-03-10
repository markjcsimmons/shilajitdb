import type { ListingSource, ProductForm } from "@prisma/client";

/** URL classification output */
export type UrlKind =
  | "OFFICIAL_PRODUCT_PAGE"
  | "RETAILER_PRODUCT_PAGE"
  | "MARKETPLACE_PRODUCT_PAGE"
  | "COLLECTION_PAGE"
  | "STORE_PAGE"
  | "HOMEPAGE"
  | "UNKNOWN";

/** Trust level for source of extracted data */
export type SourceTrustLevel = "OFFICIAL" | "RETAILER" | "MARKETPLACE";

export type UrlClassificationResult = {
  kind: UrlKind;
  domain: string;
  canonicalizedUrl: string;
  confidence: number;
  reason: string;
};

/** Input row from CSV */
export type CsvInputRow = {
  name?: string;
  url: string;
  source?: ListingSource | "OFFICIAL" | "AMAZON" | "WALMART" | "OTHER_RETAILER";
};

/** Fetched page data */
export type FetchedPage = {
  html: string;
  finalUrl: string;
  title: string | null;
  metaTags: Record<string, string>;
  textSnippet: string;
  status: number;
};

/** Evidence snippet for factual claims */
export type EvidenceSnippet = {
  type: "COA" | "MANUFACTURING" | "INGREDIENTS" | "TESTING" | "OTHER";
  url: string;
  quote: string;
};

/** Official product extraction result */
export type OfficialProductExtract = {
  productName: string | null;
  brand: string | null;
  form: ProductForm;
  ingredientsText: string | null;
  manufacturingClaim: string | null;
  coaUrls: string[];
  gtin: string | null;
  netQuantity: string | null;
  pageTitle: string | null;
  evidence: EvidenceSnippet[];
  canCreateCanonical: boolean;
  confidence: number;
  notes: string;
  stableIdentitySignal: string | null;
  canonicalSkipReason: string | null;
};

/** Marketplace product extraction result */
export type MarketplaceProductExtract = {
  title: string | null;
  brand: string | null;
  sizeOrCount: string | null;
  asinOrId: string | null;
  imageUrls: string[];
  gtin: string | null;
  canCreateCanonical: boolean;
  listingOnly: boolean;
  candidateProductSuggestion: { brand: string; title: string } | null;
  notes: string;
};

/** Retailer product extraction (iHerb, Vitacost, etc.) - richer than marketplace, but NOT authoritative for COA/manufacturing */
export type RetailerProductExtract = {
  title: string | null;
  brand: string | null;
  form: ProductForm;
  ingredientsText: string | null;
  sizeOrCount: string | null;
  gtin: string | null;
  imageUrls: string[];
  canCreateCanonical: boolean;
  notes: string;
};

/** Collection page extraction result */
export type CollectionPageExtract = {
  childProductUrls: string[];
  childStoreUrls: string[];
  notes: string;
};

/** Homepage extraction result */
export type HomepageExtract = {
  brandName: string | null;
  domain: string;
  websiteUrl: string | null;
  notes: string;
};

/** Enriched output row for CSV */
export type EnrichedOutputRow = {
  input_name: string;
  input_url: string;
  source: string;
  url_kind: UrlKind;
  source_trust_level: SourceTrustLevel;
  canonicalized_url: string;
  extracted_brand: string;
  extracted_product_name: string;
  form: string;
  ingredients_text: string;
  manufacturing_claim: string;
  coa_url: string;
  gtin: string;
  net_quantity: string;
  can_create_canonical: string;
  confidence: string;
  stable_identity_signal: string;
  canonical_skip_reason: string;
  notes: string;
  failure_reason: string;
  robots_blocked: string;
  timed_out: string;
  js_render_required: string;
  missing_title: string;
  missing_brand: string;
};

/** JSON summary */
export type RunSummary = {
  rowsProcessed: number;
  officialProductPages: number;
  retailerProductPages: number;
  marketplacePages: number;
  collectionPages: number;
  homepages: number;
  canonicalCandidates: number;
  listingOnly: number;
  failed: number;
};
