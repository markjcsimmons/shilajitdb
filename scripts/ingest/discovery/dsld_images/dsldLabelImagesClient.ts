/**
 * Fetch label image URLs for a DSLD product.
 *
 * DSLD v9 API stores images either:
 *   a) Embedded in the label JSON under various field names.
 *   b) Available at the dedicated images endpoint:
 *      GET /api/v9/label/{dsldId}/images
 *
 * We try the embedded path first (no extra network call), then fall back to
 * the dedicated endpoint.
 */
import { getCachedJson, setCachedJson } from "@/scripts/ingest/shared/cache";
import { fetchJsonWithRetry } from "@/scripts/ingest/shared/http";

const DEFAULT_BASE = "https://dsld-dev-api.app.cloud.gov/api/v9";
const DSLD_BASE = (process.env.DSLD_API_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
const CACHE_NS = "dsld-images";

/** CDN / image-host domains that are NOT brand websites. */
const IMAGE_HOST_BLOCKLIST = new Set([
  "dsld.od.nih.gov",
  "s3.amazonaws.com",
  "images.dsld.od.nih.gov",
  "cloudfront.net",
  "akamaihd.net",
  "fastly.net",
]);

type DsldImageRecord = {
  url?: string;
  imageUrl?: string;
  src?: string;
  type?: string;
  label?: string;
};

function extractEmbeddedImageUrls(label: unknown): string[] {
  if (!label || typeof label !== "object") return [];
  const l = label as Record<string, unknown>;

  const urls: string[] = [];

  // Common embedded image field names.
  for (const key of ["label_images", "labelImages", "images", "imageUrls", "image_urls"]) {
    const val = l[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string" && item.startsWith("http")) {
          urls.push(item);
        } else if (item && typeof item === "object") {
          const rec = item as DsldImageRecord;
          const u = rec.url ?? rec.imageUrl ?? rec.src ?? "";
          if (u.startsWith("http")) urls.push(u);
        }
      }
    } else if (typeof val === "string" && val.startsWith("http")) {
      urls.push(val);
    }
  }

  return urls;
}

async function fetchImagesEndpoint(dsldId: string): Promise<string[]> {
  const url = `${DSLD_BASE}/label/${encodeURIComponent(dsldId)}/images`;
  const apiKey = process.env.DSLD_API_KEY;
  const finalUrl = apiKey ? `${url}?api_key=${encodeURIComponent(apiKey)}` : url;

  const cached = await getCachedJson<{ urls: string[] }>(CACHE_NS, finalUrl);
  if (cached?.urls) return cached.urls;

  try {
    const json = await fetchJsonWithRetry<unknown>(finalUrl, { retries: 3, timeoutMs: 15000 });
    const urls: string[] = [];

    if (Array.isArray(json)) {
      for (const item of json) {
        if (typeof item === "string" && item.startsWith("http")) urls.push(item);
        else if (item && typeof item === "object") {
          const rec = item as DsldImageRecord;
          const u = rec.url ?? rec.imageUrl ?? rec.src ?? "";
          if (u.startsWith("http")) urls.push(u);
        }
      }
    } else if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      for (const key of ["images", "imageUrls", "urls", "data"]) {
        const val = obj[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === "string" && item.startsWith("http")) urls.push(item);
          }
        }
      }
    }

    await setCachedJson(CACHE_NS, finalUrl, { urls });
    return urls;
  } catch {
    await setCachedJson(CACHE_NS, finalUrl, { urls: [] });
    return [];
  }
}

/**
 * Given label JSON (already fetched) and the DSLD label ID, return label image URLs.
 * Tries embedded fields first, then the /images endpoint.
 * Returns at most `maxImages` URLs (default 2 — OCR is slow, early-exit is intentional).
 */
export async function getLabelImageUrls(
  dsldId: string,
  labelJson: unknown,
  maxImages = 2,
): Promise<string[]> {
  const embedded = extractEmbeddedImageUrls(labelJson);
  if (embedded.length > 0) {
    return embedded.slice(0, maxImages);
  }

  const fromEndpoint = await fetchImagesEndpoint(dsldId);
  return fromEndpoint.slice(0, maxImages);
}

/**
 * True if a URL looks like a brand/product image (not a random CDN asset).
 * We only want label images, not logo images on random CDNs.
 */
export function isLikelyLabelImage(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // Blocklist is for hosts that are image infrastructure, not brand sites.
    for (const blocked of IMAGE_HOST_BLOCKLIST) {
      if (host === blocked || host.endsWith(`.${blocked}`)) {
        // DSLD's own host is fine — those are genuinely DSLD label images.
        if (host.includes("dsld.od.nih.gov")) return true;
        return false;
      }
    }
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    return ["jpg", "jpeg", "png", "webp", "gif", "tiff", "bmp"].includes(ext);
  } catch {
    return false;
  }
}
