// Measure the rendered dimensions (columns × rows) of an ANSI/ASCII art file so
// uploads too big for the site header can be rejected with a clear reason.
// Pure (no DOM), unit-testable. ANSI escape sequences and the SAUCE trailer must
// be stripped to see how big the art actually is.

export interface AnsiDims {
  cols: number; // width in characters
  rows: number; // height in rows
  source: "sauce" | "measured";
}

const ESC = 0x1b;
const EOF = 0x1a; // Ctrl-Z / DOS EOF marker that precedes a SAUCE record
const LF = 0x0a;
const CR = 0x0d;

// SAUCE: a 128-byte metadata record at the very end of the file, optionally
// preceded by a COMNT block. TInfo1 (offset 96) = width, TInfo2 (offset 98) =
// height, Comments (offset 104) = number of 64-byte COMNT lines.
function parseSauce(bytes: Uint8Array): { cols: number; rows: number; trimTo: number } | null {
  if (bytes.length < 128) return null;
  const start = bytes.length - 128;
  let sig = "";
  for (let i = 0; i < 7; i++) sig += String.fromCharCode(bytes[start + i]);
  if (sig !== "SAUCE00") return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const cols = view.getUint16(start + 96, true);
  const rows = view.getUint16(start + 98, true);
  const comments = bytes[start + 104];

  let contentEnd = start;
  if (comments > 0) {
    const comntStart = start - comments * 64 - 5; // "COMNT" + N*64 bytes
    if (comntStart >= 0) {
      let csig = "";
      for (let i = 0; i < 5; i++) csig += String.fromCharCode(bytes[comntStart + i]);
      if (csig === "COMNT") contentEnd = comntStart;
    }
  }
  if (contentEnd > 0 && bytes[contentEnd - 1] === EOF) contentEnd -= 1;
  return { cols, rows, trimTo: contentEnd };
}

// Strip ANSI control sequences and measure visible columns/rows.
function measureStripped(bytes: Uint8Array): { cols: number; rows: number } {
  let maxCols = 0;
  let col = 0;
  let rows = 1;
  let i = 0;
  const n = bytes.length;
  while (i < n) {
    const b = bytes[i];
    if (b === ESC) {
      i++;
      if (i < n && bytes[i] === 0x5b /* [ */) {
        i++;
        // CSI parameters/intermediates run until a final byte 0x40-0x7E.
        while (i < n && (bytes[i] < 0x40 || bytes[i] > 0x7e)) i++;
        i++; // consume the final byte
      } else {
        i++; // some other ESC x — drop the following byte too
      }
      continue;
    }
    if (b === LF) { if (col > maxCols) maxCols = col; col = 0; rows++; i++; continue; }
    if (b === CR || b === EOF) { i++; continue; }
    col++;
    i++;
  }
  if (col > maxCols) maxCols = col;
  // A trailing newline leaves an empty final row; don't count it.
  if (col === 0 && rows > 1) rows--;
  return { cols: maxCols, rows };
}

export function measureAnsi(bytes: Uint8Array): AnsiDims {
  const sauce = parseSauce(bytes);
  const content = sauce ? bytes.subarray(0, sauce.trimTo) : bytes;
  const measured = measureStripped(content);
  // Prefer the artist's declared SAUCE dimensions when present and sane, but
  // never below what we actually measured (some files under-declare).
  if (sauce && sauce.cols > 0 && sauce.rows > 0) {
    return {
      cols: Math.max(sauce.cols, measured.cols),
      rows: Math.max(sauce.rows, measured.rows),
      source: "sauce",
    };
  }
  return { cols: measured.cols, rows: measured.rows, source: "measured" };
}

// Measure plain ASCII-art text from the logo editor (a string, not bytes):
// rows = line count, cols = the longest line's visible character count. Counts
// Unicode code points so CP437/box-drawing glyphs each count as one column. A
// single trailing newline doesn't add a phantom empty row.
export function measureAsciiText(text: string): AnsiDims {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  let cols = 0;
  for (const line of lines) cols = Math.max(cols, [...line].length);
  return { cols, rows: Math.max(1, lines.length), source: "measured" };
}

// Header-logo limits. ANSI logos render in the rotating site header on every
// page, so cap them to a sensible banner size. Tunable.
export const MAX_LOGO_COLS = 80;
export const MAX_LOGO_ROWS = 8;

// Returns a human-readable rejection reason, or null if the dimensions are OK.
export function checkLogoDims(dims: AnsiDims): string | null {
  if (dims.cols > MAX_LOGO_COLS) {
    return `Logo is ${dims.cols} columns wide; the header allows at most ${MAX_LOGO_COLS}.`;
  }
  if (dims.rows > MAX_LOGO_ROWS) {
    return `Logo is ${dims.rows} rows tall; the header allows at most ${MAX_LOGO_ROWS}.`;
  }
  return null;
}
