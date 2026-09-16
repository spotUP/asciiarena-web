import { describe, it, expect } from "vitest";
import { normalizeBbsName, matchBbs } from "@/lib/bbsAdMatch";

describe("normalizeBbsName", () => {
  it.each([
    ["The Yard", "the yard"],
    ["Akira (416)", "akira"],
    ["State of Euphoria (713)", "state of euphoria"],
    ["7th Heaven", "7th heaven"],
    ["Mönninkylä", "monninkyla"],
    ["  Spaced--Out!! ", "spaced out"],
  ])("normalizes %s to %s", (raw, want) => {
    expect(normalizeBbsName(raw)).toBe(want);
  });
});

describe("matchBbs", () => {
  const candidates = [
    { id: 1, name: "The Yard", demozoo_id: null },
    { id: 2, name: "Akira", demozoo_id: null },
    { id: 3, name: "Linked Board", demozoo_id: 347 },
  ];

  it("prefers an existing demozoo_id link", () => {
    expect(matchBbs(347, "Something Else", candidates)).toEqual({ kind: "demozoo_id", id: 3 });
  });

  it("matches on normalized name across dialing-code qualifiers", () => {
    expect(matchBbs(9999, "Akira (416)", candidates)).toEqual({ kind: "name", id: 2 });
  });

  it("creates genuinely new BBSes", () => {
    expect(matchBbs(555, "Brand New Board", candidates)).toEqual({ kind: "create" });
  });

  it("reports ambiguous duplicates instead of merging", () => {
    const dupes = [...candidates, { id: 4, name: "THE YARD", demozoo_id: null }];
    expect(matchBbs(777, "The Yard", dupes)).toEqual({ kind: "ambiguous", ids: [1, 4] });
  });
});
