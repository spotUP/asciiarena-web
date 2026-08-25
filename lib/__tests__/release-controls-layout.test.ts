import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The release page's control bar was one long wrapping line: every button and
 * every figure in a single flex row, breaking wherever the width ran out. So
 * "63 views 3 watching 2 comments 1 download" ended up sitting between Share
 * and View Comments, and nothing read as belonging to anything else.
 *
 * It is four sections now, each its own row:
 *
 *   1. Viewing     -- what changes what you are looking at
 *   2. Appearance  -- how the art is drawn (colours, font)
 *   3. The colly   -- what you do with it (download, favourite, share, report)
 *   4. The counts  -- text only, never mixed in with the buttons
 */

const source = readFileSync(
  path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
  "utf8",
);

/** The bar, from its comment to the ASCII viewer that follows it. */
const bar = source.slice(
  source.indexOf("{/* Controls bar."),
  source.indexOf("{/* ASCII text viewer"),
);

describe("release control bar", () => {
  it("stacks its sections instead of wrapping one long line", () => {
    expect(bar).toMatch(/flexDirection: "column", gap: "16px"/);
  });

  it("makes every button in a control row the same width", () => {
    // Equal grid columns, at least 176px: 22 characters, which is the longest
    // label ("View Comments (2)", 17) plus .btn-big's 2x16px of padding.
    // Buttons of a dozen widths read as a jumble however they are grouped.
    expect(source).toMatch(/gridTemplateColumns: "repeat\(auto-fill, minmax\(176px, 1fr\)\)"/);
    const rows = bar.match(/style=\{CONTROL_ROW\}/g) ?? [];
    expect(rows.length).toBe(2);
  });

  it("makes a wrapped control fill its cell", () => {
    // Share sits in a positioned div so its menu can hang off it; without a
    // width the button inside would size to its own label instead of the cell.
    expect(bar).toMatch(/Share dropdown[\s\S]*?style=\{\{ width: "100%" \}\}/);
  });

  it("does not lay text out in equal columns", () => {
    expect(source).toMatch(/const TEXT_ROW: React\.CSSProperties = \{[\s\S]*?display: "flex"/);
    expect(bar).toMatch(/style=\{TEXT_ROW\} className="lightgrey"/);
  });

  it("gives the panel room above and below its content", () => {
    // .p-0 is `padding: 0 !important`, which beats an inline style: with that
    // class on the panel the bar had no room above the first row at all.
    expect(bar).toMatch(/className="bg-secondary amb-1"/);
    expect(bar).not.toMatch(/className="bg-secondary amb-1 p-0"/);
    expect(bar).toMatch(/padding: "16px 0"/);
  });

  it("keeps the counts out of the button rows", () => {
    // Bounded by the appearance row, which now follows it.
    const counts = bar.slice(bar.indexOf("{/* The counts"), bar.indexOf("{/* Appearance,"));
    // Every figure lives in the last section...
    for (const figure of ["view" + "s\"", "watching", "comment" + "s\"", "favourite" + "s\"", "download" + "s\""]) {
      expect(counts, figure).toContain(figure);
    }
    // ...and that section holds no buttons at all.
    expect(counts).not.toContain("btn-big");
  });

  it("puts the view controls together", () => {
    const viewing = bar.slice(bar.indexOf("{/* Viewing:"), bar.indexOf("{/* The colly itself"));
    for (const control of ["Hide Colly", "Fullscreen", "Fit to screen", "Index", "Minimap", "Autoplay", "Groove"]) {
      expect(viewing, control).toContain(control);
    }
    // Download belongs to the colly, not to the view.
    expect(viewing).not.toContain('value="Download"');
  });

  it("puts the colour and font settings last", () => {
    // A setting you reach for once, not a control you work with while reading.
    const appearance = bar.indexOf("{/* Appearance,");
    const counts = bar.indexOf("{/* The counts");
    const colly = bar.indexOf("{/* The colly itself");
    expect(appearance).toBeGreaterThan(counts);
    expect(counts).toBeGreaterThan(colly);
  });

  it("puts what you do with the colly together", () => {
    const colly = bar.slice(bar.indexOf("{/* The colly itself"), bar.indexOf("{/* The counts"));
    for (const control of ["Download", "Favourite", "Tag Logos", "Share", "View Comments", "Report Broken"]) {
      expect(colly, control).toContain(control);
    }
    expect(colly).not.toContain("Fullscreen");
  });

  it("keeps the autoplay readout with the autoplay buttons", () => {
    // The one figure that is not a count: it is the position within the
    // playlist and it means nothing on its own line.
    const viewing = bar.slice(bar.indexOf("{/* Viewing:"), bar.indexOf("{/* The colly itself"));
    expect(viewing).toMatch(/\{autoplayIndex \+ 1\} \/ \{sections\.length\}/);
  });

  it("does not render an empty section", () => {
    // An archive has no inline art, so the viewing and appearance rows would
    // otherwise be two empty 16px gaps above the buttons.
    expect(bar).toMatch(/\{hasInlineContent && \(\s*\n\s*<div style=\{CONTROL_ROW\}>/);
    expect(bar).toMatch(/viewCount > 0 \|\| watching > 1/);
  });
});

describe("the colour swatch", () => {
  const swatch = readFileSync(path.join(process.cwd(), "components/ui/ColorSwatch.tsx"), "utf8");

  it("is two characters wide, not one", () => {
    // 8px was one character: hard to hit and hard to read as a colour.
    expect(swatch).toMatch(/width: "16px", height: "16px", background: current/);
  });
});
