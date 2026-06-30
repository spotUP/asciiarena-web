import { describe, it, expect } from "vitest";
import { normalizeHandle, labelTokens, resolveEntities, type EntityDicts } from "@/lib/handleMatch";

const DICTS: EntityDicts = {
  artists: [
    { id: 10, norm: normalizeHandle("browallia") },
    { id: 11, norm: normalizeHandle("mort") },
    { id: 12, norm: normalizeHandle("zito") },
  ],
  crews: [
    { id: 20, norm: normalizeHandle("up rough") }, // -> "uprough"
    { id: 21, norm: normalizeHandle("nukleus") },
  ],
  users: [
    { id: 30, norm: normalizeHandle("spot") },
    { id: 31, norm: normalizeHandle("zo") }, // 2 chars -> skipped in v1
  ],
};

describe("normalizeHandle", () => {
  it("strips case, punctuation, diacritics, spaces", () => {
    expect(normalizeHandle("uP rOUGH")).toBe("uprough");
    expect(normalizeHandle("nUkLEUs.nFO")).toBe("nukleusnfo");
    expect(normalizeHandle("z!o")).toBe("zo");
  });
});

describe("labelTokens", () => {
  it("drops noise words, pure numbers, and short fragments", () => {
    expect(labelTokens("3o ! bROwAlliA 4 nUkLEUs.nFO : o3")).toEqual(["3o", "browallia", "nukleus", "o3"]);
    expect(labelTokens("- nukleus presents -")).toEqual(["nukleus"]);
  });
});

describe("resolveEntities", () => {
  it("matches a multi-word crew name spaced out in the label", () => {
    expect(resolveEntities("uP rOUGH", DICTS).crew_id).toBe(20);
  });

  it("matches both an artist and a crew in a framed name-box label", () => {
    const r = resolveEntities("3o ! bROwAlliA 4 nUkLEUs.nFO : o3", DICTS);
    expect(r.artist_id).toBe(10); // browallia
    expect(r.crew_id).toBe(21); // nukleus
  });

  it("matches a user handle exactly", () => {
    expect(resolveEntities("spot", DICTS).user_id).toBe(30);
  });

  it("does not match 'spot' inside 'spotlight' (no over-eager containment for short handles)", () => {
    const r = resolveEntities("spotlight productions", DICTS);
    expect(r.user_id).toBeUndefined();
  });

  it("skips too-short/symbol handles in v1 (z!o)", () => {
    expect(resolveEntities("z!o", DICTS).user_id).toBeUndefined();
  });

  it("returns nothing for a label with no real handles", () => {
    expect(resolveEntities("- presents - 2026", DICTS)).toEqual({});
  });
});
