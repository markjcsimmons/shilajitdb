/**
 * GA4 click tracking for outbound links, without turning server components into client ones.
 *
 * Spread the result onto an <a>: the click listener in app/layout.tsx picks up any link with
 * `data-track` and sends it as a GA4 event, with the other data-* values as event parameters.
 *
 *   shop_click — a link to where the product is sold (mark it as a key event in GA4)
 *   coa_click  — a link to the product's Certificate of Analysis
 */
type TrackEvent = "shop_click" | "coa_click";

export function trackAttrs(
  event: TrackEvent,
  opts: {
    /** Where on the page the link sits, e.g. "shop_button", "where_to_buy". */
    location: string;
    product: string;
    brand: string;
    affiliate?: boolean;
    retailer?: string;
  },
): Record<string, string> {
  return {
    "data-track": event,
    "data-location": opts.location,
    "data-product": opts.product,
    "data-brand": opts.brand,
    ...(opts.affiliate !== undefined ? { "data-affiliate": String(opts.affiliate) } : {}),
    ...(opts.retailer ? { "data-retailer": opts.retailer } : {}),
  };
}
