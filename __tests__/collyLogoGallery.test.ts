import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { sliceSnippet } from "@/lib/collyLogoGallery";

const TEXT = [
  "intro line",        // 0
  "",                  // 1
  "  ___  ___  ___",   // 2  <- logo starts
  " / __||  _|| _ \\", // 3
  " \\__ \\| _ |  _/",  // 4
  "",                  // 5  <- logo ends
  "next section",      // 6
].join("\n");

describe("sliceSnippet", () => {
  it("slices the exact line range and trims surrounding blank lines", () => {
    // logo spans lines 2..5 (0-based), but line 5 is blank -> trimmed
    expect(sliceSnippet(TEXT, 2, 5)).toEqual([
      "  ___  ___  ___",
      " / __||  _|| _ \\",
      " \\__ \\| _ |  _/",
    ]);
  });

  it("falls back to a preview window when end is null", () => {
    const out = sliceSnippet(TEXT, 2, null);
    expect(out[0]).toBe("  ___  ___  ___");
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns empty for an all-blank range", () => {
    expect(sliceSnippet("a\n\n\n\nb", 1, 3)).toEqual([]);
  });

  it("caps overly long lines", () => {
    const long = "x".repeat(200);
    expect(sliceSnippet(long, 0, 0)[0].length).toBe(80);
  });
});
