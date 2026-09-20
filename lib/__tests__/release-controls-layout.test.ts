import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The release page's control bar was one long wrapping line of thirteen
 * buttons, with the figures mixed in wherever the line happened to break --
 * "63 views 3 watching" sat between Share and View Comments.
 *
 * It is three sections now:
 *
 *   1. The five controls you reach for while reading a colly
 *   2. Two menus -- View (display settings) and More (rare actions, sharing)
 *   3. The counts, text only, never mixed in with the buttons
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

  it("keeps only what you reach for while reading as a button", () => {
    const primary = bar.slice(bar.indexOf("{/* What you reach for"), bar.indexOf("{/* The two menus"));
    for (const control of ["Fullscreen", "Autoplay", "Download", "Favourite", "View Comments", "Hide Colly"]) {
      expect(primary, control).toContain(control);
    }
    // Everything else moved into a menu.
    for (const moved of ["Fit to screen", "Minimap", "Report broken", "Share on Reddit"]) {
      expect(primary, moved).not.toContain(moved);
    }
  });

  it("puts the display settings in the View menu and the rest in More", () => {
    const menus = bar.slice(bar.indexOf("{/* The two menus"), bar.indexOf("{/* The counts"));
    // Hide Colly came back out of the menu in bf75fc2, next to View Comments.
    for (const item of ["Fit to screen", "Index", "Minimap", "Groove", "Background", "Text"]) {
      expect(menus, item).toContain(item);
    }
    for (const item of ["Tag logos", "Report broken", "Share by mail", "Copy autoplay link"]) {
      expect(menus, item).toContain(item);
    }
    // The font list is generated from the one source, not retyped.
    expect(menus).toMatch(/\.\.\.FONTS\.map/);
  });

  it("makes every button in a control row the same width", () => {
    // Equal grid columns, at least 176px: 22 characters, which is the longest
    // label ("View Comments (2)", 17) plus .btn-big's 2x16px of padding.
    // Buttons of a dozen widths read as a jumble however they are grouped.
    expect(source).toMatch(/gridTemplateColumns: "repeat\(auto-fill, minmax\(176px, 1fr\)\)"/);
    const rows = bar.match(/style=\{CONTROL_ROW\}/g) ?? [];
    expect(rows.length).toBe(2);
  });

  it("makes a menu trigger fill its cell", () => {
    // The trigger sits in a positioned div so the menu can hang off it;
    // without a width it would size to its own label instead of the cell.
    const menu = readFileSync(path.join(process.cwd(), "components/ui/AnsiMenu.tsx"), "utf8");
    expect(menu).toMatch(/className="btn-big bg-header grey-text"\s*\n\s*style=\{\{ width: "100%" \}\}/);
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
    const counts = bar.slice(bar.indexOf("{/* The counts"));
    // Every figure lives in the last section...
    for (const figure of ["view" + "s\"", "watching", "comment" + "s\"", "favourite" + "s\"", "download" + "s\""]) {
      expect(counts, figure).toContain(figure);
    }
    // ...and that section holds no buttons at all.
    expect(counts).not.toContain("btn-big");
  });

  it("keeps the autoplay readout with the autoplay buttons", () => {
    // The one figure that is not a count: it is the position within the
    // playlist and it means nothing on its own line.
    const primary = bar.slice(bar.indexOf("{/* What you reach for"), bar.indexOf("{/* The two menus"));
    expect(primary).toMatch(/\{autoplayIndex \+ 1\} \/ \{sections\.length\}/);
  });

  it("does not offer a View menu for a colly with no inline art", () => {
    // An archive has nothing to fullscreen, fit or recolour.
    expect(bar).toMatch(/\{hasInlineContent && \(\s*\n\s*<AnsiMenu\s*\n\s*label="View"/);
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
