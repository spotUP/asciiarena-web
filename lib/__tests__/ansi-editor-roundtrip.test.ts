// @vitest-environment jsdom
//
// The single most important interop guarantee in the project: the embedded
// ANSI editor's `.ans` byte output must PASS the server-side logo validator
// (measureAnsi + checkLogoDims) at the header limit of 80x10, AND survive a
// byte round-trip back through the engine's own decoder. If this breaks,
// artists draw an 80x10 logo in the editor, hit save, and the server rejects
// their own tool's output — a silent, infuriating failure.
//
// Strategy: we do NOT call createTextArtCanvas (it needs a real <canvas> 2d
// context). Instead we install a minimal fake State.textArtCanvas exposing
// exactly the methods buildAnsiBody / createSauce / encodeAnsBytes read, plus
// a fake State.font for getLetterSpacing(). encodeAnsBytes then really runs:
// it serialises our known Uint16Array to a complete .ans (ANSI body + 0x1a +
// 128-byte SAUCE). Nothing under test is stubbed.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encodeAnsBytes, loadAnsi } from "@/components/ui/AnsiEditor/engine/file.js";
import State from "@/components/ui/AnsiEditor/engine/state.js";
import { measureAnsi, checkLogoDims } from "@/lib/ansiDims";

const COLS = 80;
const ROWS = 10;
const FONT_NAME = "Topaz+ 1200 8x16";

// Cells are packed char<<8 | bg<<4 | fg (row-major, index = y*cols+x), exactly
// as the engine's data model stores them.
function pack(charCode: number, fg: number, bg: number): number {
  return (charCode << 8) | ((bg & 0x0f) << 4) | (fg & 0x0f);
}

interface KnownCell {
  x: number;
  y: number;
  char: number;
  fg: number;
  bg: number;
}

// A handful of non-blank cells placed at corners/edges of the 80x10 grid so the
// decoder must reproduce both content and position. fg/bg kept in 0..7 (no
// bold/blink folding) so the decode comparison is unambiguous. The last cell
// sits on the final row (y=9) so the new 10-row height is exercised end to end.
const KNOWN_CELLS: KnownCell[] = [
  { x: 0, y: 0, char: 65 /* 'A' */, fg: 7, bg: 1 },
  { x: 79, y: 0, char: 90 /* 'Z' */, fg: 2, bg: 0 },
  { x: 10, y: 3, char: 35 /* '#' */, fg: 3, bg: 4 },
  { x: 0, y: 9, char: 66 /* 'B' */, fg: 6, bg: 0 },
];

function buildImageData(): Uint16Array {
  const data = new Uint16Array(COLS * ROWS);
  // Blank cell: space (32) on default fg/bg so the body is well-formed.
  for (let i = 0; i < data.length; i++) data[i] = pack(32, 7, 0);
  for (const c of KNOWN_CELLS) {
    data[c.y * COLS + c.x] = pack(c.char, c.fg, c.bg);
  }
  return data;
}

// Minimal fake matching the subset of the textArtCanvas API that the headless
// export path touches: getImageData / getColumns / getRows / getIceColors /
// getCurrentFontName (read by buildAnsiBody + createSauce), plus getXBFontData
// for incidental serialise paths.
interface FakeTextArtCanvas {
  getImageData(): Uint16Array;
  getColumns(): number;
  getRows(): number;
  getIceColors(): boolean;
  getCurrentFontName(): string;
  getXBFontData(): null;
}

interface FakeFont {
  getLetterSpacing(): boolean;
}

describe("ANSI editor .ans round-trip + 80x10 server-validator guard", () => {
  const imageData = buildImageData();

  let prevCanvas: unknown;
  let prevFont: unknown;

  beforeAll(() => {
    // jsdom's canvas has no real 2d context; the engine modules only touch it
    // inside functions we never call, but stub getContext defensively in case
    // any incidental import path probes it.
    if (
      typeof HTMLCanvasElement !== "undefined" &&
      !HTMLCanvasElement.prototype.getContext
    ) {
      (
        HTMLCanvasElement.prototype as unknown as { getContext: () => null }
      ).getContext = () => null;
    }

    prevCanvas = State.textArtCanvas;
    prevFont = State.font;

    const fakeCanvas: FakeTextArtCanvas = {
      getImageData: () => imageData,
      getColumns: () => COLS,
      getRows: () => ROWS,
      getIceColors: () => true,
      getCurrentFontName: () => FONT_NAME,
      getXBFontData: () => null,
    };
    const fakeFont: FakeFont = {
      getLetterSpacing: () => false,
    };

    State.textArtCanvas = fakeCanvas as unknown as typeof State.textArtCanvas;
    State.font = fakeFont as unknown as typeof State.font;
  });

  afterAll(() => {
    State.textArtCanvas = prevCanvas as typeof State.textArtCanvas;
    State.font = prevFont as typeof State.font;
  });

  it("produces .ans bytes that PASS the server logo validator at 80x10", async () => {
    const bytes: Uint8Array = await encodeAnsBytes({
      title: "T",
      author: "A",
      group: "G",
    });

    expect(bytes.length).toBeGreaterThan(128);
    // Must terminate with a 128-byte SAUCE record.
    expect(String.fromCharCode(...bytes.subarray(bytes.length - 128, bytes.length - 121))).toBe(
      "SAUCE00",
    );

    const dims = measureAnsi(bytes);
    expect(dims.cols).toBeLessThanOrEqual(80);
    expect(dims.rows).toBeLessThanOrEqual(10);
    // null = within the header limit; this is the load-bearing interop check.
    expect(checkLogoDims(dims)).toBeNull();
    // SAUCE should declare exactly 80x10.
    expect(dims.cols).toBe(80);
    expect(dims.rows).toBe(10);
  });

  it("round-trips: decoding the .ans reproduces the known cells", async () => {
    const bytes: Uint8Array = await encodeAnsBytes({
      title: "T",
      author: "A",
      group: "G",
    });

    // decoded.data is a flat Uint8Array of [charCode, fg, bg] triplets, row-major.
    const decoded = loadAnsi(bytes);

    expect(decoded.width).toBe(80);
    expect(decoded.height).toBe(10);

    // decoded.data is a flat Uint8Array of [charCode, fg, bg] per cell.
    for (const c of KNOWN_CELLS) {
      const idx = (c.y * decoded.width + c.x) * 3;
      expect(decoded.data[idx]).toBe(c.char);
      expect(decoded.data[idx + 1]).toBe(c.fg);
      expect(decoded.data[idx + 2]).toBe(c.bg);
    }
  });

  // The layout contract AnsiEditor/render.ts depends on. loadAnsi's output is
  // easy to confuse with canvas.getImageData(), which packs a cell into one
  // 16-bit int (charCode << 8 | bg << 4 | fg) -- reading loadAnsi that way
  // renders garbage, silently. These assertions are the discriminator.
  it("reports its size as width and height, not columns and rows", async () => {
    const decoded = loadAnsi(await encodeAnsBytes({}));
    expect(decoded.width).toBe(80);
    expect(decoded.height).toBe(10);
    expect((decoded as unknown as { columns?: number }).columns).toBeUndefined();
    expect((decoded as unknown as { rows?: number }).rows).toBeUndefined();
  });

  it("stores three bytes per cell, so the buffer is width x height x 3", async () => {
    const decoded = loadAnsi(await encodeAnsBytes({}));
    expect(decoded.data.length).toBe(decoded.width * decoded.height * 3);
  });

  it("names the ice-colours flag noblink", async () => {
    const decoded = loadAnsi(await encodeAnsBytes({}));
    expect(typeof decoded.noblink).toBe("boolean");
    expect((decoded as unknown as { iceColors?: boolean }).iceColors).toBeUndefined();
  });
});
