import { describe, it, expect } from "vitest";
import { visibleRows } from "@/lib/ansiTrim";

/**
 * Build flat [char, fg, bg] triplets from rows described as strings, with an
 * optional background per row. "  " is two blank cells.
 */
function cells(rows: Array<{ text: string; bg?: number }>, columns: number): number[] {
  const out: number[] = [];
  for (const r of rows) {
    for (let c = 0; c < columns; c++) {
      out.push(r.text.charCodeAt(c) || 0, 7, r.bg ?? 0);
    }
  }
  return out;
}

describe("visibleRows", () => {
  it("drops the blank rows under a one-line post", () => {
    const rows = [{ text: "HI" }, { text: "  " }, { text: "  " }];
    expect(visibleRows(cells(rows, 2), 2, 3)).toBe(1);
  });

  it("keeps blank rows that sit BETWEEN drawn rows", () => {
    const rows = [{ text: "HI" }, { text: "  " }, { text: "YO" }, { text: "  " }];
    expect(visibleRows(cells(rows, 2), 2, 4)).toBe(3);
  });

  it("treats NUL cells as blank -- an untouched canvas is zeroed, not spaced", () => {
    const data = [65, 7, 0, 65, 7, 0, 0, 0, 0, 0, 0, 0];
    expect(visibleRows(data, 2, 2)).toBe(1);
  });

  it("counts a coloured background as content -- filled blocks are drawings", () => {
    const rows = [{ text: "HI" }, { text: "  ", bg: 4 }, { text: "  " }];
    expect(visibleRows(cells(rows, 2), 2, 3)).toBe(2);
  });

  it("keeps every row when the last one is drawn on", () => {
    const rows = [{ text: "HI" }, { text: "  " }, { text: "YO" }];
    expect(visibleRows(cells(rows, 2), 2, 3)).toBe(3);
  });

  it("never returns zero for a canvas that is blank all the way down", () => {
    const rows = [{ text: "  " }, { text: "  " }];
    expect(visibleRows(cells(rows, 2), 2, 2)).toBe(1);
  });

  it("returns 0 for an empty canvas", () => {
    expect(visibleRows([], 0, 0)).toBe(0);
    expect(visibleRows([], 80, 0)).toBe(0);
  });
});
