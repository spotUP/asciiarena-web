import { describe, it, expect } from "vitest";
import {
  formatPartialDate,
  parsePartialDate,
  isValidPartialDateString,
  isCompleteDateString,
} from "@/lib/partialDate";

describe("parsePartialDate — the year-only case that used to reset the field", () => {
  it("accepts a year with no month or day", () => {
    expect(parsePartialDate("1999-00-00")).toEqual({ y: 1999, m: 0, d: 0 });
  });

  it("accepts a year and month with no day", () => {
    expect(parsePartialDate("1999-07-00")).toEqual({ y: 1999, m: 7, d: 0 });
  });

  it("still accepts a complete date", () => {
    expect(parsePartialDate("1999-07-04")).toEqual({ y: 1999, m: 7, d: 4 });
  });
});

describe("parsePartialDate — rejections", () => {
  it("rejects a day with no month", () => {
    expect(parsePartialDate("1999-00-04")).toBeNull();
  });

  it("rejects a month outside 1..12", () => {
    expect(parsePartialDate("1999-13-01")).toBeNull();
  });

  it("rejects a day past the end of the month", () => {
    expect(parsePartialDate("1999-02-30")).toBeNull();
  });

  it("accepts Feb 29 in a leap year and rejects it otherwise", () => {
    expect(parsePartialDate("1996-02-29")).toEqual({ y: 1996, m: 2, d: 29 });
    expect(parsePartialDate("1999-02-29")).toBeNull();
  });

  it("rejects half-typed text so the form never sees a partial keystroke", () => {
    expect(parsePartialDate("1999-0")).toBeNull();
    expect(parsePartialDate("1999")).toBeNull();
    expect(parsePartialDate("")).toBeNull();
  });

  it("rejects year zero", () => {
    expect(parsePartialDate("0000-00-00")).toBeNull();
  });
});

describe("formatPartialDate", () => {
  it("renders a year-only date instead of blanking the field", () => {
    expect(formatPartialDate(1999, null, null)).toBe("1999-00-00");
    expect(formatPartialDate(1999, 0, 0)).toBe("1999-00-00");
  });

  it("renders a year+month date", () => {
    expect(formatPartialDate(1999, 7, 0)).toBe("1999-07-00");
  });

  it("renders a complete date zero-padded", () => {
    expect(formatPartialDate(1999, 7, 4)).toBe("1999-07-04");
  });

  it("returns empty when even the year is unknown", () => {
    expect(formatPartialDate(null, null, null)).toBe("");
    expect(formatPartialDate(0, 7, 4)).toBe("");
  });
});

describe("round-trip", () => {
  it("survives columns -> text -> columns for every level of precision", () => {
    for (const [y, m, d] of [[1999, 0, 0], [1999, 7, 0], [1999, 7, 4]] as const) {
      expect(parsePartialDate(formatPartialDate(y, m, d))).toEqual({ y, m, d });
    }
  });
});

describe("isCompleteDateString — used where a partial date is meaningless", () => {
  it("accepts only a full calendar date", () => {
    expect(isCompleteDateString("1999-07-04")).toBe(true);
    expect(isCompleteDateString("1999-07-00")).toBe(false);
    expect(isCompleteDateString("1999-00-00")).toBe(false);
  });

  it("is stricter than the partial check", () => {
    expect(isValidPartialDateString("1999-00-00")).toBe(true);
    expect(isCompleteDateString("1999-00-00")).toBe(false);
  });
});
