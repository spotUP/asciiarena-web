import { describe, it, expect } from "vitest";
import { isValidDateString } from "@/components/ui/DatePicker";

// Feature request: dates had to be clicked in through the calendar because the
// picker's text input was readOnly. Typing is now allowed, but the value is
// only committed once the text is a real calendar date — a form must never
// receive a half-typed "1994-0" or an impossible "1994-02-30".

describe("isValidDateString", () => {
  it("accepts a fully typed release date", () => {
    expect(isValidDateString("1994-09-04")).toBe(true);
    expect(isValidDateString("2026-07-27")).toBe(true);
  });

  it("rejects every intermediate state of typing 1994-09-04", () => {
    for (const partial of ["1", "19", "199", "1994", "1994-", "1994-0", "1994-09", "1994-09-", "1994-09-0"]) {
      expect(isValidDateString(partial)).toBe(false);
    }
  });

  it("rejects days that do not exist in that month", () => {
    expect(isValidDateString("1994-02-30")).toBe(false);
    expect(isValidDateString("1994-04-31")).toBe(false);
    expect(isValidDateString("1994-13-01")).toBe(false);
    expect(isValidDateString("1994-00-10")).toBe(false);
    expect(isValidDateString("1994-09-00")).toBe(false);
  });

  it("gets leap years right", () => {
    expect(isValidDateString("1996-02-29")).toBe(true);
    expect(isValidDateString("1900-02-29")).toBe(false);
    expect(isValidDateString("2000-02-29")).toBe(true);
    expect(isValidDateString("1999-02-29")).toBe(false);
  });

  it("rejects loose formats that are not YYYY-MM-DD", () => {
    for (const bad of ["", "  ", "1994-9-4", "04/09/1994", "1994.09.04", "94-09-04", "1994-09-04 ", "not-a-date"]) {
      expect(isValidDateString(bad)).toBe(false);
    }
  });
});
