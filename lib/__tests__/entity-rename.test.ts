import { describe, it, expect } from "vitest";
import { renameInCsv } from "../entityRename";

// Renaming an artist (e.g. the "Malcom-X" -> "Malcolm-X" typo fix) has to
// carry the handle into the tables that key on the name text rather than the
// id, or the rename silently orphans crew memberships and the denormalized
// comment columns. `comments.artist` and `comments.crew` are comma-joined
// lists, so a bare REPLACE would corrupt neighbouring names.

describe("renameInCsv", () => {
  it("renames a single-entry list", () => {
    expect(renameInCsv("Malcom-X", "Malcom-X", "Malcolm-X")).toBe("Malcolm-X");
  });

  it("renames one entry in a list and leaves the rest untouched", () => {
    expect(renameInCsv("dipswitch,Malcom-X,spot", "Malcom-X", "Malcolm-X"))
      .toBe("dipswitch,Malcolm-X,spot");
  });

  it("renames the first and last entries", () => {
    expect(renameInCsv("Malcom-X,spot", "Malcom-X", "Malcolm-X")).toBe("Malcolm-X,spot");
    expect(renameInCsv("spot,Malcom-X", "Malcom-X", "Malcolm-X")).toBe("spot,Malcolm-X");
  });

  it("never rewrites a name that merely contains the old one", () => {
    // A bare string REPLACE would turn "Malcom-Xtra" into "Malcolm-Xtra".
    expect(renameInCsv("Malcom-Xtra,zeus", "Malcom-X", "Malcolm-X")).toBe("Malcom-Xtra,zeus");
    expect(renameInCsv("XMalcom-X", "Malcom-X", "Malcolm-X")).toBe("XMalcom-X");
  });

  it("tolerates the spacing GROUP_CONCAT and hand edits leave behind", () => {
    expect(renameInCsv("dipswitch, Malcom-X , spot", "Malcom-X", "Malcolm-X"))
      .toBe("dipswitch,Malcolm-X,spot");
  });

  it("drops empty segments instead of emitting stray commas", () => {
    expect(renameInCsv("dipswitch,,spot", "Malcom-X", "Malcolm-X")).toBe("dipswitch,spot");
    expect(renameInCsv(",Malcom-X,", "Malcom-X", "Malcolm-X")).toBe("Malcolm-X");
  });

  it("handles empty and missing lists", () => {
    expect(renameInCsv(null, "a", "b")).toBe("");
    expect(renameInCsv(undefined, "a", "b")).toBe("");
    expect(renameInCsv("", "a", "b")).toBe("");
  });

  it("is a no-op when the old name is not in the list", () => {
    expect(renameInCsv("dipswitch,spot", "Malcom-X", "Malcolm-X")).toBe("dipswitch,spot");
  });
});
