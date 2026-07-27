import { describe, it, expect } from "vitest";
import { collyPatchSchema } from "../adminCollyPatch";

// The admin colly editor echoes the row's current values back on every save.
// Legacy rows carry NULL in name/type/broken, so a schema that only accepts
// string|number-or-absent rejects the payload and the admin gets a bare
// "Save failed (400)" they cannot work around.

// A payload shaped exactly like the one app/admin/collys/CollysClient.tsx
// sends for a legacy colly: nulls where the DB row has NULL.
const legacyPayload = {
  id: 1234,
  filename: "AC!-ROA.TXT",
  name: null,
  year: 1994,
  month: 9,
  day: 4,
  type: null,
  file_id: null,
  broken: null,
  broken_comment: null,
  artistNames: ["Rapid"],
  crewNames: [],
  render_font: "",
  render_fg: "",
  render_bg: "",
  soundtrack: "",
};

describe("collyPatchSchema", () => {
  it("accepts a legacy colly whose name, type and broken columns are NULL", () => {
    const parsed = collyPatchSchema.safeParse(legacyPayload);
    expect(parsed.success).toBe(true);
  });

  it("accepts a date-only edit on a legacy colly (the reported save failure)", () => {
    const parsed = collyPatchSchema.safeParse({ ...legacyPayload, year: 1994, month: 9, day: 4 });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.month).toBe(9);
      expect(parsed.data.day).toBe(4);
    }
  });

  it("accepts a fully populated colly", () => {
    const parsed = collyPatchSchema.safeParse({
      ...legacyPayload,
      name: "Rebirth of Art",
      type: "ASCII",
      broken: 0,
      broken_comment: "missing lines",
      render_font: "TopazPlus_a1200",
      render_fg: "#aaaaaa",
      render_bg: "#000000",
      soundtrack: "mod.enigma",
      logos: [{ line: 12, end: 20, caption: "dipswitch" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("still rejects a missing id", () => {
    expect(collyPatchSchema.safeParse({ ...legacyPayload, id: undefined }).success).toBe(false);
  });

  it("still rejects wrong types and over-long values", () => {
    expect(collyPatchSchema.safeParse({ ...legacyPayload, year: "1994" }).success).toBe(false);
    expect(collyPatchSchema.safeParse({ ...legacyPayload, filename: "x".repeat(61) }).success).toBe(false);
    expect(collyPatchSchema.safeParse({ ...legacyPayload, broken: 1.5 }).success).toBe(false);
    expect(collyPatchSchema.safeParse({ ...legacyPayload, logos: [{ line: 0, caption: "x" }] }).success).toBe(false);
  });
});
