import { describe, it, expect } from "vitest";
import { normalizeCsi } from "@/lib/archive";

// These guard the byte pipeline that feeds AnsiLove in the archive viewer.
// A regression here makes archive ANSI art render as literal grey text
// (escape codes shown as "[32m...") instead of colour — the exact symptom
// reported for m's-odds.lha.
//
// Note: `lha pq` (quiet) emits the raw file with NO header, so the bytes must
// NOT be stripped — doing so deletes the first rows of the art.

describe("normalizeCsi", () => {
  it("expands single-byte CSI (0x9B) into ESC[ so AnsiLove sees a control code", () => {
    // 0x9B '3' '2' 'm' is an 8-bit "set foreground green" sequence.
    const input = Buffer.from([0x9b, 0x33, 0x32, 0x6d, 0x41]);
    expect([...normalizeCsi(input)]).toEqual([0x1b, 0x5b, 0x33, 0x32, 0x6d, 0x41]);
  });

  it("leaves 7-bit ESC[ sequences untouched", () => {
    const input = Buffer.from([0x1b, 0x5b, 0x33, 0x32, 0x6d]);
    expect([...normalizeCsi(input)]).toEqual([0x1b, 0x5b, 0x33, 0x32, 0x6d]);
  });

  it("returns the same buffer instance when there is no CSI byte to convert", () => {
    const input = Buffer.from("plain ascii", "latin1");
    expect(normalizeCsi(input)).toBe(input);
  });

  it("converts every CSI byte, not just the first", () => {
    const input = Buffer.from([0x9b, 0x41, 0x9b, 0x42]);
    expect([...normalizeCsi(input)]).toEqual([0x1b, 0x5b, 0x41, 0x1b, 0x5b, 0x42]);
  });
});
