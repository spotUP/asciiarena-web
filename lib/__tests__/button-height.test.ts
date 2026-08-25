import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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

function rule(selector: string): string {
  const re = new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^{]*\\{[^}]*\\}`, "m");
  return css.match(re)?.[0] ?? "";
}

describe("button height", () => {
  it("puts the site's main button on one row", () => {
    const btnBig = rule(".btn-big{");
    expect(btnBig).toMatch(/height:\s*16px;/);
    expect(btnBig).toMatch(/max-height:\s*16px !important;/);
    expect(btnBig).toMatch(/min-height:\s*16px !important;/);
    expect(btnBig).toMatch(/line-height:\s*16px !important;/);
    // Horizontal padding is what makes a button look like a button here.
    expect(btnBig).toMatch(/padding-left:\s*16px !important;/);
  });

  it("puts a bare button and a select on one row", () => {
    const el = rule("button, select{");
    expect(el).toMatch(/max-height:\s*16px;/);
    expect(el).toMatch(/min-height:\s*16px;/);
  });

  it("keeps them there while they are pressed", () => {
    const active = rule("button:active, select:active{");
    expect(active).toMatch(/max-height:\s*16px;/);
    expect(active).toMatch(/min-height:\s*16px;/);
  });

  it("gives a button a one-row line box, not a three-row one", () => {
    // A 16px control with a 48px line box centres its label wherever the font
    // decides. Same reason textareas were split out of that rule.
    expect(css).toMatch(
      /button,\s*\n\s*select,\s*\n\s*input\[type=button\],\s*\n\s*input\[type=submit\],\s*\n\s*input\[type=reset\] \{[\s\S]*?line-height:\s*16px;/,
    );
  });

  it("does not resize a button back to three rows on focus", () => {
    const focus = rule("select:focus, button:focus {");
    expect(focus).toMatch(/line-height:\s*16px;/);
    // ...and the input rule it was split out of keeps its own line-height.
    expect(css).toMatch(/input:focus, \.btn-primary\.focus, \.btn-primary:focus\{/);
  });

  it("leaves text inputs alone", () => {
    // Only buttons were asked for. A plain text field is still 48px; the
    // one-row exceptions are .search-field and the Combobox.
    const inputs = rule("input, optgroup {");
    expect(inputs).toMatch(/min-height:\s*48px;/);
  });
});
