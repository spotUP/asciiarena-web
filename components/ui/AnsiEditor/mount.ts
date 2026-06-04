/**
 * AnsiEditor mount entry point.
 *
 * Injects the full text0wnz editor UI (toolbars + palette + canvas, from
 * markup.ts) into a host DOM element, boots the engine against it via
 * `bootstrapEditor`, and returns a typed handle for the embedding layer
 * (React wrapper, tests, etc.).
 *
 * No React dependency — this module is pure DOM + engine.
 *
 * The editor's CSS (editor.css) is scoped under `.ansi-editor-root`, so the
 * injected markup is wrapped in a `<div class="ansi-editor-root">`. The CSS is
 * imported here (client-only) rather than globally so it cannot leak into the
 * rest of the asciiarena (Bootstrap) site.
 */

import "./editor.css";
import { bootstrapEditor } from "./engine/bootstrap.js";
import { encodeAnsBytes } from "./engine/file.js";
import { State } from "./engine/state.js";
import { EDITOR_MARKUP } from "./markup";
import { initPaletteBar, type PaletteApi } from "./paletteBar";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface EditorHandle {
  /** Export the current canvas as raw .ans bytes (body + EOF + SAUCE). */
  getAnsiBytes: () => Promise<Uint8Array>;
  /** Load .ans bytes into the editor canvas. */
  loadAnsiBytes: (bytes: Uint8Array) => void;
  /**
   * True when the canvas holds no visible content — every cell is a space
   * (char 32) or NUL (char 0). A blank 80x10 export is still ~782 bytes
   * (spaces + SAUCE), so byte length alone can't detect an empty logo; this
   * inspects the packed cell buffer directly.
   */
  isEmpty: () => boolean;
  /**
   * The curated list of font names the editor offers (the `data-value`s of the
   * injected `#fontSelect` listbox). This is the same set the old font modal
   * exposed; read from the DOM at mount so there's a single source of truth.
   */
  getFonts: () => string[];
  /** The font the canvas is currently rendering in (e.g. "CP437 8x16"). */
  getCurrentFont: () => string;
  /** Switch the canvas to `name`; the engine re-renders in the new font. */
  setFont: (name: string) => void;
  /** Tear down the editor and remove its DOM nodes from the host container. */
  destroy: () => void;
}

export interface EditorOpts {
  /** Canvas width in character columns. Default: 80 */
  columns?: number;
  /** Canvas height in character rows. Default: 10 */
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
 * Flow:
 *   1. Inject the scoped editor markup into a fresh `.ansi-editor-root` wrapper
 *      appended to `container`.
 *   2. Boot the engine against that wrapper (`bootstrapEditor`). The engine
 *      resolves its DOM via `getElementById` (the markup is now in the
 *      document) and locks the canvas to the requested size + font.
 *   3. Return an `EditorHandle`. `destroy()` runs the real bootstrap teardown
 *      (detach listeners/timers, reset engine singletons) and then removes the
 *      injected DOM, so a remount (React StrictMode) is clean.
 */
export function initAnsiEditor(
  container: HTMLElement,
  opts: EditorOpts = {}
): EditorHandle {
  const {
    columns = 80,
    rows = 10,
    font = "Topaz+ 1200 8x16",
    iceColors = true,
    onReady,
  } = opts;

  // Inject the editor UI inside a scoped wrapper so editor.css only applies here.
  const root = document.createElement("div");
  root.className = "ansi-editor-root";
  root.innerHTML = EDITOR_MARKUP;
  container.appendChild(root);

  const boot = bootstrapEditor(root, {
    columns,
    rows,
    font,
    iceColors,
    onReady,
  });

  // asciiarena CHANGE 3: build the 2x8 HTML palette bar above the canvas and
  // wire it to the engine palette. bootstrapEditor sets State.palette
  // synchronously, so it is ready here. The engine's own canvas picker is
  // hidden in CSS; this bar is the live colour control.
  const paletteBar = State.palette
    ? initPaletteBar(root, State.palette as PaletteApi)
    : { destroy: () => {} };

  // The curated font set: the `data-value` of every option in the injected
  // `#fontSelect` listbox. Read once at mount (the markup is now in the DOM)
  // so the React picker and the engine share one source of truth.
  const fontNames: string[] = Array.from(
    root.querySelectorAll<HTMLElement>("#fontSelect [role='option']")
  )
    .map(el => el.getAttribute("data-value") ?? "")
    .filter(name => name.length > 0);

  let destroyed = false;

  return {
    getAnsiBytes(): Promise<Uint8Array> {
      return encodeAnsBytes({ iceColors });
    },

    getFonts(): string[] {
      return fontNames.slice();
    },

    getCurrentFont(): string {
      const canvas = State.textArtCanvas;
      if (!canvas || typeof canvas.getCurrentFontName !== "function") return "";
      return canvas.getCurrentFontName();
    },

    setFont(name: string): void {
      const canvas = State.textArtCanvas;
      if (!canvas || typeof canvas.setFont !== "function") return;
      // Engine re-renders the canvas in the new font; we don't need the callback.
      void canvas.setFont(name, () => {});
    },

    loadAnsiBytes(bytes: Uint8Array): void {
      boot.load(bytes);
    },

    isEmpty(): boolean {
      const canvas = State.textArtCanvas;
      if (!canvas || typeof canvas.getImageData !== "function") {
        // No canvas yet → nothing has been drawn → treat as empty.
        return true;
      }
      const cells = canvas.getImageData();
      for (let i = 0; i < cells.length; i++) {
        // Top byte is the char code; 0 (NUL) and 32 (space) are blank.
        const charCode = cells[i] >> 8;
        if (charCode !== 0 && charCode !== 32) return false;
      }
      return true;
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      paletteBar.destroy();
      boot.teardown();
      root.remove();
    },
  };
}
