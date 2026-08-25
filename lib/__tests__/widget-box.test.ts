import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: the sidebar widgets were not the same width, the gaps between
 * them varied, and the [X] sat hard against the edge on some of them.
 *
 * Each widget had hand-rolled its own box. Three shapes were in use: a bare
 * div with an inline margin, `container fluid col-12 p-0 pl-lg-2 pr-lg-2`
 * (whose .container gutter inset it ~12px further than the others), and the
 * same again with an inline paddingTop. Their headers disagreed too -- half
 * set the 16px grid line-height on the h2, half left it at the 48px
 * form-control default -- so the bands were different heights as well. The [X]
 * is positioned against the widget's own frame, so it landed wherever that
 * widget's edge happened to be.
 *
 * The box is now one definition in site.css (.widget / .widget-head /
 * .widget-title / .widget-body) and a widget supplies only its title and rows.
 * These tests are what stops the next widget from bringing its own again.
 */

const WIDGETS = [
  "ArenaStats", "BBSWeektop", "CedSessions", "LastCallers", "LatestApps",
  "LatestCollys", "LatestForumPosts", "LatestMags", "LatestNews",
  "MostViewedCollys", "MusicPlayer", "NewUsers", "NowPlaying",
  "PollSidebarLatest", "TopArtists", "TopCollys", "TopCommenters", "TopCrews",
  "TopTaggers", "TopUploaders", "UsersOnline", "UsersOnlineLive", "Weektop",
];

function widgetSource(name: string): string {
  return readFileSync(path.join(process.cwd(), `components/widgets/${name}.tsx`), "utf8");
}

const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");

describe("every sidebar widget uses the one box", () => {
  for (const name of WIDGETS) {
    it(`${name} opens with .widget and titles with .widget-title`, () => {
      const source = widgetSource(name);
      expect(source).toContain('<div className="widget">');
      // LatestCollys picks its title class in a variable, so match the class
      // string itself rather than the tag it ends up on.
      expect(source).toMatch(/"widget-title bg-header/);
    });
  }

  it("nobody brings their own outer container back", () => {
    for (const name of WIDGETS) {
      const source = widgetSource(name);
      // The .container gutter is what made these narrower than the rest.
      expect(source, name).not.toContain("container fluid col-12");
      // The gap between widgets belongs to .widget, not to an inline style.
      expect(source, name).not.toContain('style={{ marginBottom: "16px" }}');
      // The title's size comes from .widget-title.
      expect(source, name).not.toContain('style={{ fontSize: "16px", lineHeight: "16px" }}');
    }
  });
});

describe("the widget box itself", () => {
  it("gives every widget the same 16px gap", () => {
    expect(css).toMatch(/\.widget \{[^}]*margin-bottom:\s*16px;/);
  });

  it("keeps the title band on the grid", () => {
    // 48px band: 16px of padding, one 16px row, 16px of padding.
    expect(css).toMatch(/\.widget-title \{[^}]*padding:\s*16px 40px !important;/);
    expect(css).toMatch(/\.widget-title \{[^}]*line-height:\s*16px;/);
  });

  it("reserves room on both sides of the title for the [X]", () => {
    // Symmetric, or centring the title would drift left of centre.
    const rule = css.match(/\.widget-title \{[^}]*\}/)?.[0] ?? "";
    const padding = rule.match(/padding:\s*(\d+)px (\d+)px/);
    expect(padding).not.toBeNull();
    expect(Number(padding![2])).toBeGreaterThanOrEqual(32);
  });

  it("centres the [X] on the band by box, not by font metrics", () => {
    // A glyph's position inside its line box depends on the font, and the
    // button has to sit on the title's row before Topaz has loaded too.
    const rule = css.match(/\.widget-hide-btn \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toMatch(/height:\s*48px;/);
    expect(rule).toMatch(/align-items:\s*center;/);
    expect(rule).toMatch(/right:\s*8px;/);
  });

  it("reveals the button as a flex box, so the centring survives", () => {
    // The :has() rule outranks the base rule; setting display:block there
    // would drop align-items on every widget that actually renders one.
    expect(css).toMatch(/\.widget-frame:has\([\s\S]*?\) \.widget-hide-btn \{\s*\n\s*display: flex;/);
  });

  it("pads the body vertically only -- rows bring their own 8px gutter", () => {
    expect(css).toMatch(/\.widget-body \{[^}]*padding:\s*16px 0;/);
  });
});
