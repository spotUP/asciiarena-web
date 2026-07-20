import { describe, it, expect } from "vitest";
import { canClaimHandle, isRankLoginBlocked, ACTIVE_RANK, INACTIVE_RANK } from "@/lib/accountRules";

describe("canClaimHandle", () => {
  // The bug: harrisonbergeron claimed the artist handle "Goto80" — a handle
  // that is not their nick — because the claim endpoint matched any nick.
  it("rejects claiming a handle that is not the user's nick", () => {
    expect(canClaimHandle("harrisonbergeron", "Goto80")).toBe(false);
  });

  it("allows claiming a handle equal to the user's nick, case-insensitively", () => {
    expect(canClaimHandle("hARRiSONbERGEROn", "harrisonbergeron")).toBe(true);
    expect(canClaimHandle("Goto80", "goto80")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(canClaimHandle("  goto80 ", "goto80")).toBe(true);
  });

  it("rejects empty / null nicks so a blank session can never claim", () => {
    expect(canClaimHandle("", "goto80")).toBe(false);
    expect(canClaimHandle(null, "goto80")).toBe(false);
    expect(canClaimHandle("goto80", null)).toBe(false);
    expect(canClaimHandle("", "")).toBe(false);
  });
});

describe("isRankLoginBlocked", () => {
  // The bug: a freshly-registered "Inactive" user could log in and use the site
  // because authorize() never checked rank; the emailed activation link was
  // therefore meaningless.
  it("blocks login for an Inactive (not-yet-activated) account", () => {
    expect(isRankLoginBlocked(INACTIVE_RANK)).toBe(true);
  });

  it("permits login for an activated Member and every legacy rank", () => {
    expect(isRankLoginBlocked(ACTIVE_RANK)).toBe(false);
    expect(isRankLoginBlocked("Admin")).toBe(false);
    expect(isRankLoginBlocked("Senior Member")).toBe(false);
    expect(isRankLoginBlocked(null)).toBe(false);
    expect(isRankLoginBlocked("")).toBe(false);
  });
});
