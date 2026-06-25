import { describe, expect, it } from "vitest";
import { buildLogoHeaderRowsQuery } from "@/lib/logo-header-query";

function renderSql(query: unknown): string {
  const sql = (query as { sql?: unknown }).sql;
  if (Array.isArray(sql)) return sql.join("");
  return String(sql ?? (query as { text?: unknown }).text ?? "");
}

function renderValues(query: unknown): unknown[] {
  const values = (query as { values?: unknown }).values;
  return Array.isArray(values) ? values : [];
}

function normalizeSql(query: unknown): string {
  return renderSql(query).replace(/\s+/g, " ").trim();
}

describe("buildLogoHeaderRowsQuery", () => {
  it("keeps the newest logos in the rotation before limiting the set", () => {
    const query = buildLogoHeaderRowsQuery(50);
    const sql = normalizeSql(query);

    expect(sql).toMatch(/FROM logos ORDER BY logo_id DESC LIMIT \?/);
    expect(sql).not.toMatch(/ORDER BY logo_id LIMIT \?/);
    expect(renderValues(query)).toEqual([50]);
  });
});
