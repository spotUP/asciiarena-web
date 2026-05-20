import { describe, it, expect } from "vitest";
import { urlsafe, formatBytes, pluralize, combinize, safeSort, COLLY_SORT_COLS } from "@/lib/utils";

describe("urlsafe", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(urlsafe("Up Rough")).toBe("up-rough");
  });

  it("strips non-alphanumeric characters", () => {
    expect(urlsafe("Divine Stylers!")).toBe("divine-stylers");
  });

  it("collapses multiple hyphens", () => {
    expect(urlsafe("a  b")).toBe("a-b");
  });

  it("handles empty string", () => {
    expect(urlsafe("")).toBe("");
  });

  it("strips trailing hyphens", () => {
    expect(urlsafe("hello-")).toBe("hello");
  });

  it("handles unicode by transliterating", () => {
    const result = urlsafe("Ångström");
    expect(result).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("formatBytes", () => {
  it("formats bytes below 1 KB as B", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
});

describe("pluralize", () => {
  it("joins two items with default sep", () => {
    expect(pluralize(["A", "B"])).toBe("A & B");
  });

  it("joins three items with comma + final sep", () => {
    expect(pluralize(["A", "B", "C"])).toBe("A, B & C");
  });

  it("returns single item unchanged", () => {
    expect(pluralize(["A"])).toBe("A");
  });

  it("returns empty string for empty array", () => {
    expect(pluralize([])).toBe("");
  });
});

describe("combinize", () => {
  it("builds links from comma-separated names", () => {
    const result = combinize("Alice, Bob", "/artist/", "fallback");
    expect(result).toContain('href="/artist/alice"');
    expect(result).toContain('href="/artist/bob"');
  });

  it("returns fallback for empty input", () => {
    expect(combinize("", "/artist/", "none")).toBe("none");
  });
});

describe("safeSort", () => {
  it("returns the column when it is in the whitelist", () => {
    expect(safeSort("name", COLLY_SORT_COLS, "name")).toBe("name");
    expect(safeSort("filename", COLLY_SORT_COLS, "name")).toBe("filename");
    expect(safeSort("cdate", COLLY_SORT_COLS, "name")).toBe("cdate");
  });

  it("returns the fallback for an unknown column", () => {
    expect(safeSort("unknown", COLLY_SORT_COLS, "name")).toBe("name");
  });

  it("rejects SQL injection attempts", () => {
    expect(safeSort("name; DROP TABLE collys--", COLLY_SORT_COLS, "name")).toBe("name");
    expect(safeSort("1 OR 1=1", COLLY_SORT_COLS, "name")).toBe("name");
    expect(safeSort("(SELECT pwhash FROM users)", COLLY_SORT_COLS, "name")).toBe("name");
  });
});
