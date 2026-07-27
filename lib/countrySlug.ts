// Country <-> URL slug.
//
// Country is free text in three tables (artists.country, bbses.country,
// users.country) filled in over two decades, so the stored values are not a
// clean set: they carry stray whitespace and casing differences, and the same
// country can appear written more than one way. Rather than pick a canonical
// spelling and lose rows, a slug matches EVERY stored spelling that reduces to
// it, and the page queries for all of them.

import { urlsafe } from "./utils";

export function countrySlug(country: string): string {
  return urlsafe(country.trim());
}

/**
 * Every raw stored value that belongs to this slug. Pure so the matching rule
 * is testable without a database.
 */
export function matchCountryValues(slug: string, stored: Array<string | null>): string[] {
  const want = slug.toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of stored) {
    if (!value || !value.trim()) continue;
    if (countrySlug(value) !== want) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** The spelling to show for a group of equivalent raw values: the commonest. */
export function displayCountryName(values: string[]): string {
  if (values.length === 0) return "";
  const trimmed = values.map(v => v.trim()).filter(Boolean);
  const counts = new Map<string, number>();
  for (const v of trimmed) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = trimmed[0];
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) { best = value; bestCount = count; }
  }
  return best;
}
