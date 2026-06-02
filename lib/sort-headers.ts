// Pure logic for clickable, direction-aware sort headers.
//
// Extracted so the active-column / direction-toggle / arrow rules can be unit
// tested without rendering a page. The artist "All Releases" table consumes
// this; listing pages can adopt the same model later for a single source of
// truth on how a sort header behaves.

export interface SortColumn {
  /** Stable sort key sent back as ?sort_by=, also the SORT_SQL map key. */
  key: string;
  /** Human label shown in the header (full English word, ASCII only). */
  label: string;
}

export type SortOrder = "asc" | "desc";

export interface SortHeaderState {
  key: string;
  label: string;
  /** True when this column is the one currently driving the sort. */
  isActive: boolean;
  /** Href that applies/toggles this column's sort. */
  href: string;
  /**
   * ASCII direction arrow appended to the active column's label:
   * " ^" ascending, " v" descending, "" when not active. ASCII-only by rule.
   */
  arrow: string;
  /** Class string: always "sort-header", plus "sort-header-active" when active. */
  className: string;
}

/** Coerce an untrusted ?order= value to a known direction (defaults ascending). */
export function normalizeOrder(raw: string | undefined): SortOrder {
  return raw === "desc" ? "desc" : "asc";
}

/**
 * Resolve which column is effectively active. An unknown/missing sort key
 * falls back to `defaultKey`, matching the server's default ORDER BY so the
 * arrow never points at a column the data isn't actually sorted by.
 */
export function resolveActiveKey(
  columns: SortColumn[],
  currentSort: string | undefined,
  defaultKey: string,
): string {
  return columns.some((c) => c.key === currentSort) ? (currentSort as string) : defaultKey;
}

/**
 * Build the render model for a row of sort headers.
 *
 * Clicking a non-active column sorts it ascending; clicking the already-active
 * column flips its direction. The active column carries the ^/v arrow and the
 * `sort-header-active` class so it reads as both clickable and current.
 */
export function computeSortHeaders(
  columns: SortColumn[],
  currentSort: string | undefined,
  currentOrder: SortOrder,
  defaultKey: string,
): SortHeaderState[] {
  const activeKey = resolveActiveKey(columns, currentSort, defaultKey);
  return columns.map((col) => {
    const isActive = col.key === activeKey;
    const nextOrder: SortOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
    const arrow = isActive ? (currentOrder === "asc" ? " ^" : " v") : "";
    return {
      key: col.key,
      label: col.label,
      isActive,
      href: `?sort_by=${encodeURIComponent(col.key)}&order=${nextOrder}`,
      arrow,
      className: isActive ? "sort-header sort-header-active" : "sort-header",
    };
  });
}
