import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildMemberCollyCountQuery } from "../member-colly-count-query";

/**
 * Reported: https://www.asciiarena.se/member/spot said "has pumped up 10
 * collys" for an uploader with far more than ten.
 *
 * The page never counted anything. It rendered `collys.length` -- the length of
 * the "Last 10 collys added" list, which is `LIMIT 10` -- so the sentence was
 * pinned at ten for every prolific uploader on the site.
 */

function renderSql(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  if (Array.isArray(sql)) return sql.join("");
  return String(sql ?? (query as { text?: unknown }).text ?? "");
}

function normalizeSql(query: unknown): string {
  return renderSql(query).replace(/\s+/g, " ").trim();
}

describe("buildMemberCollyCountQuery", () => {
  it("counts every colly the member uploaded, not a page of them", () => {
    const sql = normalizeSql(buildMemberCollyCountQuery(42));

    expect(sql).toMatch(/COUNT\(DISTINCT c\.filename\) AS total/);
    expect(sql).toMatch(/FROM collys c/);
    expect(sql).toMatch(/WHERE c\.uploader_id = /);
    // A count query that carries the list's page size is the bug itself.
    expect(sql).not.toMatch(/LIMIT/i);
  });

  it("dedupes by filename the same way the list does", () => {
    // The list GROUP BYs c.filename; the total has to agree with it or the
    // sentence contradicts the table printed right below it.
    const sql = normalizeSql(buildMemberCollyCountQuery(42));
    expect(sql).toMatch(/DISTINCT c\.filename/);
  });
});

describe("member profile page", () => {
  const source = readFileSync(
    path.join(__dirname, "..", "..", "app", "member", "[nick]", "page.tsx"),
    "utf8",
  );

  it("does not report the truncated list length as the upload total", () => {
    expect(source).not.toMatch(/\{collys\.length\} collys/);
  });

  it("uses the count query for the pumped-up sentence", () => {
    expect(source).toMatch(/buildMemberCollyCountQuery/);
    expect(source).toMatch(/has pumped up \{totalCollys\} collys/);
  });
});
