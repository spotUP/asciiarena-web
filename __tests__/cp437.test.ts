import { describe, it, expect } from "vitest";
import { encodeCp437, toBase64, hasAnsi } from "@/lib/cp437";

describe("cp437 bridge", () => {
  it("round-trips ASCII and ANSI escapes exactly", () => {
    const s = "Hello \x1b[0;1mWorld\x1b[0m 713-460-8217";
    const bytes = encodeCp437(s);
    expect(Array.from(bytes.slice(0, 5))).toEqual([72, 101, 108, 108, 111]);
    expect(bytes[6]).toBe(0x1b);
    const back = toBase64(bytes);
    const bin = atob(back);
    expect(bin.length).toBe(s.length);
    for (let i = 0; i < bin.length; i++) expect(bin.charCodeAt(i)).toBe(s.charCodeAt(i));
  });

  it("maps box drawing back to CP437 bytes", () => {
    // U+2556 BOX DRAWINGS ... : CP437 0xB7. U+2588 FULL BLOCK: 0xDB.
    expect(encodeCp437("╖█")[0]).toBe(0xb7);
    expect(encodeCp437("╖█")[1]).toBe(0xdb);
    // Outside CP437 -> "?"
    expect(encodeCp437("★")[0]).toBe(0x3f);
  });

  it("detects ANSI worth rendering", () => {
    expect(hasAnsi("\x1b[0;1mHi\x1b[0m")).toBe(true);
    expect(hasAnsi("plain | box | art")).toBe(false);
    expect(hasAnsi("BBS 713-460-8217")).toBe(false);
  });
});
