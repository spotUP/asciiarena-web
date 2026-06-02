import { describe, it, expect } from "vitest";
import {
  computeSortHeaders,
  normalizeOrder,
  resolveActiveKey,
  type SortColumn,
} from "../sort-headers";

const COLUMNS: SortColumn[] = [
  { key: "c.filename", label: "Filename" },
  { key: "c.name", label: "Name" },
  { key: "w.name", label: "Crew" },
  { key: "c.year", label: "Release Date" },
];
const DEFAULT = "c.filename";

describe("normalizeOrder", () => {
  it("treats only the literal 'desc' as descending", () => {
    expect(normalizeOrder("desc")).toBe("desc");
  });

  it("defaults to ascending for missing, empty, or garbage values", () => {
    expect(normalizeOrder(undefined)).toBe("asc");
    expect(normalizeOrder("")).toBe("asc");
    expect(normalizeOrder("DESC")).toBe("asc"); // case-sensitive on purpose
    expect(normalizeOrder("nonsense")).toBe("asc");
  });
});

describe("resolveActiveKey", () => {
  it("falls back to the default key when sort_by is missing", () => {
    expect(resolveActiveKey(COLUMNS, undefined, DEFAULT)).toBe("c.filename");
  });

  it("falls back to the default key when sort_by is unknown (never points the arrow at the wrong column)", () => {
    expect(resolveActiveKey(COLUMNS, "c.injection", DEFAULT)).toBe("c.filename");
  });

  it("keeps a recognised sort_by", () => {
    expect(resolveActiveKey(COLUMNS, "w.name", DEFAULT)).toBe("w.name");
  });
});

describe("computeSortHeaders", () => {
  it("marks exactly one column active and arrows only that one", () => {
    const headers = computeSortHeaders(COLUMNS, "c.name", "asc", DEFAULT);
    const active = headers.filter((h) => h.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].key).toBe("c.name");
    for (const h of headers) {
      expect(h.arrow).toBe(h.isActive ? " ^" : "");
    }
  });

  it("shows ^ for ascending and v for descending on the active column", () => {
    const asc = computeSortHeaders(COLUMNS, "c.year", "asc", DEFAULT);
    const desc = computeSortHeaders(COLUMNS, "c.year", "desc", DEFAULT);
    expect(asc.find((h) => h.key === "c.year")!.arrow).toBe(" ^");
    expect(desc.find((h) => h.key === "c.year")!.arrow).toBe(" v");
  });

  it("uses ASCII-only arrows (no unicode glyphs)", () => {
    const headers = computeSortHeaders(COLUMNS, "c.year", "desc", DEFAULT);
    for (const h of headers) {
      // eslint-disable-next-line no-control-regex
      expect(h.arrow).toMatch(/^[\x00-\x7F]*$/);
    }
  });

  it("toggles the active column's direction on next click, but starts other columns ascending", () => {
    const headers = computeSortHeaders(COLUMNS, "c.name", "asc", DEFAULT);
    // Re-clicking the active ascending column flips it to descending.
    expect(headers.find((h) => h.key === "c.name")!.href).toBe(
      "?sort_by=c.name&order=desc",
    );
    // A different column always starts ascending.
    expect(headers.find((h) => h.key === "w.name")!.href).toBe(
      "?sort_by=w.name&order=asc",
    );
  });

  it("flips a descending active column back to ascending", () => {
    const headers = computeSortHeaders(COLUMNS, "c.name", "desc", DEFAULT);
    expect(headers.find((h) => h.key === "c.name")!.href).toBe(
      "?sort_by=c.name&order=asc",
    );
  });

  it("defaults the arrow onto the fallback column when no sort is selected", () => {
    const headers = computeSortHeaders(COLUMNS, undefined, "asc", DEFAULT);
    expect(headers.find((h) => h.key === DEFAULT)!.isActive).toBe(true);
    expect(headers.find((h) => h.key === DEFAULT)!.arrow).toBe(" ^");
  });

  it("tags active vs inactive columns with the right classes", () => {
    const headers = computeSortHeaders(COLUMNS, "w.name", "asc", DEFAULT);
    expect(headers.find((h) => h.key === "w.name")!.className).toBe(
      "sort-header sort-header-active",
    );
    expect(headers.find((h) => h.key === "c.name")!.className).toBe("sort-header");
  });
});
