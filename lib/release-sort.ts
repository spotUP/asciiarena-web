// Single source of truth for ordering an artist's releases.
//
// Previously this lived as SQL (ORDER BY LOWER(REGEXP_REPLACE(...))) in the
// artist page query. The table now sorts instantly in the browser (all rows
// are already loaded), so the ordering rules moved here as one pure comparator
// used for BOTH the server's first paint and every client re-sort — there is
// no second implementation that could drift out of sync.
//
// The rules reproduce the SQL semantics that earlier bug reports pinned down:
//   - case-insensitive (LOWER)
//   - leading non-alphanumeric characters are stripped before comparing, so a
//     filename like "!cool.txt" sorts next to "cool.txt", not at the top
//   - the Name column falls back to the filename when name is blank/missing
//   - the Crew column keeps blank/unknown crews last, in either direction
//   - Release Date sorts numerically by year

export type ReleaseSortKey = "filename" | "name" | "crew" | "year";
export type ReleaseSortOrder = "asc" | "desc";

export interface SortableRelease {
  filename: string;
  name: string | null;
  crew: string | null;
  year: number | null;
}

/** Lowercase and strip leading non-alphanumeric chars (mirrors the SQL REGEXP_REPLACE). */
export function normalizeSortValue(value: string): string {
  return value.toLowerCase().replace(/^[^0-9a-z]+/, "");
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function isBlank(value: string | null): boolean {
  return value == null || value.trim() === "";
}

/**
 * Return a new array of releases ordered by `key`/`order`. Stable on ties via a
 * filename fallback so the table never reshuffles arbitrarily between re-sorts.
 */
export function sortReleases<T extends SortableRelease>(
  rows: readonly T[],
  key: ReleaseSortKey,
  order: ReleaseSortOrder,
): T[] {
  const dir = order === "desc" ? -1 : 1;
  const tieBreak = (a: T, b: T) =>
    compareStrings(normalizeSortValue(a.filename), normalizeSortValue(b.filename));

  return [...rows].sort((a, b) => {
    switch (key) {
      case "year": {
        const c = (a.year ?? 0) - (b.year ?? 0);
        return c !== 0 ? dir * c : tieBreak(a, b);
      }
      case "crew": {
        // Blank/unknown crews stay last regardless of direction (matches the
        // SQL "(w.name IS NULL OR ...)" leading sort term, which is unaffected
        // by the trailing ASC/DESC).
        const blankA = isBlank(a.crew) ? 1 : 0;
        const blankB = isBlank(b.crew) ? 1 : 0;
        if (blankA !== blankB) return blankA - blankB;
        const c = compareStrings(
          normalizeSortValue(a.crew ?? ""),
          normalizeSortValue(b.crew ?? ""),
        );
        return c !== 0 ? dir * c : tieBreak(a, b);
      }
      case "name": {
        const va = isBlank(a.name) ? a.filename : (a.name as string);
        const vb = isBlank(b.name) ? b.filename : (b.name as string);
        const c = compareStrings(normalizeSortValue(va), normalizeSortValue(vb));
        return c !== 0 ? dir * c : tieBreak(a, b);
      }
      case "filename":
      default:
        return dir * tieBreak(a, b);
    }
  });
}
