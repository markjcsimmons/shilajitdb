export function slugify(input: string): string {
  return input
    .trim()
    .normalize("NFD")                    // decompose accented chars: ü → u + combining diaeresis
    .replace(/[\u0300-\u036f]/g, "")    // strip combining diacritical marks
    .toLowerCase()
    .replace(/[‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

