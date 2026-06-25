import { describe, expect, it } from "vitest";
import { buildLatestReleaseRowsQuery } from "../home-latest-releases-query";

function renderSql(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  if (Array.isArray(sql)) return sql.join("");
  return String(sql ?? (query as { text?: unknown }).text ?? "");
}

function normalizeSql(query: unknown): string {
  return renderSql(query).replace(/\s+/g, " ").trim();
}

describe("buildLatestReleaseRowsQuery", () => {
  it("sorts latest releases before limiting the result set", () => {
    const sql = normalizeSql(buildLatestReleaseRowsQuery(false));

    expect(sql).toMatch(/FROM collys ORDER BY fyear DESC, fmonth DESC, fday DESC LIMIT 20/);
    expect(sql).not.toMatch(/LIMIT 20 \) a ORDER BY/);
  });

  it("keeps random releases random before limiting the result set", () => {
    const sql = normalizeSql(buildLatestReleaseRowsQuery(true));

    expect(sql).toMatch(/FROM collys ORDER BY RAND\(\) LIMIT 20/);
    expect(sql).not.toMatch(/LIMIT 20 \) a ORDER BY/);
  });
});
