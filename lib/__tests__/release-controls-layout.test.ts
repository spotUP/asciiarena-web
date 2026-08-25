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

  it("gives every section the same row style", () => {
    const rows = bar.match(/style=\{CONTROL_ROW\}/g) ?? [];
    expect(rows.length).toBe(4);
    expect(source).toMatch(/const CONTROL_ROW: React\.CSSProperties = \{/);
  });

  it("keeps the counts out of the button rows", () => {
    const counts = bar.slice(bar.indexOf("{/* The counts"));
    // Every figure lives in the last section...
    for (const figure of ["view" + "s\"", "watching", "comment" + "s\"", "favourite" + "s\"", "download" + "s\""]) {
      expect(counts, figure).toContain(figure);
    }
    // ...and that section holds no buttons at all.
    expect(counts).not.toContain("btn-big");
  });

  it("puts the view controls together", () => {
    const viewing = bar.slice(bar.indexOf("{/* Viewing:"), bar.indexOf("{/* Appearance:"));
    for (const control of ["Hide Colly", "Fullscreen", "Fit to screen", "Index", "Minimap", "Autoplay", "Groove"]) {
      expect(viewing, control).toContain(control);
    }
    // Download belongs to the colly, not to the view.
    expect(viewing).not.toContain('value="Download"');
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
    const viewing = bar.slice(bar.indexOf("{/* Viewing:"), bar.indexOf("{/* Appearance:"));
    expect(viewing).toMatch(/\{autoplayIndex \+ 1\} \/ \{sections\.length\}/);
  });

  it("does not render an empty section", () => {
    // An archive has no inline art, so the viewing and appearance rows would
    // otherwise be two empty 16px gaps above the buttons.
    expect(bar).toMatch(/\{hasInlineContent && \(\s*\n\s*<div style=\{CONTROL_ROW\}>/);
    expect(bar).toMatch(/viewCount > 0 \|\| watching > 1/);
  });
});
