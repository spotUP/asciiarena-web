/**
 * Read-only ANSI renderer built on the editor's own engine.
 *
 * Forum posts are drawn in the text0wnz editor, which offers ~90 bitmap fonts.
 * AnsiLove.js -- the renderer behind AnsiLogo and the rotating site header --
 * can only render nine of them, so anything drawn in another face would come
 * back silently wrong. Rendering with the same engine that authored the art
 * means a post looks exactly like the canvas it was drawn on, whatever font it
 * used. AnsiLove stays as the fallback (see components/forum/AnsiPost.tsx).
 *
 * Output is a PNG data URL rather than a live canvas: posts are immutable, a
 * data URL is trivially cacheable and scalable, and an <img> avoids canvas
 * re-parenting when React re-renders the list.
 *
 * SERIALISED ON PURPOSE. The engine keeps font metrics on a module-level
 * State singleton (loadFontFromImage writes State.fontWidth/fontHeight), so two
 * concurrent renders would race and one would draw at the other's cell size. A
 * topic page showing twenty ANSI posts renders them one after another.
 */

import { visibleRows } from "@/lib/ansiTrim";
import { Load, loadAnsi } from "./engine/file.js";
import { loadFontFromImage } from "./engine/font.js";
import { createDefaultPalette } from "./engine/palette.js";

export interface RenderedAnsi {
  /** PNG data URL. */
  url: string;
  width: number;
  height: number;
  columns: number;
  rows: number;
}

interface EngineFont {
  getWidth: () => number;
  getHeight: () => number;
  draw: (
    charCode: number,
    foreground: number,
    background: number,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ) => void;
}

/** The engine's own default when a file carries no SAUCE font name. */
const DEFAULT_FONT = "CP437 8x16";

/**
 * Guard against a hostile or corrupt file asking for a canvas that would pin
 * the tab. 4000 rows of 8x16 is already far past any real post.
 */
const MAX_CELLS = 320_000;

const cache = new Map<string, RenderedAnsi>();
let chain: Promise<unknown> = Promise.resolve();

/** Run `job` after every previously queued render has finished. */
function serialise<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  // Keep the chain alive even when a render rejects, or one bad post would
  // block every later one.
  chain = run.catch(() => {});
  return run;
}

function decodeBase64(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function draw(bytes: Uint8Array): Promise<RenderedAnsi> {
  const parsed = loadAnsi(bytes);
  // loadAnsi returns width/height in cells and `data` as flat [char, fg, bg]
  // TRIPLETS -- not the packed 16-bit cells canvas.getImageData() hands out.
  // The two layouts are easy to confuse; lib/__tests__/ansi-editor-roundtrip
  // pins this one.
  const columns = parsed.width;
  const rows = parsed.height;
  const data = parsed.data;
  if (!columns || !rows || !data) throw new Error("ANSI file has no content");
  if (columns * rows > MAX_CELLS) throw new Error("ANSI file is too large to render");

  // A file's SAUCE carries the SAUCE font name ("Amiga Topaz 2+"), not the
  // app's ("Topaz+ 1200 8x16"), and the loader builds its PNG path straight
  // from whatever name it is given. Passing the SAUCE name through asked for
  // /ansi-editor/fonts/Amiga Topaz 2plus.png, which 404s, so EVERY Amiga-font
  // post fell back to AnsiLove -- which only covers nine fonts, so the art came
  // out in the wrong one.
  //
  // sauceToAppFont is the engine's own table for this. It returns null for a
  // name it does not know, which includes files whose SAUCE already holds an
  // app name, so fall back to the raw name before the default.
  const sauceName = parsed.fontName?.trim();
  const fontName =
    (sauceName ? Load.sauceToAppFont(sauceName) : null) || sauceName || DEFAULT_FONT;

  const font = (await loadFontFromImage(
    fontName,
    parsed.letterSpacing ?? false,
    createDefaultPalette(),
    1,
  )) as EngineFont;

  // The composer's canvas is a fixed 25 rows, so a one-line reply carries 24
  // blank rows of real stored content. They are dropped here rather than in the
  // file, so the attachment stays exactly what was drawn and posts already in
  // the database shrink too. lib/ansiTrim.ts defines "blank".
  const drawnRows = visibleRows(data, columns, rows);

  const cellW = font.getWidth();
  const cellH = font.getHeight();
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellW;
  canvas.height = drawnRows * cellH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D context");

  for (let index = 0; index < columns * drawnRows; index++) {
    const at = index * 3;
    const charCode = data[at] ?? 0;
    const foreground = data[at + 1] ?? 7;
    let background = data[at + 2] ?? 0;
    // `noblink` is the engine's name for ice colours. Without them the high
    // background bit means "blink", not a brighter background -- same branch
    // as canvas.js:317. A still image renders the non-blinking half.
    if (!parsed.noblink && background >= 8) background -= 8;
    font.draw(charCode, foreground, background, ctx, index % columns, Math.floor(index / columns));
  }

  // `rows` reports what was rendered, not what the file declared, so a caller
  // sizing a box from it agrees with the image it gets.
  return {
    url: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    columns,
    rows: drawnRows,
  };
}

/**
 * Render base64-encoded .ans bytes to a PNG data URL. Resolves from cache when
 * the same art has already been rendered in this tab. Rejects if the file
 * cannot be parsed or its font cannot be loaded, so callers can fall back.
 */
export function renderAnsiB64(ansiB64: string): Promise<RenderedAnsi> {
  const hit = cache.get(ansiB64);
  if (hit) return Promise.resolve(hit);

  return serialise(async () => {
    const again = cache.get(ansiB64);
    if (again) return again;
    const bytes = decodeBase64(ansiB64);
    if (!bytes) throw new Error("Post attachment is not valid base64");
    const out = await draw(bytes);
    cache.set(ansiB64, out);
    return out;
  });
}
