import { describe, it, expect } from "vitest";
import { AD_COLUMNS, parseJsonList } from "@/lib/bbsAdQueries";

describe("bbs ad shared columns", () => {
  it("keeps the reserved word groups backtick-quoted (digest 2512918052)", () => {
    expect(AD_COLUMNS).toContain("`groups`");
    expect(AD_COLUMNS).not.toMatch(/AS\s+groups\b/i);
  });

  it("parses stored JSON lists defensively", () => {
    expect(parseJsonList('["a","b"]')).toEqual(["a", "b"]);
    expect(parseJsonList("[]")).toEqual([]);
    expect(parseJsonList(null)).toEqual([]);
    expect(parseJsonList("nope{")).toEqual([]);
    expect(parseJsonList("[1,2]")).toEqual(["1", "2"]);
  });
});
