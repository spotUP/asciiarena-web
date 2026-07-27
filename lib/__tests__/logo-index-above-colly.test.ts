import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// A colly whose logos a person tagged shows a clickable index above the art,
// always visible. Auto-detected labels are guesses -- often wrong or unnamed --
// so those collys keep the old Index button and stay as they were.

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");
const release = read("app/release/[filename]/ReleaseClient.tsx");
const component = read("components/release/LogoIndex.tsx");

describe("logo index visibility", () => {
  it("keys off a human-made map, not detection", () => {
    // logoMap is built from manual = 1 catalog rows only.
    expect(release).toMatch(/const hasHumanMap = !!\(logoMap && logoMap\.length\)/);
  });

  it("renders above the art without a button to press", () => {
    expect(release).toMatch(/\{hasHumanMap && !tagging && !isFullscreen && collyVisible && \(/);
    expect(release).toMatch(/<LogoIndex/);
    // Mounted before the viewer branches, so it sits above the colly.
    expect(release.indexOf("<LogoIndex")).toBeLessThan(release.indexOf("{!useCanvasViewer &&"));
  });

  it("drops the redundant Index button on a tagged colly", () => {
    expect(release).toMatch(/\{!hasHumanMap && sections\.length > 2 && \(/);
  });

  it("keeps the button for untagged collys", () => {
    // The guard is a negation of hasHumanMap, not a removal: an untagged colly
    // still reaches the same button.
    expect(release).toMatch(/value=\{indexOpen \? "Close Index" : "Index"\}/);
  });

  it("stays out of the way while tagging and in fullscreen", () => {
    const guard = /\{hasHumanMap && !tagging && !isFullscreen/;
    expect(release).toMatch(guard);
  });
});

describe("logo index component", () => {
  it("cleans the caption so a signature does not become the entry name", () => {
    // "NEXUS -spot for zeus" should read as "NEXUS".
    expect(component).toMatch(/cleanLabel\(entry\.label\)/);
  });

  it("falls back to a numbered name when a caption cleans to nothing", () => {
    expect(component).toMatch(/\|\| `Logo \$\{n \+ 1\}`/);
  });

  it("wraps into columns rather than one long list", () => {
    expect(component).toMatch(/gridTemplateColumns: "repeat\(auto-fill, minmax\(\d+px, 1fr\)\)"/);
  });

  it("uses the site font on the 8x16 grid", () => {
    expect(component).toMatch(/fontFamily: "inherit"/);
    expect(component).toMatch(/fontSize: "16px"/);
    expect(component).toMatch(/lineHeight: "16px"/);
    expect(component).not.toMatch(/monospace/);
  });

  it("marks the logo autoplay is showing", () => {
    expect(component).toMatch(/currentSection === entry\.section/);
  });

  it("has a hover state, which cannot be an inline style", () => {
    expect(component).toMatch(/className=\{current \? undefined : "logo-index-entry"\}/);
    const css = read("assets/css/site.css");
    expect(css).toMatch(/\.logo-index-entry:hover \{/);
  });

  it("does not set a resting colour inline, which would outrank the hover", () => {
    // An inline `color` beats any class rule, so setting the resting colour
    // inline silently kills :hover -- which is exactly what shipped first.
    // The resting colours belong in .logo-index-entry.
    expect(component).not.toMatch(/color: current \? "#ff55ff" : "#aaaaaa"/);
    expect(component).toMatch(/\.\.\.\(current \? \{ background: "#222222", color: "#ff55ff" \} : \{\}\)/);
    const css = read("assets/css/site.css");
    expect(css).toMatch(/\.logo-index-entry \{[^}]*color: #aaaaaa/);
  });

  it("renders nothing when there is nothing to index", () => {
    expect(component).toMatch(/if \(!entries\.length\) return null;/);
  });

  it("uses real buttons, so the entries are keyboard reachable", () => {
    expect(component).toMatch(/<button/);
    expect(component).toMatch(/type="button"/);
  });
});
