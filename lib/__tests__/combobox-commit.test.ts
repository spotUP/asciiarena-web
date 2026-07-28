import { describe, expect, it } from "vitest";

import { resolveComboboxCommit } from "@/lib/combobox-commit";

/**
 * Regression: adding a colly saved no artist and no crew on the first attempt.
 *
 * The combobox only told its parent about a value from pick() -- clicking an
 * option or pressing Enter. Typing a name and going straight to Submit left the
 * text in the field's own state, so the form posted empty artistname[] and
 * crewname[] arrays. The only way to attach them was to edit the colly
 * afterwards, by which point the name was in the list and got picked properly.
 */
const ARTISTS = ["qBa", "Skin", "Desoto"];

describe("combobox commit on blur", () => {
  it("commits a name typed but never confirmed", () => {
    expect(resolveComboboxCommit("Zalo", "", ARTISTS, { allowCreate: true })).toBe("Zalo");
  });

  it("uses the list's spelling for a case-insensitive match", () => {
    // Otherwise "qba" creates a second artist differing only in case.
    expect(resolveComboboxCommit("qba", "", ARTISTS, { allowCreate: true })).toBe("qBa");
    expect(resolveComboboxCommit("QBA", "", ARTISTS, { allowCreate: false })).toBe("qBa");
  });

  it("refuses free text where the field cannot create entries", () => {
    expect(resolveComboboxCommit("Nonexistent", "", ARTISTS, { allowCreate: false })).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(resolveComboboxCommit("  Zalo  ", "", ARTISTS, { allowCreate: true })).toBe("Zalo");
  });

  it("says nothing when the text already matches what is held", () => {
    // Committing here would fire a pointless change on every focus-out.
    expect(resolveComboboxCommit("Skin", "Skin", ARTISTS, { allowCreate: true })).toBeNull();
    expect(resolveComboboxCommit("", "", ARTISTS, { allowCreate: true })).toBeNull();
  });

  it("honours clearing a field that had a value", () => {
    expect(resolveComboboxCommit("", "Skin", ARTISTS, { allowCreate: true })).toBe("");
    expect(resolveComboboxCommit("   ", "Skin", ARTISTS, { allowCreate: false })).toBe("");
  });
});
