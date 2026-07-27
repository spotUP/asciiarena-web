import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

const release = read("app/release/[filename]/ReleaseClient.tsx");
const panel = read("components/release/LogoTagPanel.tsx");
const preview = read("components/submit/CollyPreview.tsx");

describe("canvas viewer returns after tag mode", () => {
  it("gates the AnsiLove render on viewerVisible, not collyVisible", () => {
    // Reported on https://www.asciiarena.se/release/G80-TT.TXT: entering tag
    // mode unmounts the canvas, but this effect was gated on `collyVisible`,
    // which never changed during a tag session. Its deps therefore stayed
    // identical, React never re-ran it, and on returning the viewer sat on
    // ".LOADiNG." forever. Only ANSI/CP437 collys were affected -- the plain
    // text viewer re-renders from markup on remount.
    const effect = release.slice(
      release.indexOf("// Canvas (AnsiLove) renderer"),
      release.indexOf("// List archive files"),
    );
    expect(effect).toMatch(/\|\| !viewerVisible\) return;/);
    expect(effect).not.toMatch(/\|\| !collyVisible\) return;/);
    // The dependency array is the half that actually makes it re-run.
    expect(effect).toMatch(/\}, \[type, isCp437Art, viewerVisible,/);
  });
});

describe("autoplay music", () => {
  it("plays nothing unless groove is on", () => {
    const start = release.slice(release.indexOf("const startAutoplay ="));
    const body = start.slice(0, start.indexOf("}, ["));
    expect(body).toMatch(/if \(!musicGroove\) return;/);
    // The groove-off early return must precede any playback call.
    expect(body.indexOf("if (!musicGroove) return;")).toBeLessThan(body.indexOf("playSoundtrack()"));
    expect(body.indexOf("if (!musicGroove) return;")).toBeLessThan(body.indexOf("playRandomMusic()"));
  });

  it("still uses the colly's own soundtrack when grooving", () => {
    const start = release.slice(release.indexOf("const startAutoplay ="));
    const body = start.slice(0, start.indexOf("}, ["));
    expect(body).toMatch(/if \(soundtrack\) playSoundtrack\(\)/);
    expect(body).toMatch(/playRandomMusic\(\)/);
  });
});

describe("logo map autosave", () => {
  it("has no Save button", () => {
    expect(panel).not.toMatch(/value="Save Logo Map"/);
  });

  it("saves on a timer rather than on a click", () => {
    expect(panel).toMatch(/AUTOSAVE_TICK_MS/);
    expect(panel).toMatch(/setInterval\(\(\) => \{ void save\(\); \}/);
  });

  it("ticks slower than the server's per-colly throttle so a burst coalesces", () => {
    const tick = /AUTOSAVE_TICK_MS = (\d+)_?(\d*)/.exec(panel);
    expect(tick).not.toBeNull();
    const ms = Number(`${tick![1]}${tick![2]}`);
    const limit = read("lib/logoSaveRateLimit.ts");
    const seconds = Number(/LOGO_SAVE_MIN_INTERVAL_SECONDS = (\d+)/.exec(limit)![1]);
    expect(ms).toBeGreaterThan(seconds * 1000);
  });

  it("re-dirties the map when a save fails so the next tick retries", () => {
    const saveBody = panel.slice(panel.indexOf("const save = useCallback"), panel.indexOf("// Autosave."));
    // Network failure and the 429 throttle are both recoverable.
    expect(saveBody).toMatch(/logosDirty\.current = true;[\s\S]*Retrying/);
    expect(saveBody).toMatch(/res\.status === 429/);
  });

  it("clears the dirty flag before the request, not after", () => {
    // Otherwise an edit made while the save is in flight is swallowed when the
    // response clears the flag.
    const saveBody = panel.slice(panel.indexOf("const save = useCallback"), panel.indexOf("// Autosave."));
    expect(saveBody.indexOf("logosDirty.current = false;")).toBeLessThan(saveBody.indexOf("await fetch("));
  });

  it("flushes pending edits when the reader leaves", () => {
    expect(panel).toMatch(/const flushAndClose = \(\) => \{ void save\(\); onDone\(\); \}/);
    expect(panel).toMatch(/value="Done" onClick=\{flushAndClose\}/);
    // A closing tab cannot complete a fetch.
    expect(panel).toMatch(/navigator\.sendBeacon/);
    expect(panel).toMatch(/addEventListener\("pagehide"/);
  });
});

describe("caption dialog keyboard", () => {
  it("commits the logo on Enter and abandons it on Escape", () => {
    const dialog = preview.slice(preview.indexOf("const panel = sel && ("));
    const enterHandlers = dialog.match(/e\.key === "Enter"/g) ?? [];
    // The logo name and the "for" field; the author field is a Combobox that
    // keeps Enter for picking a suggestion.
    expect(enterHandlers.length).toBe(2);
    expect(dialog).toMatch(/e\.key === "Enter"[\s\S]*?save\(\)/);
    expect(dialog).toMatch(/e\.key === "Escape"[\s\S]*?close\(\)/);
  });
});
