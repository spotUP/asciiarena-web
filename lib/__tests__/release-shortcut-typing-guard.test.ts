import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression pin: "if you used the letter F [in a comment], it would switch the
 * colly to full screen mode."
 *
 * The release page binds its single-letter shortcuts (f, d, p, i and the arrow
 * keys) on `document`, so every keystroke anywhere on the page reaches them --
 * including the ones going into the comment box. The guard below is what keeps
 * a typed letter a typed letter. It is already in place; this test is here so
 * it cannot be dropped again while adding the next shortcut.
 */

const source = readFileSync(
  path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
  "utf8",
);

describe("release page keyboard shortcuts", () => {
  it("ignores keys typed into a form field", () => {
    expect(source).toMatch(
      /const tag = \(e\.target as HTMLElement\)\?\.tagName;\s*\n\s*if \(tag === "INPUT" \|\| tag === "TEXTAREA" \|\| tag === "SELECT" \|\| \(e\.target as HTMLElement\)\?\.isContentEditable\) return;/,
    );
  });

  it("leaves browser and OS shortcuts alone", () => {
    // Cmd+F is Find, not Fullscreen.
    expect(source).toMatch(/if \(e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey\) return;/);
  });

  it("guards before it reads any shortcut key", () => {
    const guard = source.indexOf('if (tag === "INPUT"');
    const firstShortcut = source.indexOf('if (e.key === "f")');
    expect(guard).toBeGreaterThan(-1);
    expect(firstShortcut).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(firstShortcut);
  });
});
