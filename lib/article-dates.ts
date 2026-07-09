/**
 * Publish dates for all /learn articles.
 * Add a new entry here whenever a new article is published.
 * The homepage "last updated" stat uses the most recent date from this list
 * alongside the most recent product lastVerifiedAt from the DB.
 */
export const ARTICLE_DATES: string[] = [
  // 2025
  "2025-01-15", // what-is-shilajit
  "2025-01-15", // shilajit-benefits
  "2025-01-15", // shilajit-heavy-metals
  "2025-01-15", // shilajit-forms-compared
  "2025-01-15", // shilajit-extraction-methods
  "2025-01-15", // shilajit-sourcing-regions
  "2025-01-15", // shilajit-grading-explained
  "2025-01-15", // shilajit-buyers-checklist
  "2025-01-15", // shilajit-men-vs-women
  "2025-01-15", // shilajit-extract-vs-resin

  // May 2026
  "2026-05-07", // shilajit-clinical-dosage
  "2026-05-07", // shilajit-dosing-timeline
  "2026-05-07", // shilajit-ashwagandha-combination
  "2026-05-07", // shilajit-endurance-athletes
  "2026-05-07", // shilajit-muscle-recovery
  "2026-05-07", // shilajit-pre-workout
  "2026-05-07", // shilajit-sleep
  "2026-05-07", // shilajit-fulvic-acid-how-much
  "2026-05-14", // how-to-read-shilajit-coa
  "2026-05-14", // shilajit-coa-pass-fail-vs-numeric
  "2026-05-14", // fake-shilajit-how-to-spot
  "2026-05-14", // fulvic-acid-shilajit
  "2026-05-14", // fulvic-acid-percentage-explained
  "2026-05-14", // himalayan-shilajit-india-pakistan-nepal
  "2026-05-30", // shilajit-testing-labs-compared
  "2026-05-30", // best-time-to-take-shilajit

  // June 2026
  "2026-06-08", // shilajit-honey-sticks
  "2026-06-08", // shilajit-sea-moss

  // July 2026
  "2026-07-09", // shilajit-benefits-for-men
  "2026-07-09", // shilajit-benefits-for-women
];

/** Returns the most recent article publish date as a Date object. */
export function latestArticleDate(): Date {
  return new Date(
    ARTICLE_DATES.reduce((latest, d) => (d > latest ? d : latest))
  );
}
