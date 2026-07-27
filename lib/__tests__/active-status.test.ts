import { describe, it, expect } from "vitest";
import { ACTIVE_STATUSES, activeStatusLabel, normalizeActiveStatus } from "../activeStatus";

// Regression: artist profiles printed the raw `artists.active` column, so a
// row written by the admin editor showed a bare "yes" instead of "Active"
// (https://asciiarena.se/artist/malcom-x). The column holds three historical
// vocabularies at once — legacy PHP "Active"/"Inactive", admin crews
// "Yes"/"No", admin artists "yes"/"no".

describe("normalizeActiveStatus", () => {
  it("reads every legacy spelling of an active artist", () => {
    for (const raw of ["Active", "active", "yes", "Yes", "YES", "y", "1", "true", " yes "]) {
      expect(normalizeActiveStatus(raw)).toBe("Active");
    }
  });

  it("reads every legacy spelling of an inactive artist", () => {
    for (const raw of ["Inactive", "inactive", "no", "No", "NO", "n", "0", "false"]) {
      expect(normalizeActiveStatus(raw)).toBe("Inactive");
    }
  });

  it("reads the ex-member spellings", () => {
    for (const raw of ["ex-member", "Ex-Member", "exmember", "ex"]) {
      expect(normalizeActiveStatus(raw)).toBe("Ex-member");
    }
  });

  it("returns null for empty and unrecognised values", () => {
    for (const raw of [null, undefined, "", "   ", "maybe"]) {
      expect(normalizeActiveStatus(raw)).toBeNull();
    }
  });

  it("is idempotent on its own canonical output", () => {
    for (const status of ACTIVE_STATUSES) expect(normalizeActiveStatus(status)).toBe(status);
  });
});

describe("activeStatusLabel", () => {
  it("never shows the raw yes/no the profile page used to print", () => {
    expect(activeStatusLabel("yes")).toBe("Active");
    expect(activeStatusLabel("No")).toBe("Inactive");
  });

  it("falls back to a placeholder instead of blanking the field", () => {
    expect(activeStatusLabel(null)).toBe("-");
    expect(activeStatusLabel("")).toBe("-");
    expect(activeStatusLabel("maybe", "unknown")).toBe("unknown");
  });

  it("uses full words, never abbreviations", () => {
    for (const status of ACTIVE_STATUSES) expect(status.length).toBeGreaterThan(2);
  });
});
