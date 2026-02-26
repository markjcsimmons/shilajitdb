// Stub (MVP): search-engine discovery via external APIs is not allowed without keys.
export type SearchDiscoveryResult = {
  brandName: string;
  website?: string;
  productName?: string;
  form?: string;
};

export async function discoverFromSearch(): Promise<SearchDiscoveryResult[]> {
  return [];
}

