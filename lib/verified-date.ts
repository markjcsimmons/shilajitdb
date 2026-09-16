/**
 * A lastVerifiedAt in the future is always bad data: a 2026 import wrote dates as late as 2050,
 * which showed as "last updated Aug 2050" on the homepage and on product "Verified" badges.
 * Importers ignore such dates. One day of slack covers timezone differences.
 */
export function isFutureVerifiedDate(date: Date, now: Date = new Date()): boolean {
  return date.getTime() > now.getTime() + 24 * 60 * 60 * 1000;
}
