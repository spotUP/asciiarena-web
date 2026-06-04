import type { TextArtCanvas } from "./engine-types";

/**
 * Creates the text-art canvas hierarchy inside `canvasContainer` and calls
 * `callback` when the engine's initial font load is complete.
 * Returns the canvas API object (also stored as State.textArtCanvas).
 */
export declare function createTextArtCanvas(
  canvasContainer: HTMLElement,
  callback: () => void
): TextArtCanvas;

declare const _default: { createTextArtCanvas: typeof createTextArtCanvas };
export default _default;
