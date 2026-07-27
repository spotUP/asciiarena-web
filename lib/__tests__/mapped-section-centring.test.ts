import { describe, it, expect } from "vitest";
import { sectionsFromLogoMap } from "../collyTrailer";
import { inkBoundsIn, computeScrollTarget } from "../logoSections";

// Regression: hand-tagged logos were not vertically centred during autoplay
// (reported on https://www.asciiarena.se/release/ht-hc2.txt).
//
// computeScrollTarget centres inkTop..inkBottom, and that maths was fine. The
// bug was that a MAPPED section set inkTop/inkBottom to the raw dragged range,
// so any blank padding in the selection pushed the art off centre -- and an
// entry marked with a start but no explicit end ran all the way to the next
// logo, which is mostly empty space.

const BLANK = "";
const ART = "  ####  ";
// A logo with two blank rows above and three below, inside a 20-line colly.
const lines = [
  BLANK, BLANK,          // 0-1
  ART, ART, ART,         // 2-4  <- the actual art
  BLANK, BLANK, BLANK,   // 5-7
  ART, ART,              // 8-9  <- a second logo
  BLANK,                 // 10
];
const text = lines.join("\n");

describe("inkBoundsIn", () => {
  it("finds the art rows inside a padded range", () => {
    expect(inkBoundsIn(text, 0, 7)).toEqual({ inkTop: 2, inkBottom: 4 });
  });

  it("falls back to the range when it holds no art at all", () => {
    expect(inkBoundsIn(text, 5, 7)).toEqual({ inkTop: 5, inkBottom: 7 });
  });

  it("decodes the escaped entities the viewer's text carries", () => {
    // The release page hands over HTML-escaped art, so a line of "&lt;&gt;"
    // is two ink characters, not eight.
    const escaped = ["", "&lt;&gt;&amp;", ""].join("\n");
    expect(inkBoundsIn(escaped, 0, 2)).toEqual({ inkTop: 1, inkBottom: 1 });
  });
});

describe("sectionsFromLogoMap", () => {
  it("centres on the art, not on the dragged selection", () => {
    // Tagger dragged lines 1..8 (1-based) around a logo whose art is rows 2-4.
    const [s] = sectionsFromLogoMap([{ line: 1, end: 8, caption: "logo" }], lines.length, text);
    expect(s.startLine).toBe(0);
    expect(s.endLine).toBe(7);
    expect(s.inkTop).toBe(2);
    expect(s.inkBottom).toBe(4);
  });

  it("does not stretch the ink box to the next logo when no end was marked", () => {
    // Marking only a start used to span everything up to the next logo, so the
    // "centre" landed in the blank gap between them.
    const [first] = sectionsFromLogoMap(
      [{ line: 3, caption: "one" }, { line: 9, caption: "two" }],
      lines.length,
      text,
    );
    expect(first.endLine).toBe(7);      // range still runs to just before the next
    expect(first.inkTop).toBe(2);       // but centring uses the art only
    expect(first.inkBottom).toBe(4);
  });

  it("keeps the old behaviour when no text is available", () => {
    const [s] = sectionsFromLogoMap([{ line: 1, end: 8, caption: "logo" }], lines.length);
    expect(s.inkTop).toBe(0);
    expect(s.inkBottom).toBe(7);
  });

  it("puts the art's centre at the viewport's centre", () => {
    const [s] = sectionsFromLogoMap([{ line: 1, end: 8, caption: "logo" }], lines.length, text);
    const lineHeight = 16;
    // Small enough that the ideal target is positive: a taller viewport would
    // clamp to scrollTop 0, which is correct but tests the clamp, not centring.
    const viewH = 64;
    const target = computeScrollTarget(s, { spacers: 0, lineHeight, viewH, originTop: 0, maxScroll: 10_000 });
    const artCentre = ((s.inkTop + s.inkBottom + 1) / 2) * lineHeight;
    expect(target + viewH / 2).toBeCloseTo(artCentre, 5);
  });
});
