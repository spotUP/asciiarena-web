import { describe, it, expect } from "vitest";
import { logoMapSchema } from "../logoMapPayload";

// One schema guards both the admin PATCH and the public tagging route. A map
// that one accepts and the other rejects is the bug this prevents.

describe("logoMapSchema", () => {
  it("accepts a hand-mapped colly", () => {
    const parsed = logoMapSchema.safeParse([
      { line: 12, end: 20, caption: "dipswitch" },
      { line: 21, caption: "NEXUS -spot for zeus" },
    ]);
    expect(parsed.success).toBe(true);
  });

  it("accepts an empty map, which clears the colly's tags", () => {
    expect(logoMapSchema.safeParse([]).success).toBe(true);
  });

  it("rejects lines that cannot exist", () => {
    expect(logoMapSchema.safeParse([{ line: 0, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: -3, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: 1.5, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: "12", caption: "x" }]).success).toBe(false);
  });

  it("rejects an end before its start", () => {
    expect(logoMapSchema.safeParse([{ line: 20, end: 12, caption: "x" }]).success).toBe(false);
  });

  it("accepts an end equal to its start (a one-line logo)", () => {
    expect(logoMapSchema.safeParse([{ line: 20, end: 20, caption: "x" }]).success).toBe(true);
  });

  it("rejects captions longer than the label column", () => {
    expect(logoMapSchema.safeParse([{ line: 1, caption: "x".repeat(201) }]).success).toBe(false);
  });

  it("caps the number of entries so one request cannot flood the catalog", () => {
    const huge = Array.from({ length: 501 }, (_, i) => ({ line: i + 1, caption: "x" }));
    expect(logoMapSchema.safeParse(huge).success).toBe(false);
  });
});
