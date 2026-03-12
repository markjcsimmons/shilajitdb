/** Escape a value for CSV (handles quotes and commas) */
export function escapeCsvValue(value: string | null | undefined): string {
  const s = String(value ?? "").trim();
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a CSV row from an array of values */
export function csvRow(values: (string | null | undefined)[]): string {
  return values.map(escapeCsvValue).join(",");
}
