/**
 * AnsiEditor mount entry point.
 *
 * Mounts the vendored text0wnz engine into a host DOM element and returns a
 * typed handle for the embedding layer (React wrapper, tests, etc.).
 *
 * No React dependency — this module is pure DOM + engine.
 */

import State from "./engine/state.js";
import { createTextArtCanvas } from "./engine/canvas.js";
import { createDefaultPalette } from "./engine/palette.js";
import { encodeAnsBytes } from "./engine/file.js";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface EditorHandle {
  /** Export the current canvas as raw .ans bytes (body + EOF + SAUCE). */
  getAnsiBytes: () => Promise<Uint8Array>;
  /** Load .ans bytes into the editor canvas. */
  loadAnsiBytes: (bytes: Uint8Array) => void;
  /** Tear down the editor and remove its DOM nodes from the host container. */
  destroy: () => void;
}

export interface EditorOpts {
  /** Canvas width in character columns. Default: 80 */
  columns?: number;
  /** Canvas height in character rows. Default: 8 */
  rows?: number;
  /** Font name corresponding to a PNG under /ansi-editor/fonts/. Default: "Topaz+ 1200 8x16" */
  font?: string;
  /** Enable ice-colors (blinking suppressed, 16 background colours). Default: true */
  iceColors?: boolean;
  /** Called once the engine is ready and the initial font has loaded. */
  onReady?: () => void;
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Mount the ANSI editor engine into `container`.
 *
 * The engine's canvas hierarchy is created inside a child `<div>` so that
 * `destroy()` can cleanly remove it without touching other children of
 * `container`.
 *
 * Runtime note: `createTextArtCanvas` fires `readyCallback` after its own
 * internal initial font load completes (line 1941 of canvas.js). We then call
 * `setFont` to load the requested font and configure dimensions — matching the
 * upstream main.js init sequence exactly.
 */
export function initAnsiEditor(
  container: HTMLElement,
  opts: EditorOpts = {}
): EditorHandle {
  const {
    columns = 80,
    rows = 8,
    font = "Topaz+ 1200 8x16",
    iceColors = true,
    onReady,
  } = opts;

  // The engine appends its canvas elements into this wrapper div.
  const wrapper = document.createElement("div");
  container.appendChild(wrapper);

  // Initialise the palette before creating the canvas (matches upstream order).
  State.palette = createDefaultPalette();

  // Create the canvas hierarchy. The ready callback fires after the engine's
  // own default-font load; we then switch to the requested font and configure.
  State.textArtCanvas = createTextArtCanvas(wrapper, () => {
    // setFont is declared async but we intentionally do not await it here:
    // the callback argument is called synchronously inside the font-load
    // completion handler, so the configuration runs at the right moment.
    // State.textArtCanvas was assigned synchronously above; the ! is safe here.
    void State.textArtCanvas!.setFont(font, () => {
      State.textArtCanvas!.resize(columns, rows);
      State.textArtCanvas!.clear();
      State.textArtCanvas!.setIceColors(iceColors);
      onReady?.();
    });
  });

  return {
    getAnsiBytes(): Promise<Uint8Array> {
      return encodeAnsBytes({ iceColors });
    },

    loadAnsiBytes(_bytes: Uint8Array): void {
      // TODO(phase 2): wire to engine loadAnsi via Load API in file.js
    },

    destroy(): void {
      wrapper.remove();
      // TODO(phase 2): also detach engine listeners (keyboard, resize, etc.)
    },
  };
}
