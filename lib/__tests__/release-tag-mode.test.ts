import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Tagging is a MODE of the existing viewer, not a second copy of the art.
// Both viewer branches and the minimap must be suppressed while tagging, or
// the colly renders twice on the same page.

const source = readFileSync(
  path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
  "utf8",
);

describe("release page tag mode", () => {
  it("suppresses both viewer branches while tagging", () => {
    // Every viewer-only control and both viewer branches are gated on
    // `viewerVisible` (collyVisible && !tagging), not `collyVisible` alone.
    const branches = source.match(/viewerVisible && \(/g) ?? [];
    expect(branches.length).toBeGreaterThan(0);
    expect(source).toMatch(/const viewerVisible = collyVisible && !tagging/);
    expect(source).not.toMatch(/!useCanvasViewer && \(type === "ASCII" \|\| !!fileContent\) && collyVisible/);
  });

  it("keeps the minimap out of tag mode", () => {
    expect(source).toMatch(/entryCount: tagging \? 0 : logoIndex.length/);
  });

  it("loads the panel lazily so readers never download the editor", () => {
    expect(source).toMatch(/dynamic\(\(\) => import\("@\/components\/release\/LogoTagPanel"\)/);
    expect(source).toMatch(/ssr:\s*false/);
  });

  it("offers tagging only to logged-in users", () => {
    // Now an item in the More menu rather than a button of its own, gated on
    // the same two conditions.
    expect(source).toMatch(/hasInlineContent && userNick\s*\n?\s*\? \[\{ label: tagging \? "Stop tagging logos" : "Tag logos"/);
  });

  it("suspends the keyboard-shortcut effect while tagging", () => {
    // The shortcut effect must bail on the same flag that hides the viewer,
    // or keys like `f` and `p` still fire (invisibly) while the tag panel is open.
    expect(source).toMatch(
      /\/\/ Keyboard shortcuts\s*\n\s*useEffect\(\(\) => \{\s*\n\s*if \(!viewerVisible \|\| !\(type === "ASCII" \|\| type === "ANSI"\)\) return;/,
    );
  });

  it("stops a running autoplay when tag mode is entered, not just when the viewer is hidden", () => {
    // This effect must react to `viewerVisible` (collyVisible && !tagging), not
    // `collyVisible` alone, and must re-run when `tagging` flips — otherwise
    // entering tag mode leaves autoplay (and any soundtrack it started) running
    // behind the tag panel.
    expect(source).toMatch(/if \(!viewerVisible && autoplay\) stopAutoplay\(\);/);
    expect(source).toMatch(/\}, \[viewerVisible, autoplay, stopAutoplay\]\);/);
  });
});
