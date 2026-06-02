import { describe, it, expect } from "vitest";
import {
  sortReleases,
  normalizeSortValue,
  type SortableRelease,
} from "../release-sort";

function rel(p: Partial<SortableRelease> & { filename: string }): SortableRelease {
  return { name: null, crew: null, year: null, ...p };
}

const names = (rows: SortableRelease[]) => rows.map((r) => r.filename);

describe("normalizeSortValue", () => {
  it("lowercases", () => {
    expect(normalizeSortValue("R21-AAP.ZIP")).toBe("r21-aap.zip");
  });

  it("strips leading non-alphanumeric characters", () => {
    expect(normalizeSortValue("!cool.txt")).toBe("cool.txt");
    expect(normalizeSortValue("  spaced")).toBe("spaced");
    expect(normalizeSortValue("^-_weird")).toBe("weird");
  });

  it("does not strip non-leading punctuation", () => {
    expect(normalizeSortValue("a!b")).toBe("a!b");
  });
});

describe("sortReleases by filename", () => {
  it("is case-insensitive (uppercase does not bubble to the top)", () => {
    const rows = [rel({ filename: "R21-AAP.ZIP" }), rel({ filename: "asc-w46.txt" })];
    // 'a' < 'r' case-insensitively, so asc-w46 comes first despite uppercase R.
    expect(names(sortReleases(rows, "filename", "asc"))).toEqual([
      "asc-w46.txt",
      "R21-AAP.ZIP",
    ]);
  });

  it("ignores leading punctuation when ordering", () => {
    const rows = [rel({ filename: "!zzz.txt" }), rel({ filename: "mmm.txt" })];
    // "!zzz" normalises to "zzz", which sorts after "mmm".
    expect(names(sortReleases(rows, "filename", "asc"))).toEqual([
      "mmm.txt",
      "!zzz.txt",
    ]);
  });

  it("reverses for descending", () => {
    const rows = [rel({ filename: "a.txt" }), rel({ filename: "b.txt" }), rel({ filename: "c.txt" })];
    expect(names(sortReleases(rows, "filename", "desc"))).toEqual([
      "c.txt",
      "b.txt",
      "a.txt",
    ]);
  });

  it("does not mutate the input array", () => {
    const rows = [rel({ filename: "b.txt" }), rel({ filename: "a.txt" })];
    const copy = [...rows];
    sortReleases(rows, "filename", "asc");
    expect(rows).toEqual(copy);
  });
});

describe("sortReleases by name", () => {
  it("falls back to the filename when name is blank or missing", () => {
    const rows = [
      rel({ filename: "zzz.txt", name: "Alpha" }),
      rel({ filename: "aaa.txt", name: "" }),
      rel({ filename: "mmm.txt", name: null }),
    ];
    // Blank names fall back to the filename. Effective sort keys are
    // "aaa.txt", "alpha", "mmm.txt" -> "aaa.txt" < "alpha" < "mmm.txt".
    expect(names(sortReleases(rows, "name", "asc"))).toEqual([
      "aaa.txt", // blank name -> "aaa.txt"
      "zzz.txt", // "Alpha"
      "mmm.txt", // null name -> "mmm.txt"
    ]);
  });
});

describe("sortReleases by crew", () => {
  it("keeps blank/unknown crews last in ascending order", () => {
    const rows = [
      rel({ filename: "a.txt", crew: null }),
      rel({ filename: "b.txt", crew: "Titan" }),
      rel({ filename: "c.txt", crew: "" }),
      rel({ filename: "d.txt", crew: "Avenge" }),
    ];
    expect(names(sortReleases(rows, "crew", "asc"))).toEqual([
      "d.txt", // Avenge
      "b.txt", // Titan
      "a.txt", // blank
      "c.txt", // blank
    ]);
  });

  it("keeps blank/unknown crews last even in descending order", () => {
    const rows = [
      rel({ filename: "a.txt", crew: null }),
      rel({ filename: "b.txt", crew: "Titan" }),
      rel({ filename: "d.txt", crew: "Avenge" }),
    ];
    const out = names(sortReleases(rows, "crew", "desc"));
    // Named crews reverse (Titan before Avenge); blank stays last.
    expect(out).toEqual(["b.txt", "d.txt", "a.txt"]);
  });
});

describe("sortReleases by year", () => {
  it("orders numerically and treats missing years as 0", () => {
    const rows = [
      rel({ filename: "a.txt", year: 2021 }),
      rel({ filename: "b.txt", year: null }),
      rel({ filename: "c.txt", year: 1999 }),
    ];
    expect(names(sortReleases(rows, "year", "asc"))).toEqual([
      "b.txt", // null -> 0
      "c.txt", // 1999
      "a.txt", // 2021
    ]);
    expect(names(sortReleases(rows, "year", "desc"))).toEqual([
      "a.txt",
      "c.txt",
      "b.txt",
    ]);
  });
});
