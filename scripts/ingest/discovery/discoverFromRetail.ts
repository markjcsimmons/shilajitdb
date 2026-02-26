// Stub (MVP): marketplace discovery is intentionally not implemented.
export type RetailDiscoveryResult = {
  brandName: string;
  website?: string;
  productName?: string;
  form?: string;
};

export async function discoverFromRetail(): Promise<RetailDiscoveryResult[]> {
  return [];
}

