import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: typing a comment under a colly started a line too low.
 *
 * "you kind of start one line 'below', and with cursor key up you can move to
 * the first line, but not write anything."
 *
 * site.css gives every form control `line-height: 48px`. On a 48px-tall
 * single-line input that is the vertical-centring trick: one line box filling
 * the field. A textarea stacks its line boxes, so a 16px glyph in a 48px line
 * box carries 16px of leading above and below EVERY line -- the caret parks in
 * the leading, a line above where the text lands, and typing there appears to
 * do nothing.
 *
 * Text fields are on the 8x16 grid (see RULES.md): one row is 16px. These are
 * source assertions rather than a rendered cascade, so keep them anchored to
 * the two selectors that decide it.
 */

const CSS_DIR = path.join(process.cwd(), "assets/css");
const site = readFileSync(path.join(CSS_DIR, "site.css"), "utf8");
const overrides = readFileSync(path.join(CSS_DIR, "overrides.css"), "utf8");

/** The declarations inside every rule whose selector list mentions `textarea`. */
function textareaRules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const selector = m[1].trim();
    if (/(^|[\s,])textarea\b/.test(selector)) out.push({ selector, body: m[2] });
  }
  return out;
}

describe("textarea line-height", () => {
  it("never puts a textarea on the 48px single-line-control line-height", () => {
    for (const rule of [...textareaRules(site), ...textareaRules(overrides)]) {
      expect(
        rule.body,
        `selector "${rule.selector}" gives textareas a 48px line-height`,
      ).not.toMatch(/line-height:\s*48px/);
    }
  });

  it("sets the grid line-height on a textarea, focused or not", () => {
    expect(site).toMatch(/textarea,\s*textarea:focus\s*\{[\s\S]*?line-height:\s*16px;/);
  });

  it("restates it for .form-control, which outranks a bare element selector", () => {
    expect(overrides).toMatch(/textarea\.form-control\s*\{[\s\S]*?line-height:\s*16px\s*!important;/);
  });
});
