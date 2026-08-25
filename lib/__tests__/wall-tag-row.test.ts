import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { cssRule } from "./cssRule";

/**
 * Regression: the box you tag a wall in was never as wide as the wall.
 *
 * Two causes, both about the button beside it:
 *
 *  - The row was a 12-column grid, col-lg-11 for the input and col-lg-1 for
 *    the button. A column is a fraction of the row whatever it holds, so a
 *    three-character button reserved about 165px on a wide screen.
 *  - The button carried .btn-primary, which sets a flat `width: 132px`.
 *
 * A flex row with `flex: 1` on the input and a .btn-big that is as wide as its
 * own label gives the input everything else. Measured in Chrome: input 1426px
 * of a 1495px wall, button 61px, no gap at either end.
 */

const WALLS = [
  "components/widgets/home/SiteWall.tsx",
  "components/widgets/home/GlobalWall.tsx",
];

const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");

describe("the wall tag row", () => {
  for (const file of WALLS) {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");

    it(`${file} lets the input take the whole row`, () => {
      expect(source).toMatch(/style=\{\{ flex: 1, minWidth: 0 \}\}/);
    });

    it(`${file} sizes the button to its own label`, () => {
      expect(source).toMatch(/className="btn-big black bg-lightgrey"/);
      expect(source).toMatch(/style=\{\{ flex: "0 0 auto" \}\}/);
    });

    it(`${file} does not put the button in a grid column again`, () => {
      // col-lg-1 is 8.33% of the row -- about 165px -- for the word "Tag".
      expect(source, file).not.toContain("col-lg-11");
      expect(source, file).not.toContain("col-lg-1 bg-secondary");
    });

    it(`${file} keeps the fixed-width button class off it`, () => {
      expect(source, file).not.toContain("button btn-primary black");
    });

    it(`${file} lines the box you type in up with the wall above it`, () => {
      // Measured on the live page: the wall's text sat at 12px (the panel's
      // 8px padding plus a 4px column gutter) while the input's text sat at
      // 16px (an 8px wrapper padding plus the input's own 8px). Both off the
      // grid, and 4px apart, which is what "it doesn't align" looked like.
      //
      // p-0 on the row columns drops the gutter, so the wall's text sits at
      // the panel's own 8px; the tag row has no wrapper padding, so the
      // input's own 8px is the only inset. Both land on 8px.
      expect(source, file).toContain('<div className="col-10 d-flex p-0">');
      expect(source, file).toContain('<div className="col-2 text-right p-0">');
      expect(source, file).toContain('<div className="d-flex m-0">');
      expect(source, file).not.toContain('className="d-flex m-0" style={{ paddingLeft: "8px" }}');
    });
  }

  it("no longer has a class that forces a width on it", () => {
    // .btn-primary used to set a flat `width: 132px`. It is gone site-wide:
    // a button is as wide as its label, and a call site that genuinely needs
    // a set width (the paginator's arrows) says so itself.
    expect(cssRule(css, ".btn-primary {")).not.toMatch(/width:\s*132px/);
    expect(cssRule(css, ".btn-primary:hover {")).not.toMatch(/width:\s*132px/);
  });
});
