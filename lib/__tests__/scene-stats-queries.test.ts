import { describe, it, expect } from "vitest";
import { buildTopCollaborationsQuery } from "../topCollaborationsQuery";
import { buildMostDrawnArtistsQuery, buildMostDrawnCrewsQuery } from "../mostDrawnQueries";

function sqlOf(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  const text = Array.isArray(sql) ? sql.join("?") : String(sql ?? "");
  return text.replace(/\s+/g, " ").trim();
}

/**
 * /stats took 7.3s on a cold hit and ~3.5s warm, while every other page on the
 * site served in about a second. Timing all 15 of its queries against prod put
 * essentially the whole cost in one of them:
 *
 *   topCollaborations   5394 ms   (1675 ms warm)
 *   mostDrawnArtists     340 ms
 *   mostDrawnCrews       267 ms
 *   the other twelve   10-106 ms each, 289 ms in total
 *
 * topCollaborations self-joins colly_logos across the whole catalog. That table
 * has 103k rows of which only 22k carry an artist_id, and one artist commonly
 * has many logos in the same colly -- the worst has 119. So the join produced
 * every logo-to-logo pair within a colly and then used
 * COUNT(DISTINCT colly_id) to collapse the duplication: the expensive part
 * existed only to be discarded. All three queries additionally grouped by the
 * name columns they wanted to select, widening the temp table for no reason.
 *
 * Measured after the rewrite: 300 ms, 107 ms, 44 ms.
 *
 * Equivalence was checked on prod over the FULL result set, not a sample:
 * 24442 pairs and sum(shared) 56867, identical to the old query, and identical
 * top-25 rows for both mostDrawn queries.
 */

describe("buildTopCollaborationsQuery", () => {
  const sql = sqlOf(buildTopCollaborationsQuery(15));

  it("collapses a colly's logos to one row per artist before pairing them", () => {
    // The whole cost was pairing 119 logos with each other and deduping after.
    expect(sql).toMatch(
      /WITH ca AS \( SELECT DISTINCT cl\.colly_id AS colly_id, cl\.artist_id AS artist_id/i,
    );
    expect(sql).toMatch(/JOIN ca b ON b\.colly_id = a\.colly_id AND b\.artist_id > a\.artist_id/i);
  });

  it("counts pairs directly, since deduping already happened", () => {
    expect(sql).toMatch(/COUNT\(\*\) AS shared/i);
    expect(sql).not.toMatch(/COUNT\(DISTINCT/i);
  });

  it("groups on the two ids only, not on the names it displays", () => {
    expect(sql).toMatch(/GROUP BY a\.artist_id, b\.artist_id ORDER BY shared DESC LIMIT \?/i);
  });

  it("drops logos whose artist no longer exists before applying the limit", () => {
    // 61 rows point at 2 deleted artist ids. Filtering after LIMIT would let an
    // orphan take a top-n slot and then vanish, returning fewer rows than asked.
    expect(sql).toMatch(/FROM colly_logos cl JOIN artists a ON a\.id = cl\.artist_id \)/i);
  });

  it("counts each unordered pair once", () => {
    expect(sql).toMatch(/b\.artist_id > a\.artist_id/);
  });
});

describe("buildMostDrawnArtistsQuery", () => {
  const sql = sqlOf(buildMostDrawnArtistsQuery(10));

  it("groups on artist_id, not on the artist's name columns", () => {
    expect(sql).toMatch(/GROUP BY cl\.artist_id/i);
    expect(sql).not.toMatch(/GROUP BY a\.id, a\.nick/i);
  });

  it("excludes deleted artists before applying the limit", () => {
    expect(sql).toMatch(/FROM colly_logos cl JOIN artists a2 ON a2\.id = cl\.artist_id GROUP BY/i);
  });
});

describe("buildMostDrawnCrewsQuery", () => {
  const sql = sqlOf(buildMostDrawnCrewsQuery(10));

  it("groups on crew_id, not on the crew's name", () => {
    expect(sql).toMatch(/GROUP BY cl\.crew_id/i);
    expect(sql).not.toMatch(/GROUP BY w\.id, w\.name/i);
  });

  it("excludes deleted crews before applying the limit", () => {
    expect(sql).toMatch(/FROM colly_logos cl JOIN crews w2 ON w2\.id = cl\.crew_id GROUP BY/i);
  });
});
