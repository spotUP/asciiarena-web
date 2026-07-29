import { describe, it, expect } from "vitest";
import { buildArtistReleasesQuery } from "../artistReleasesQuery";

function sqlOf(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  const text = Array.isArray(sql) ? sql.join("?") : String(sql ?? "");
  return text.replace(/\s+/g, " ").trim();
}

// Reported against /artist/boheme?sort_by=year&order=desc: sorting by Release
// Date put two 1997 rows above 2021, and both showed the same crew.
//
// The cause was in this query, not in the comparator. se-lapsi.txt is credited
// to both Low Profile and Style at the same collys_crews.sortorder, and the
// crew join matched on `sortorder = (SELECT MIN(sortorder) ...)`, which is
// satisfied by BOTH rows. The release came back twice.
//
// The duplicate then broke rendering, because ArtistReleases keys rows on
// colly_id: two children shared a key, so re-sorting in the browser let React
// patch the wrong nodes. That is why the server's first paint looked correct
// and clicking the header did not.

describe("buildArtistReleasesQuery", () => {
  const sql = sqlOf(buildArtistReleasesQuery(151));

  it("returns a release with two same-sortorder crews only once", () => {
    // The crew join must match on a scalar id from a LIMIT 1 subquery, which
    // can only ever match one collys_crews row.
    expect(sql).toMatch(
      /LEFT JOIN collys_crews cc ON cc\.id = \( SELECT cc2\.id FROM collys_crews cc2 WHERE cc2\.colly_id = c\.id ORDER BY cc2\.sortorder ASC, cc2\.id ASC LIMIT 1 \)/i,
    );
  });

  it("never joins crews on a bare sortorder match", () => {
    // The fan-out form. `sortorder` has no unique constraint and defaults to 0,
    // so equality against MIN(sortorder) can match several rows per colly.
    expect(sql).not.toMatch(/cc\.sortorder = \(\s*SELECT MIN\(sortorder\)/i);
    expect(sql).not.toMatch(/SELECT MIN\(sortorder\) FROM collys_crews/i);
  });

  it("picks the same crew on every run", () => {
    // sortorder alone is ambiguous when two crews tie, so id breaks the tie.
    // Without a deterministic tie-break the displayed crew could change
    // between requests for no visible reason.
    expect(sql).toMatch(/ORDER BY cc2\.sortorder ASC, cc2\.id ASC/i);
  });

  it("scopes to the requested artist and leaves ordering to the caller", () => {
    // lib/release-sort.ts is the single source of truth for display order,
    // used by both the server's first paint and every client re-sort. This
    // query only needs a stable base order.
    expect(sql).toMatch(/WHERE ac\.artist_id = \?/);
    expect(sql).toMatch(/ORDER BY c\.filename ASC/i);
  });
});
