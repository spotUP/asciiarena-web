"use client";

/**
 * One clickable, sortable column header. Drop-in replacement for the old
 * `<button className="sort-btn">LABEL</button>` used across the list pages:
 * keeps each list's surrounding column layout untouched and only restyles the
 * label. The active column is white + bold with an ASCII ^/v direction arrow;
 * inactive columns are yellow link-coloured. Whole label is the click target.
 *
 * Single source of truth for the list sort-header look + behaviour (mirrors
 * the artist "All Releases" headers). onClick re-sorts via the list's existing
 * state/refetch (no full reload); the href is a real ?sort= URL so middle-click
 * / open-in-new-tab and no-JS still work.
 */
interface SortHeaderProps {
  /** This header's sort key (sent to the list's onSort / API ?sort=). */
  col: string;
  /** Visible label (full word, ASCII only). */
  label: string;
  /** The list's currently active sort key. */
  sortKey: string;
  /** Current direction in the list's native "A" (asc) / "D" (desc) form. */
  asc: "A" | "D";
  /** Apply this column's sort (the list toggles direction on repeat clicks). */
  onSort: (key: string) => void;
}

export default function SortHeader({ col, label, sortKey, asc, onSort }: SortHeaderProps) {
  const active = sortKey === col;
  const arrow = active ? (asc === "A" ? " ^" : " v") : "";
  // Fallback URL: re-click the active column to flip direction, otherwise ascend.
  const nextAsc = active && asc === "A" ? "D" : "A";

  return (
    <a
      className={active ? "sort-header sort-header-active" : "sort-header"}
      href={`?sort=${col}&asc=${nextAsc}`}
      onClick={(e) => {
        e.preventDefault();
        onSort(col);
      }}
    >
      {label}{arrow}
    </a>
  );
}
