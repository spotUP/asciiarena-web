"use client";

import { useMemo, useState } from "react";
import ContentLink from "@/components/ui/ContentLink";
import {
  computeSortHeaders,
  type SortColumn,
} from "@/lib/sort-headers";
import {
  sortReleases,
  type ReleaseSortKey,
  type ReleaseSortOrder,
} from "@/lib/release-sort";
import type { ReleaseCrew } from "@/lib/artistReleasesQuery";

export interface ArtistReleaseRow {
  colly_id: number;
  filename: string;
  name: string | null;
  year: number | null;
  // Every crew credited on the release, primary first. A colly is often a joint
  // release -- se-lapsi.txt is Style and Low Profile -- and /collys has always
  // shown all of them, so this table does too.
  crews: ReleaseCrew[];
  // The primary crew's name, which is what the Crew column sorts on. Derived
  // from crews[0] by the page so the comparator keeps taking one string.
  crew: string | null;
}

interface ArtistReleasesProps {
  rows: ArtistReleaseRow[];
  acronym: string;
  initialSort: ReleaseSortKey;
  initialOrder: ReleaseSortOrder;
}

const COLUMNS: SortColumn[] = [
  { key: "filename", label: "Filename" },
  { key: "name", label: "Name" },
  { key: "crew", label: "Crew" },
  { key: "year", label: "Release Date" },
];
const DEFAULT_SORT: ReleaseSortKey = "filename";

/**
 * Client-rendered "All Releases" table. All rows are already in memory, so
 * clicking a header re-sorts instantly with no navigation or refetch — which
 * also sidesteps the App Router cache bug that the old full-page <a> links
 * worked around. The URL is kept in sync via history.replaceState so the sort
 * stays shareable/bookmarkable without triggering a reload.
 */
export default function ArtistReleases({
  rows,
  acronym,
  initialSort,
  initialOrder,
}: ArtistReleasesProps) {
  const [sort, setSort] = useState<{ key: ReleaseSortKey; order: ReleaseSortOrder }>({
    key: initialSort,
    order: initialOrder,
  });

  const sortedRows = useMemo(
    () => sortReleases(rows, sort.key, sort.order),
    [rows, sort],
  );

  const headers = computeSortHeaders(COLUMNS, sort.key, sort.order, DEFAULT_SORT);

  function applySort(key: ReleaseSortKey) {
    setSort((prev) => {
      const next: { key: ReleaseSortKey; order: ReleaseSortOrder } =
        prev.key === key
          ? { key, order: prev.order === "asc" ? "desc" : "asc" }
          : { key, order: "asc" };
      // Keep the address bar in sync without a navigation/reload.
      window.history.replaceState(null, "", `?sort_by=${next.key}&order=${next.order}`);
      return next;
    });
  }

  return (
    <>
      <div className="row apt-1 apb-1">
        <h2 className="ap-1 bg-header">All {acronym} Releases</h2>
      </div>

      {/* Clickable sort headers. The whole label is the click target; onClick
          re-sorts in place. The href is a real toggle URL so middle-click /
          open-in-new-tab and no-JS still work. apb-1 = 16px gap to the rows. */}
      <div className="col-lg-12 d-flex justify-content-between pl-0 apb-1">
        {headers.map((h) => (
          <div key={h.key} className="col-lg-3 pl-0">
            <a
              className={h.className}
              href={h.href}
              onClick={(e) => {
                e.preventDefault();
                applySort(h.key as ReleaseSortKey);
              }}
            >
              {h.label}{h.arrow}
            </a>
          </div>
        ))}
      </div>

      {sortedRows.map((r) => (
        <div
          key={r.colly_id}
          className="col-lg-12 d-flex justify-content-between pl-0"
        >
          <div className="col-lg-3 pl-0">
            <ContentLink className="magenta" href={`/release/${r.filename}`}>
              {r.filename.slice(0, 12)}
            </ContentLink>
          </div>
          <div className="col-lg-3 pl-0">
            <ContentLink className="magenta" href={`/release/${r.filename}`}>
              {r.name?.slice(0, 35) ?? r.filename}
            </ContentLink>
          </div>
          <div className="col-lg-3 pl-0">
            {r.crews.length > 0
              ? r.crews.map((w, i) => (
                  <span key={w.url}>
                    {i > 0 && ", "}
                    <ContentLink href={`/crew/${w.url}`}>{w.name}</ContentLink>
                  </span>
                ))
              : "-"}
          </div>
          <div className="col-lg-3 pl-0">
            <span className="lightgrey">{r.year ?? "-"}</span>
          </div>
        </div>
      ))}
    </>
  );
}
