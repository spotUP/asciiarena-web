import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { cssRule } from "./cssRule";

/**
 * Every button is one 16px row of the grid.
 *
 * They were 48px -- three rows -- which read as clumsy beside 16px text, and
 * meant a button was three times the height of the line it sat on. The height
 * lives entirely in these few rules, so all 151 .btn-big call sites and every
 * bare <button> follow from here; no markup change was needed.
 *
 * Measured in Chrome against the real stylesheet chain: .btn-big,
 * input[type=submit], a bare <button>, .search-btn, <select>, .btn and
 * button.dropdown-item all 16px, and .btn-big stays 16px while focused.
 */

const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");


describe("button height", () => {
  it("puts the site's main button on one row", () => {
    const btnBig = cssRule(css, ".btn-big{");
    expect(btnBig).toMatch(/height:\s*16px;/);
    expect(btnBig).toMatch(/max-height:\s*16px !important;/);
    expect(btnBig).toMatch(/min-height:\s*16px !important;/);
    expect(btnBig).toMatch(/line-height:\s*16px !important;/);
    // Horizontal padding is what makes a button look like a button here.
    expect(btnBig).toMatch(/padding-left:\s*16px !important;/);
  });

  it("puts a bare button and a select on one row", () => {
    const el = cssRule(css, "button, select{");
    expect(el).toMatch(/height:\s*16px;/);
  });

  it("states that height as a default, not a ceiling", () => {
    // min/max-height here beat any component that sets its own height: the
    // 20px colour swatches went 20x16, the poll editor's 21px buttons shrank,
    // and the [X] centred on a 48px widget band slid to the top of it.
    for (const selector of ["button, select{", "button:active, select:active{", "input, optgroup {"]) {
      const r = cssRule(css, selector);
      expect(r, selector).not.toMatch(/max-height:\s*16px/);
      expect(r, selector).not.toMatch(/min-height:\s*16px/);
    }
  });

  it("lets the widget [X] keep the whole 48px band", () => {
    const hide = cssRule(css, ".widget-hide-btn {");
    expect(hide).toMatch(/height:\s*48px;/);
  });

  it("gives a button a one-row line box, not a three-row one", () => {
    // A 16px control with a 48px line box centres its label wherever the font
    // decides. Same reason textareas were split out of that rule.
    expect(css).toMatch(
      /button,\s*\n\s*select,\s*\n\s*input\[type=button\],\s*\n\s*input\[type=submit\],\s*\n\s*input\[type=reset\] \{[\s\S]*?line-height:\s*16px;/,
    );
  });

  it("does not resize a button back to three rows on focus", () => {
    const focus = cssRule(css, "select:focus, button:focus {");
    expect(focus).toMatch(/line-height:\s*16px;/);
    // ...and the input rule it was split out of keeps its own line-height.
    expect(css).toMatch(/input:focus, \.btn-primary\.focus, \.btn-primary:focus\{/);
  });

  it("puts text inputs on the same row", () => {
    const inputs = cssRule(css, "input, optgroup {");
    expect(inputs).toMatch(/height:\s*16px;/);
    expect(inputs).toMatch(/line-height:\s*16px !important;/);
  });

  it("keeps a field one row while it is focused or being typed in", () => {
    expect(css).toMatch(/input:focus, \.btn-primary\.focus[^{]*\{[^}]*line-height:\s*16px;/);
    // The :active rule used to set an off-grid 14px line-height.
    expect(cssRule(css, "input:active, optgroup:active {")).not.toMatch(/line-height:\s*14px/);
  });

  it("exempts the file input, which draws its own button", () => {
    // Clamped to one row it clips its own "Choose file" label and there is
    // nothing left to click.
    const file = cssRule(css, "input[type=file] {");
    expect(file).toMatch(/height:\s*auto !important;/);
    expect(file).toMatch(/max-height:\s*none !important;/);
  });

  it("gives no button a width it did not ask for", () => {
    // .btn-primary set a flat `width: 132px`, so every button wearing it held
    // 132px of its row whatever its label said -- and a longer label than that
    // (the paginator's "50 per page", which needs 138px) was clipped. Both the
    // base rule and its :hover twin, or the button resizes under the cursor.
    expect(cssRule(css, ".btn-primary {")).not.toMatch(/width:\s*\d+px/);
    expect(cssRule(css, ".btn-primary:hover {")).not.toMatch(/width:\s*\d+px/);
  });

  it("leaves the textarea stacking its lines", () => {
    // textarea is deliberately absent from the input selectors; it has its own
    // rule, added when the comment box was a line off.
    expect(css).toMatch(/textarea, textarea:focus \{[\s\S]*?line-height:\s*16px;/);
    const inputs = cssRule(css, "input, optgroup {");
    expect(inputs).not.toMatch(/textarea/);
  });
});

describe("buttons that are links", () => {
  const release = readFileSync(
    path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
    "utf8",
  );

  it("does not pad a .btn-big vertically", () => {
    // apt-1/apb-1 add 16px top AND bottom with !important. Padding cannot
    // shrink below itself, so the View Comments link was 32px tall with zero
    // content height -- .btn-big's own 16px could not win against it.
    // Measured on the live page before the fix: height 32px, padding 16/16.
    expect(release).not.toMatch(/className="btn-big[^"]*ap[tb]-1/);
    expect(release).toContain('className="btn-big bg-header grey-text"');
  });
});
