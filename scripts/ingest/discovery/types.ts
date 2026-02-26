import type { ListingSource, ProductForm } from "@prisma/client";

export type ListingInput = {
  url: string;
  source: ListingSource;
  title?: string | null;
  brandName?: string | null;
  observedGtin?: string | null;
  observedSku?: string | null;
  netQuantityText?: string | null;
  form?: ProductForm | null;
  imageUrls?: string[] | null;
};

export type ListingResolverResult = {
  productId: string;
  listingId: string;
  mergeCandidatesCreatedCount: number;
  attachedToExistingProduct: boolean;
  listingCreated: boolean;
};

