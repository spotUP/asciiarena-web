// @vitest-environment jsdom
//
// engine/file.js pulls in engine/ui.js, which binds document at module level.
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { Load } from "@/components/ui/AnsiEditor/engine/file.js";
import { EDITOR_MARKUP } from "@/components/ui/AnsiEditor/markup";

/**
 * Regression: every forum post drawn in an Amiga font rendered in the wrong
 * font.
 *
 * A file's SAUCE records the SAUCE font name ("Amiga Topaz 2+"), while the
 * font PNGs on disk are named after the APP font ("Topaz+ 1200 8x16" ->
 * "Topazplus 1200 8x16.png"). render.ts handed the SAUCE name straight to the
 * loader, which builds its path from whatever name it gets, so it requested
 * /ansi-editor/fonts/Amiga Topaz 2plus.png -- a 404. AnsiPost then fell back to
 * AnsiLove, which only covers nine fonts, and the art came out wrong.
 *
 * The invariant: a post saved in a font the editor offers has to render in that
 * font. That means SAUCE name -> app name -> a PNG that exists.
 */

/** The loader's name-to-file rule (engine/font.js). */
function fontFile(appFontName: string): string {
  return path.join(
    process.cwd(),
    "public/ansi-editor/fonts",
    `${appFontName.replace(/\+/g, "plus")}.png`,
  );
}

/** The fonts the editor actually offers, read from the injected markup. */
function offeredFonts(): string[] {
  return [...EDITOR_MARKUP.matchAll(/data-value="([^"]+)"/g)]
    .map(m => m[1])
    .filter(name => name !== "XBIN"); // embedded in the file, not a PNG on disk
}

describe("ANSI font mapping", () => {
  it("offers fonts that exist on disk", () => {
    const fonts = offeredFonts();
    expect(fonts.length).toBeGreaterThan(10);

    const missing = fonts.filter(name => !existsSync(fontFile(name)));

    expect(missing).toEqual([]);
  });

  it("maps every offered font through SAUCE and back to a real file", () => {
    const broken: string[] = [];

    for (const appName of offeredFonts()) {
      const sauceName = Load.appToSauceFont(appName);
      if (!sauceName) continue; // no SAUCE equivalent; the raw name is stored

      // What render.ts does with a loaded file.
      const resolved = Load.sauceToAppFont(sauceName) || sauceName;
      if (!existsSync(fontFile(resolved))) {
        broken.push(`${appName} -> SAUCE "${sauceName}" -> "${resolved}" (no PNG)`);
      }
    }

    expect(broken).toEqual([]);
  });

  it("resolves the Amiga font that broke, rather than its SAUCE name", () => {
    // The exact failure seen in the browser console.
    expect(Load.sauceToAppFont("Amiga Topaz 2+")).toBe("Topaz+ 1200 8x16");
    expect(existsSync(fontFile("Topaz+ 1200 8x16"))).toBe(true);
    expect(existsSync(fontFile("Amiga Topaz 2+"))).toBe(false);
  });
});
