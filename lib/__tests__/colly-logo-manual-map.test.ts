import { describe, it, expect, vi } from "vitest";

// A colly tagged before public tagging existed has its hand-curated map ONLY
// as `colly_logos` rows. Two places have to read that map back: the logos GET
// (to seed the editor) and the baseline snapshot the first public save takes
// before it overwrites those rows. If the two conversions ever disagree, the
// baseline preserves something different from what the editor showed -- so
// they share this one function.

const manualRows: { start_line: number; end_line: number | null; label: string }[] = [];
const findManyArgs: unknown[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    colly_logos: {
      findMany: (args: unknown) => {
        findManyArgs.push(args);
        return Promise.resolve(manualRows);
      },
    },
  },
}));

const { manualRowsToLogoMap, readManualLogoMap } = await import("../collyLogoManualMap");

describe("manualRowsToLogoMap", () => {
  it("converts 0-based catalog lines to the 1-based map the editor speaks", () => {
    expect(manualRowsToLogoMap([
      { start_line: 4, end_line: 7, label: "old admin tag" },
      { start_line: 20, end_line: null, label: "another old tag" },
    ])).toEqual([
      { line: 5, end: 8, caption: "old admin tag" },
      { line: 21, caption: "another old tag" },
    ]);
  });

  it("omits `end` entirely for an open-ended row", () => {
    const [entry] = manualRowsToLogoMap([{ start_line: 0, end_line: null, label: "x" }]);
    expect(Object.prototype.hasOwnProperty.call(entry, "end")).toBe(false);
  });

  it("returns an empty map for a colly with no manual rows", () => {
    expect(manualRowsToLogoMap([])).toEqual([]);
  });
});

describe("readManualLogoMap", () => {
  it("reads the manual rows in catalog order", async () => {
    manualRows.length = 0;
    manualRows.push({ start_line: 4, end_line: 7, label: "old admin tag" });
    findManyArgs.length = 0;
    const map = await readManualLogoMap(4122);
    expect(map).toEqual([{ line: 5, end: 8, caption: "old admin tag" }]);
    // Ordering is part of the contract: the baseline snapshot and the editor
    // must list the same entries in the same order.
    expect(findManyArgs[0]).toMatchObject({
      where: { colly_id: 4122, manual: 1 },
      orderBy: { position: "asc" },
    });
  });
});
