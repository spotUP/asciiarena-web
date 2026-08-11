import { describe, expect, it } from "vitest";
import { isValidPassword, PASSWORD_RULE_TEXT } from "@/lib/accountRules";

// The shared password rule replaced four drifted private copies. The 8-char
// minimum came only from the reset flow; register/settings/admin must now
// enforce it too, so the short-password case is the regression to guard.
describe("isValidPassword", () => {
  it("accepts a password meeting every requirement", () => {
    expect(isValidPassword("Str0ng!pass")).toBe(true);
  });

  it("rejects passwords shorter than 8 characters even with all classes", () => {
    expect(isValidPassword("Aa1!bcd")).toBe(false);
  });

  it("accepts exactly 8 characters with all classes", () => {
    expect(isValidPassword("Aa1!bcde")).toBe(true);
  });

  it("rejects a password without an uppercase letter", () => {
    expect(isValidPassword("weak1!password")).toBe(false);
  });

  it("rejects a password without a lowercase letter", () => {
    expect(isValidPassword("WEAK1!PASSWORD")).toBe(false);
  });

  it("rejects a password without a digit", () => {
    expect(isValidPassword("Weak!password")).toBe(false);
  });

  it("rejects a password without a special character", () => {
    expect(isValidPassword("Weak1password")).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isValidPassword("")).toBe(false);
  });

  it("states the 8-character minimum in the user-facing rule text", () => {
    expect(PASSWORD_RULE_TEXT).toContain("8 characters");
  });
});
