import { describe, it, expect } from "vitest";
import { normalizeHandle, labelTokens, resolveEntities, isLikelyLogoLabel, cleanLabel, type EntityDicts } from "@/lib/handleMatch";

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

  it("splits digit connectors so glued handles separate ('spot 4 asciiarena')", () => {
    const t = labelTokens("sPOt 4 aSCiiARENa");
    expect(t).toContain("spot");
    expect(t).toContain("asciiarena");
  });
});

describe("cleanLabel", () => {
  it("strips leading/trailing logo counters and separators", () => {
    expect(cleanLabel("61 | sPOt4aSCiiARENa (dIZ) | 16")).toBe("sPOt4aSCiiARENa (dIZ)");
    expect(cleanLabel("o5 ! bROwAlliA4nUkLEUs.nFO : o5")).toBe("bROwAlliA4nUkLEUs.nFO");
    expect(cleanLabel("7o ! mAki4mAkIrOOtS.dIZ : o7")).toBe("mAki4mAkIrOOtS.dIZ");
  });

  it("truncates very long labels", () => {
    const out = cleanLabel("x".repeat(80));
    expect(out.length).toBeLessThanOrEqual(48);
    expect(out.endsWith("…")).toBe(true);
  });

  it("leaves a clean label unchanged", () => {
    expect(cleanLabel("up rough")).toBe("up rough");
  });
});

describe("isLikelyLogoLabel", () => {
  it("keeps real handle-like labels (even ones not in the DB)", () => {
    for (const ok of ["Fairlight", "lITHIUM", "BlueZone", "DarkConflict", "up rough", "darius zendeh"]) {
      expect(isLikelyLogoLabel(ok)).toBe(true);
    }
  });

  it("drops scrolltext / run-on prose", () => {
    for (const no of [
      "nOnEEDtOcRY - tHE7tHcOLLECTiONbYpasz",
      "Dennacoolygjordesenregnigsaturdaynig",
      "ViEWthiSPROdUCtiONONAMiGA",
    ]) {
      expect(isLikelyLogoLabel(no)).toBe(false);
    }
  });

  it("drops ascii-art fragments (mostly symbols)", () => {
    for (const no of ["l__\\\\ '\\ '\\__/,(__/", "C.D.| ------](___", "l | \\_____| l"]) {
      expect(isLikelyLogoLabel(no)).toBe(false);
    }
  });

  it("drops section words and 2-char noise", () => {
    for (const no of ["LOGO", "pRESENTS", "REQUEST", "uPLOAd", "credits", "hs", "oO", "XX"]) {
      expect(isLikelyLogoLabel(no)).toBe(false);
    }
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

  it("resolves a handle glued to a word by a digit connector ('sPOt4aSCiiARENa')", () => {
    expect(resolveEntities("61 | sPOt4aSCiiARENa (dIZ) | 16", DICTS).user_id).toBe(30);
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
