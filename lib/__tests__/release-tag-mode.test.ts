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
    // Each viewer branch is gated on `collyVisible`; tagging must gate them too.
    const branches = source.match(/collyVisible && \(/g) ?? [];
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
    expect(source).toMatch(/userNick && [\s\S]*Tag Logos/);
  });
});
