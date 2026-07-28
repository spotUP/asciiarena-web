import { describe, expect, it } from "vitest";

import {
  CANVAS_GUTTER,
  MAX_COLUMNS,
  MIN_COLUMNS,
  canvasWidth,
  columnsFor,
  columnsForPanel,
} from "@/lib/post-canvas-layout";

/**
 * The bug, as the author saw it: scrollbars inside the post canvas.
 *
 * The composer measured the panel's full width and turned all of it into
 * columns, but editor.css keeps a 16px left gutter for #canvasContainer, so the
 * canvas came out wider than the space it had. Measured on the live page at
 * 878px panel width: 109 columns = 872px of canvas + 16px gutter = 888px inside
 * 870px of viewport. The horizontal scrollbar that appeared then stole 16px of
 * height, which pushed the 416px of canvas + margins past the 416px viewport
 * and raised a vertical scrollbar as well.
 */
describe("post canvas sizing", () => {
  it("leaves no horizontal overflow at the width that produced scrollbars", () => {
    const panelWidth = 878; // measured on the live page

    expect(canvasWidth(columnsForPanel(panelWidth)) + CANVAS_GUTTER).toBeLessThanOrEqual(panelWidth);
  });

  it("overflows when the panel width is used as-is", () => {
    // What the composer used to do. Guards the fix itself: if this stops
    // overflowing, the gutter assumption changed and the case above is no
    // longer proving anything.
    const panelWidth = 878;

    expect(canvasWidth(columnsFor(panelWidth)) + CANVAS_GUTTER).toBeGreaterThan(panelWidth);
  });

  it("fits across the full range of composer widths", () => {
    for (let panelWidth = 700; panelWidth <= 2400; panelWidth += 1) {
      const columns = columnsForPanel(panelWidth);
      // At the clamps the canvas is deliberately not width-driven: below the
      // floor it stays usable for art and scrolls, above the ceiling exports
      // are capped. Neither is a layout mistake.
      if (columns === MIN_COLUMNS || columns === MAX_COLUMNS) continue;
      expect(canvasWidth(columns) + CANVAS_GUTTER).toBeLessThanOrEqual(panelWidth);
    }
  });

  it("never drops below the minimum usable width for art", () => {
    expect(columnsForPanel(0)).toBe(MIN_COLUMNS);
    expect(columnsForPanel(120)).toBe(MIN_COLUMNS);
  });

  it("caps the canvas so exports stay sane", () => {
    expect(columnsForPanel(100_000)).toBe(MAX_COLUMNS);
  });
});
