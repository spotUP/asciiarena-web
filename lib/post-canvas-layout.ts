/**
 * Canvas sizing for the forum composer.
 *
 * Kept out of the component so it can be tested without mounting the editor:
 * the engine locks the canvas at mount, so getting this wrong is not
 * recoverable at runtime, it just leaves the author with scrollbars.
 */

/** Character cell width in the editor's 8xN bitmap fonts. */
export const CELL_WIDTH = 8;

/**
 * A forum post is not a site logo, so the canvas is not pinned to 80 columns.
 * It takes whatever the composer column gives it, within reason: narrower than
 * 80 stops being usable for art, and past ~240 the export gets silly.
 */
export const MIN_COLUMNS = 80;
export const MAX_COLUMNS = 240;

/**
 * Horizontal space inside the viewport that the canvas does NOT get.
 * editor.css anchors #canvasContainer with `margin: 8px auto 8px 16px`, so a
 * 16px left gutter comes out of the viewport's width.
 */
export const CANVAS_GUTTER = 16;

/**
 * Columns that fit in `pixelWidth`. Takes the width available to the CANVAS,
 * not the width of the panel -- use columnsForPanel for the latter.
 */
export function columnsFor(pixelWidth: number): number {
  const fits = Math.floor(pixelWidth / CELL_WIDTH);
  return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, fits));
}

/**
 * Columns for a composer panel of `panelWidth`. The gutter comes off first:
 * the viewport does not hand its full width to the canvas, and a canvas even
 * one column too wide raises a horizontal scrollbar whose 16px of height then
 * pushes the canvas past the viewport vertically and raises a vertical one.
 */
export function columnsForPanel(panelWidth: number): number {
  return columnsFor(panelWidth - CANVAS_GUTTER);
}

/** Pixel width the canvas will occupy at a given column count. */
export function canvasWidth(columns: number): number {
  return columns * CELL_WIDTH;
}
