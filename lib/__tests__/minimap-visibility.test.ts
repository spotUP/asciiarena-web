import { describe, it, expect } from "vitest";
import { MINIMAP_MIN_VIEWPORT_WIDTH, shouldShowMinimap, viewportAllowsMinimap } from "../minimapVisibility";

// Two reports: the minimap does not work on mobile at all, and on a small
// secondary monitor its 120px strip eats a third of the colly with no way to
// switch it off. It is now viewport-gated and reader-toggleable.

const base = { viewportAllows: true, userEnabled: true, entryCount: 5, isFullscreen: false };

describe("viewportAllowsMinimap", () => {
  it("rules out phone and tablet widths", () => {
    for (const width of [320, 375, 414, 768, 1023]) expect(viewportAllowsMinimap(width)).toBe(false);
  });

  it("allows desktop widths", () => {
    for (const width of [MINIMAP_MIN_VIEWPORT_WIDTH, 1280, 1920, 3440]) expect(viewportAllowsMinimap(width)).toBe(true);
  });
});

describe("shouldShowMinimap", () => {
  it("shows the minimap in the ordinary desktop case", () => {
    expect(shouldShowMinimap(base)).toBe(true);
  });

  it("stays off on a narrow viewport even when the reader enabled it", () => {
    expect(shouldShowMinimap({ ...base, viewportAllows: false })).toBe(false);
  });

  it("honours the reader switching it off", () => {
    expect(shouldShowMinimap({ ...base, userEnabled: false })).toBe(false);
  });

  it("stays off in fullscreen, where the art owns the whole viewport", () => {
    expect(shouldShowMinimap({ ...base, isFullscreen: true })).toBe(false);
  });

  it("stays off when there is nothing to navigate", () => {
    expect(shouldShowMinimap({ ...base, entryCount: 0 })).toBe(false);
    expect(shouldShowMinimap({ ...base, entryCount: 1 })).toBe(false);
    expect(shouldShowMinimap({ ...base, entryCount: 2 })).toBe(true);
  });
});
