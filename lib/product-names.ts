/**
 * Name helpers for titles and headings that print a brand next to a product name.
 *
 * Many product names already start with the brand ("Pürblack® Research Grade…" under brand
 * "Pürblack"), so plain `${brand} ${name}` doubles it ("Pürblack Pürblack® Research Grade…").
 */

/** The product name with a leading copy of the brand (and any ®/™/separator after it) removed. */
export function nameWithoutBrand(brand: string, name: string): string {
  if (!brand || !name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  // Only a whole-word match: brand "Life" must not strip the start of "Lifestyle Shilajit".
  if (/[\p{L}\p{N}]/u.test(name.charAt(brand.length))) return name;
  const rest = name.slice(brand.length).replace(/^[\s®™©|:–—-]+/u, "");
  return rest || name;
}

/** "Brand Product" with the brand printed once. */
export function brandedName(brand: string, name: string): string {
  return `${brand} ${nameWithoutBrand(brand, name)}`;
}

/**
 * The name up to its first descriptor break (", 15 grams", " – 60 Gummies", " (90 Count)", " | …"),
 * for places where two names have to share one line, like a compare-page title. Keeps the full
 * name when the cut would leave too little to identify the product.
 */
export function shortName(name: string): string {
  const cut = name.search(/,\s| [–—|-] | \(/);
  if (cut < 12) return name;
  return name.slice(0, cut).trim();
}
