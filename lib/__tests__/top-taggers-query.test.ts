import { describe, it, expect } from "vitest";
import { buildTopTaggersQuery } from "../topTaggersQuery";

function sqlOf(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  const text = Array.isArray(sql) ? sql.join("?") : String(sql ?? "");
  return text.replace(/\s+/g, " ").trim();
}

// The TOP TAGGERS ranking has to reward tagging work, not save volume, and it
// must not repeat the incident where big-sorting a MEDIUMTEXT column blew up
// InnoDB temp space and filled the server's disk.

describe("buildTopTaggersQuery", () => {
  const sql = sqlOf(buildTopTaggersQuery(5));

  it("counts only the newest snapshot per colly", () => {
    // Summing every snapshot would let one person re-save the same colly to
    // climb the board, and would credit maps that have since been replaced.
    expect(sql).toMatch(/SELECT colly_id, MAX\(id\) AS id FROM colly_logo_edits GROUP BY colly_id/i);
    expect(sql).toMatch(/\) newest ON newest\.id = e\.id/i);
  });

  it("excludes the synthetic baseline author", () => {
    // user_id 0 is the baseline snapshot taken before a colly's first public
    // overwrite. It is preserved history, not somebody's work.
    expect(sql).toMatch(/e\.user_id > 0/);
  });

  it("ignores saves that cleared a map", () => {
    expect(sql).toMatch(/e\.logo_count > 0/);
  });

  it("ranks by logos, breaking ties deterministically", () => {
    expect(sql).toMatch(/ORDER BY logos DESC, collys DESC, u\.nick ASC/i);
  });

  it("never selects or sorts the MEDIUMTEXT map column", () => {
    // A prior incident on this server: a query that big-sorted a MEDIUMTEXT
    // column grew #innodb_temp to 13 GB and filled the disk, taking MySQL down
    // site-wide. `map` must stay out of the projection and the sort entirely.
    expect(sql).not.toMatch(/\bmap\b/);
  });

  it("applies the caller's limit", () => {
    expect(sqlOf(buildTopTaggersQuery(25))).toMatch(/LIMIT/i);
  });
});
