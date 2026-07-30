import { describe, it, expect } from "vitest";
import { buildArtistReleasesQuery, parseReleaseCrews } from "../artistReleasesQuery";

function sqlOf(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  const text = Array.isArray(sql) ? sql.join("?") : String(sql ?? "");
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Reported against /artist/boheme?sort_by=year&order=desc: sorting by Release
 * Date put two 1997 rows above 2021, and both showed the same crew.
 *
 * se-lapsi.txt is credited to both Low Profile and Style at the same
 * collys_crews.sortorder. That is ordinary -- a colly is often a joint release,
 * and /collys has always listed every crew on one. The bug was that the crew
 * join matched on `sortorder = (SELECT MIN(sortorder) ...)`, which BOTH rows
 * satisfy, so the release came back twice.
 *
 * The duplicate then broke rendering, because ArtistReleases keys rows on
 * colly_id: two children shared a key, so re-sorting in the browser let React
 * patch the wrong nodes. That is why the server's first paint looked correct and
 * clicking the header did not.
 *
 * The first fix collapsed the join to a single crew with a LIMIT 1 lookup. That
 * stopped the duplicate but silently dropped Low Profile, leaving this table
 * disagreeing with /collys about the same colly. Aggregating instead satisfies
 * both requirements at once: one row per release, every crew on it.
 */

describe("buildArtistReleasesQuery", () => {
  const sql = sqlOf(buildArtistReleasesQuery(151));

  it("returns a release with two crews only once", () => {
    // A scalar subquery in the SELECT list yields one value per release, so
    // there is no join to fan out.
    expect(sql).not.toMatch(/JOIN collys_crews/i);
    expect(sql).toMatch(/\(SELECT GROUP_CONCAT\(/i);
    expect(sql).toMatch(/FROM collys_crews cc JOIN crews w ON w\.id = cc\.crew_id WHERE cc\.colly_id = c\.id\) AS crews/i);
  });

  it("keeps every crew credited on the release", () => {
    // The regression the LIMIT 1 version introduced: se-lapsi.txt showing
    // Style but not Low Profile.
    expect(sql).not.toMatch(/LIMIT 1/i);
    expect(sql).toMatch(/GROUP_CONCAT\(CONCAT\(w\.name/i);
  });

  it("never joins crews on a bare sortorder match", () => {
    // The original fan-out form. `sortorder` has no unique constraint and
    // defaults to 0, so equality against MIN(sortorder) can match several rows.
    expect(sql).not.toMatch(/cc\.sortorder = \(\s*SELECT MIN\(sortorder\)/i);
    expect(sql).not.toMatch(/SELECT MIN\(sortorder\) FROM collys_crews/i);
  });

  it("lists the primary crew first, deterministically", () => {
    // sortorder defines "primary"; cc.id breaks ties so the order does not
    // change between requests for no visible reason.
    expect(sql).toMatch(/ORDER BY cc\.sortorder ASC, cc\.id ASC/i);
  });

  it("separates crews with characters a crew name cannot contain", () => {
    // Comma-separating would break on a crew whose name contains a comma.
    expect(sql).toMatch(/CONCAT\(w\.name, 0x1f/i);
    expect(sql).toMatch(/SEPARATOR 0x1e/i);
  });

  it("scopes to the requested artist and leaves display order to the caller", () => {
    // lib/release-sort.ts is the single source of truth for display order, used
    // by both the server's first paint and every client re-sort.
    expect(sql).toMatch(/WHERE ac\.artist_id = \?/);
    expect(sql).toMatch(/ORDER BY c\.filename ASC/i);
  });
});

describe("parseReleaseCrews", () => {
  const US = "\u001f"; // between a crew name and its url
  const RS = "\u001e"; // between crews

  it("reads a joint release as both of its crews, primary first", () => {
    expect(parseReleaseCrews(`Style${US}style${RS}Low Profile${US}low-profile`)).toEqual([
      { name: "Style", url: "style" },
      { name: "Low Profile", url: "low-profile" },
    ]);
  });

  it("reads a single-crew release", () => {
    expect(parseReleaseCrews(`Style${US}style`)).toEqual([{ name: "Style", url: "style" }]);
  });

  it("treats a release with no crew as empty rather than a blank entry", () => {
    expect(parseReleaseCrews(null)).toEqual([]);
    expect(parseReleaseCrews("")).toEqual([]);
  });

  it("keeps a crew name containing a comma intact", () => {
    // The reason for the non-printable separators.
    expect(parseReleaseCrews(`Bomb, Squad${US}bomb-squad`)).toEqual([
      { name: "Bomb, Squad", url: "bomb-squad" },
    ]);
  });

  it("falls back to the name when crewurl is empty", () => {
    // A handful of legacy crews have no crewurl; linking to /crew/ would 404.
    expect(parseReleaseCrews(`Independent${US}`)).toEqual([
      { name: "Independent", url: "Independent" },
    ]);
  });
});
