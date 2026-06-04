import { describe, it, expect } from "vitest";
import { measureAnsi, checkLogoDims, MAX_LOGO_COLS, MAX_LOGO_ROWS } from "@/lib/ansiDims";

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

  it("never reports below the actual measured size even if SAUCE under-declares", () => {
    // content is 5 wide / 1 row, SAUCE wrongly says 2x1
    const dims = measureAnsi(withSauce("HELLO", 2, 1));
    expect(dims.cols).toBe(5);
    expect(dims.rows).toBe(1);
  });
});

describe("checkLogoDims", () => {
  it("accepts a normal banner (within 80x8)", () => {
    expect(checkLogoDims({ cols: 80, rows: 8, source: "measured" })).toBeNull();
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
