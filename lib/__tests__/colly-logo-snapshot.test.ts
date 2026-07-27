import { describe, it, expect } from "vitest";
import { serializeLogoMap, parseLogoMap, logoCountOf } from "../collyLogoSnapshot";

// Each save appends a snapshot of the whole map. The newest snapshot for a
// colly IS its current map, so a round trip that loses or reorders an entry
// silently corrupts the colly.

const map = [
  { line: 12, end: 20, caption: "dipswitch" },
  { line: 21, caption: "NEXUS -spot for zeus" },
];

describe("logo map snapshots", () => {
  it("round trips a map unchanged", () => {
    expect(parseLogoMap(serializeLogoMap(map))).toEqual(map);
  });

  it("round trips an empty map", () => {
    expect(parseLogoMap(serializeLogoMap([]))).toEqual([]);
  });

  it("sorts entries by line so a snapshot has one canonical form", () => {
    const unsorted = [{ line: 21, caption: "b" }, { line: 12, caption: "a" }];
    expect(parseLogoMap(serializeLogoMap(unsorted)).map((e) => e.line)).toEqual([12, 21]);
  });

  it("drops an absent end rather than storing null", () => {
    expect(serializeLogoMap([{ line: 5, caption: "x" }])).not.toMatch(/null/);
  });

  it("counts the entries saved, not the rows the catalog will keep", () => {
    // buildLogoRow drops uncaptioned entries; logo_count records what the user
    // actually mapped, and the panel reports the difference as a warning.
    expect(logoCountOf(map)).toBe(2);
    expect(logoCountOf([{ line: 1, caption: "" }, { line: 2, caption: "real" }])).toBe(2);
    expect(logoCountOf([])).toBe(0);
  });

  it("returns an empty map for stored garbage instead of throwing", () => {
    // A row written by an older format must never break the release page.
    expect(parseLogoMap("not json")).toEqual([]);
    expect(parseLogoMap("")).toEqual([]);
    expect(parseLogoMap('{"line":1}')).toEqual([]);
    expect(parseLogoMap('[{"line":0,"caption":"bad"}]')).toEqual([]);
  });
});
