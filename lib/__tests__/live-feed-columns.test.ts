import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The live feed is one short line per event in a full-width card, so a single
 * column left three quarters of every row empty and made the card fifteen rows
 * tall.
 *
 * `columns: 320px 4` asks for as many 320px columns as fit and never more than
 * four: one on a phone, two on a tablet, three on a laptop, four on a wide
 * screen -- without a media query per breakpoint. Measured in Chrome at feed
 * widths 500/800/1100/1400/1900: 1/2/3/4/4 columns, rows 16px, card 96px
 * instead of the ~250px it was.
 */

const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");
const source = readFileSync(
  path.join(process.cwd(), "components/widgets/ActivityFeed.tsx"),
  "utf8",
);

describe("live feed columns", () => {
  it("flows into at most four columns, each at least 320px", () => {
    expect(css).toMatch(/\.live-feed \{[^}]*columns:\s*320px 4;/);
  });

  it("keeps a gap between the columns", () => {
    expect(css).toMatch(/\.live-feed \{[^}]*column-gap:\s*16px;/);
  });

  it("keeps every entry on one 16px row of the grid", () => {
    const row = css.match(/\.live-feed-row \{[^}]*\}/)?.[0] ?? "";
    expect(row).toMatch(/height:\s*16px;/);
    expect(row).toMatch(/line-height:\s*16px;/);
    // A long filename is cut, not wrapped -- a wrapped row would put the
    // column out of step with its neighbours.
    expect(row).toMatch(/white-space:\s*nowrap;/);
    expect(row).toMatch(/text-overflow:\s*ellipsis;/);
  });

  it("never splits a row across a column break", () => {
    // Without this a row lands half at the foot of one column and half at the
    // head of the next.
    expect(css).toMatch(/\.live-feed-row \{[^}]*break-inside:\s*avoid;/);
  });
});

describe("the live feed card", () => {
  it("uses the shared widget box like every other card", () => {
    expect(source).toContain('<div className="widget">');
    expect(source).toMatch(/<h2 className="widget-title bg-header">LIVE FEED<\/h2>/);
    expect(source).toContain('className="widget-body bg-secondary live-feed"');
  });

  it("drops the off-grid row sizing it used to carry", () => {
    // 0.85em is 13.6px and the 3px tail put every row off the 16px grid.
    expect(source).not.toContain('fontSize: "0.85em"');
    expect(source).not.toContain('paddingBottom: "3px"');
  });
});
