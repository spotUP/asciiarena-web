import { describe, it, expect } from "vitest";
import { measureAnsi, measureAsciiText, checkLogoDims, MAX_LOGO_COLS, MAX_LOGO_ROWS } from "@/lib/ansiDims";

const b = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, "latin1"));

// Build content + EOF + a 128-byte SAUCE record declaring cols/rows.
function withSauce(content: string, cols: number, rows: number): Uint8Array {
  const sauce = new Uint8Array(128);
  "SAUCE00".split("").forEach((c, i) => (sauce[i] = c.charCodeAt(0)));
  const dv = new DataView(sauce.buffer);
  dv.setUint16(96, cols, true); // TInfo1 = width
  dv.setUint16(98, rows, true); // TInfo2 = height
  sauce[104] = 0; // no comments
  return new Uint8Array([...b(content), 0x1a, ...sauce]);
}

describe("measureAnsi", () => {
  it("measures plain ASCII width (longest line) and height (rows)", () => {
    expect(measureAnsi(b("AB\nCDE"))).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("ignores a trailing newline's empty row", () => {
    expect(measureAnsi(b("AB\nCDE\n"))).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("strips ANSI escape sequences before measuring (colors don't add width)", () => {
    // "\x1b[31mRED\x1b[0m\nX" -> visible "RED\nX" -> 3 cols, 2 rows
    expect(measureAnsi(b("\x1b[31mRED\x1b[0m\nX"))).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("uses SAUCE declared dimensions when present", () => {
    const dims = measureAnsi(withSauce("HI", 80, 25));
    expect(dims).toEqual({ cols: 80, rows: 25, source: "sauce" });
  });

  it("auto-wraps a no-newline body at the SAUCE width (standard ANSI art)", () => {
    // 160 chars, no line terminators, SAUCE declares 80 wide -> wraps to 80x2,
    // NOT 160x1. This is how the embedded editor emits .ans and how every
    // viewer renders it; measuring it as one giant row would wrongly reject
    // an 80-col logo.
    const dims = measureAnsi(withSauce("X".repeat(160), 80, 2));
    expect(dims.cols).toBe(80);
    expect(dims.rows).toBe(2);
  });

  it("never reports below the actual measured rows when SAUCE under-declares height", () => {
    // Three explicit rows of content, but SAUCE wrongly claims 1 row tall.
    const dims = measureAnsi(withSauce("AB\nCD\nEF", 2, 1));
    expect(dims.cols).toBe(2);
    expect(dims.rows).toBe(3);
  });
});

describe("measureAsciiText", () => {
  it("measures longest line as cols and line count as rows", () => {
    expect(measureAsciiText("AB\nCDE")).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("ignores a single trailing newline's empty row", () => {
    expect(measureAsciiText("AB\nCDE\n")).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("normalises CRLF line endings", () => {
    expect(measureAsciiText("AB\r\nCDE")).toEqual({ cols: 3, rows: 2, source: "measured" });
  });

  it("counts CP437/box-drawing glyphs as one column each", () => {
    // 4 box-drawing chars -> 4 cols, not their UTF-16 length
    expect(measureAsciiText("░▒▓█")).toEqual({ cols: 4, rows: 1, source: "measured" });
  });

  it("accepts an 80x10 logo but flags one column/row over", () => {
    const ok = "X".repeat(80) + "\n";
    expect(checkLogoDims(measureAsciiText(ok.repeat(10)))).toBeNull();
    expect(checkLogoDims(measureAsciiText("X".repeat(81)))).toContain("columns wide");
    expect(checkLogoDims(measureAsciiText("X\n".repeat(11)))).toContain("rows tall");
  });
});

describe("checkLogoDims", () => {
  it("accepts a normal banner (within 80x10)", () => {
    expect(checkLogoDims({ cols: 80, rows: 10, source: "measured" })).toBeNull();
  });
  it("rejects too-wide with a specific reason", () => {
    const reason = checkLogoDims({ cols: MAX_LOGO_COLS + 1, rows: 10, source: "measured" });
    expect(reason).toContain("columns wide");
    expect(reason).toContain(String(MAX_LOGO_COLS));
  });
  it("rejects too-tall with a specific reason", () => {
    const reason = checkLogoDims({ cols: 40, rows: MAX_LOGO_ROWS + 1, source: "measured" });
    expect(reason).toContain("rows tall");
    expect(reason).toContain(String(MAX_LOGO_ROWS));
  });
});
