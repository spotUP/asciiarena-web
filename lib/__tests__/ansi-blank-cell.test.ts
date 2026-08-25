import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isBlankCell, isBlankPackedCell } from "@/lib/ansiTrim";

/**
 * Regression: a forum post drawn only in background colour could not be posted.
 *
 * "background color doesn't count as content, so you need to write something
 * even if you used background color to do something cute." The composer's
 * empty-canvas guard (AnsiEditor mount.ts isEmpty) read the character byte
 * alone, so a canvas of coloured spaces -- filled blocks, which is how much of
 * the art on the site is drawn -- looked exactly like an untouched canvas and
 * came back as "Draw something before you post".
 *
 * The render side (visibleRows) already had the rule right, which is why both
 * now go through the same predicate.
 */

/** The engine's packed cell: (charCode << 8) + (background << 4) + foreground. */
function packed(charCode: number, background: number, foreground = 7): number {
  return (charCode << 8) + (background << 4) + foreground;
}

describe("blank cell", () => {
  it("counts a space with a background colour as drawn", () => {
    expect(isBlankCell(32, 4)).toBe(false);
    expect(isBlankPackedCell(packed(32, 4))).toBe(false);
  });

  it("counts a NUL with a background colour as drawn", () => {
    // Fill tools paint the attribute without writing a character code.
    expect(isBlankCell(0, 1)).toBe(false);
    expect(isBlankPackedCell(packed(0, 1))).toBe(false);
  });

  it("still calls an untouched cell blank", () => {
    // A fresh canvas is a zeroed Uint16Array: char 0, background 0.
    expect(isBlankCell(0, 0)).toBe(true);
    expect(isBlankPackedCell(0)).toBe(true);
  });

  it("still calls a space on the default background blank", () => {
    expect(isBlankCell(32, 0)).toBe(true);
    expect(isBlankPackedCell(packed(32, 0))).toBe(true);
  });

  it("does not count a foreground colour on a space -- nothing of it shows", () => {
    expect(isBlankCell(32, 0)).toBe(true);
    expect(isBlankPackedCell(packed(32, 0, 12))).toBe(true);
  });

  it("counts a typed character as drawn", () => {
    expect(isBlankCell(65, 0)).toBe(false);
    expect(isBlankPackedCell(packed(65, 0))).toBe(false);
  });

  it("reads the background out of the packed cell, not the foreground", () => {
    // (bg << 4) + fg: mixing the two up would make a bright-white foreground
    // read as a background and let a plain space through as content.
    expect(isBlankPackedCell(packed(32, 0, 15))).toBe(true);
    expect(isBlankPackedCell(packed(32, 15, 0))).toBe(false);
  });
});

describe("editor empty-canvas guard", () => {
  const mount = readFileSync(
    path.join(process.cwd(), "components/ui/AnsiEditor/mount.ts"),
    "utf8",
  );

  it("asks the shared predicate rather than re-deriving blank from the char byte", () => {
    expect(mount).toMatch(/isEmpty\(\): boolean \{[\s\S]*?isBlankPackedCell\(cells\[i\]\)/);
    expect(mount).toMatch(/import \{ isBlankPackedCell \} from "@\/lib\/ansiTrim";/);
  });
});
