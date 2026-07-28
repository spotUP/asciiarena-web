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
  /**
   * The typed characters on the canvas, as plain text.
   *
   * The canvas is the composer, so this is what a post's searchable body and
   * its @mentions are read from. Only printable ASCII survives: block glyphs
   * and other CP437 art characters become spaces, because they are drawing,
   * not words.
   */
  getText: () => string;
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
  /**
   * Show the File menu's save and export items. Default: true.
   *
   * The forum composer passes false: a post is delivered by posting it, so
   * "Save as XBin" and "Export as PNG" are noise there. The logo form keeps
   * them -- a logo is a file you are submitting, so taking a copy makes sense.
   */
  fileExport?: boolean;
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
    fileExport = true,
    onReady,
  } = opts;

  // Inject the editor UI inside a scoped wrapper so editor.css only applies here.
  const root = document.createElement("div");
  root.className = "ansi-editor-root";
  // Focusable so the editor can own the keyboard explicitly. Without this the
  // canvas could never take focus away from a form field on the host page, so
  // clicking the canvas left the caret in that field and typing went there --
  // and the engine compensated by grabbing keys on hover, which hijacked the
  // page's own inputs. -1 keeps it out of the tab order; the click is the
  // deliberate act.
  root.tabIndex = -1;
  root.style.outline = "none";
  root.innerHTML = EDITOR_MARKUP;
  const claimFocus = () => {
    if (!root.contains(document.activeElement)) root.focus({ preventScroll: true });
  };
  root.addEventListener("pointerdown", claimFocus);
  container.appendChild(root);

  const boot = bootstrapEditor(root, {
    columns,
    rows,
    font,
    iceColors,
    onReady,
  });

  // Hide the save/export items -- do NOT remove them.
  //
  // The engine wires every menu item by id with onClick(el, fn), which
  // dereferences el immediately. bootstrapEditor RETURNS synchronously but goes
  // on booting asynchronously, so anything removed here disappears before the
  // boot reaches its wiring: `onClick($('saveAnsi'), Save.ans)` then threw
  // "Cannot read properties of null (reading 'addEventListener')", which killed
  // the rest of boot -- including Toolbar.add($('keyboard')). The editor came up
  // with no active tool: nothing could be typed and no tool button responded.
  // Hiding leaves every id resolvable, so boot completes and the items are
  // simply unreachable. The separators go too, or the menu is left with
  // dividers around a single item.
  if (!fileExport) {
    root
      .querySelectorAll<HTMLElement>(
        "#fileList #saveAnsi, #fileList #saveBin, #fileList #saveXbin, " +
          "#fileList #savePng, #fileList #saveUtf8, #fileList #savePlaintext, " +
          "#fileList .separator",
      )
      .forEach(el => {
        el.style.display = "none";
      });
  }

  // The header is buttons, not menus.
  //
  // MOVED, not copied: #editList is the shortcut list the Edit menu used to
  // show, and the engine has already wired several of its entries by id. Moving
  // the node keeps those listeners and keeps every id unique.
  const shortcutsBody = root.querySelector("#shortcutsBody");
  const editList = root.querySelector<HTMLElement>("#editList");
  if (shortcutsBody && editList) {
    editList.classList.remove("hide", "menuList");
    editList.style.display = "block";
    shortcutsBody.appendChild(editList);
  }

  // Hidden, never removed -- see the note above about the async boot. The Edit
  // menu is replaced by the Keys button everywhere. [i] opened a SAUCE record
  // that nothing on this site reads. The File menu title goes only where it
  // would be a one-item menu; where it still holds the export items it stays,
  // and there the Clear button would duplicate its Clear canvas entry.
  const hide = (sel: string) => {
    const el = root.querySelector<HTMLElement>(sel);
    if (el) el.style.display = "none";
  };
  hide("#editMenu");
  hide("#navSauce");
  hide(fileExport ? "#navClear" : "#fileMenu");

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

    getText(): string {
      const canvas = State.textArtCanvas;
      if (!canvas || typeof canvas.getImageData !== "function") return "";
      const cells = canvas.getImageData();
      const columns = canvas.getColumns();
      const rows = canvas.getRows();
      if (!columns || !rows) return "";

      const lines: string[] = [];
      for (let y = 0; y < rows; y++) {
        let line = "";
        for (let x = 0; x < columns; x++) {
          // Top byte is the character code; the rest is colour.
          const code = cells[y * columns + x] >> 8;
          line += code >= 32 && code < 127 ? String.fromCharCode(code) : " ";
        }
        lines.push(line.replace(/\s+$/, ""));
      }
      // Drop trailing blank rows so a mostly-empty canvas does not store a
      // block of newlines.
      while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
      return lines.join("\n");
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
      root.removeEventListener("pointerdown", claimFocus);
      paletteBar.destroy();
      boot.teardown();
      root.remove();
    },
  };
}
