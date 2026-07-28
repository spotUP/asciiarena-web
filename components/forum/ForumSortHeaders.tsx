import { computeSortHeaders, type SortOrder } from "@/lib/sort-headers";

const COLUMNS = [
  { key: "title", label: "Topic" },
  { key: "replies", label: "Replies" },
  { key: "author", label: "Author" },
  { key: "last_post", label: "Last Post" },
];

const WIDTHS = ["col-5", "col-2", "col-2", "col-2"];

/**
 * Server-rendered sort headers: real hrefs, because the list is rendered from
 * searchParams and a navigation IS the state change. That is why this uses the
 * pure computeSortHeaders() and not components/ui/SortHeader.tsx, which exists
 * for client-fetched lists and emits a different query convention
 * (?sort=&asc=A vs ?sort_by=&order=asc). Mixing the two would give anchors
 * whose href disagrees with what this page parses.
 */
export default function ForumSortHeaders({ sortBy, order }: { sortBy: string | undefined; order: SortOrder }) {
  const headers = computeSortHeaders(COLUMNS, sortBy, order, "last_post");
  return (
    <div className="row amb-1 m-0" style={{ height: "16px", lineHeight: "16px" }}>
      <div className="col-1 p-0" />
      {headers.map((h, i) => (
        <div key={h.key} className={`${WIDTHS[i]} p-0`}>
          <a className={h.className} href={h.href}>
            {h.label}
            {h.arrow}
          </a>
        </div>
      ))}
    </div>
  );
}
