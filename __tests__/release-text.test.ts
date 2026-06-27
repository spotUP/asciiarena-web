import { describe, expect, it } from "vitest";
import {
  decodeCp437Bytes,
  decodeReleaseText,
  encodeReleaseText,
  releaseTextEncoding,
  releaseViewerType,
} from "@/lib/releaseText";

describe("release text decoding", () => {
  it("decodes PC charset block art bytes as CP437 glyphs", () => {
    const decoded = decodeCp437Bytes(new Uint8Array([
      0xdc, 0xdb, 0xdb, 0xdb, 0xdf, 0xb2, 0xde, 0xdd,
    ]));

    expect(decoded).toBe("\u2584\u2588\u2588\u2588\u2580\u2593\u2590\u258c");
  });

  it("keeps normal invalid UTF-8 fallback as Latin-1", () => {
    expect(decodeReleaseText(new Uint8Array([0xdc, 0xdb, 0xdf]), "auto"))
      .toBe("\u00dc\u00db\u00df");
  });

  it("HTML-escapes decoded release text", () => {
    expect(encodeReleaseText(new Uint8Array([0x3c, 0x26, 0x3e]), "cp437"))
      .toBe("&lt;&amp;&gt;");
  });

  it("uses CP437 for PC charset broken collys without changing other ASCII collys", () => {
    expect(releaseTextEncoding("ASCII", "pc charset")).toBe("cp437");
    expect(releaseTextEncoding("ASCII", null)).toBe("auto");
  });

  it("uses the text viewer for CP437 colly types", () => {
    expect(releaseTextEncoding("CP437", null)).toBe("cp437");
    expect(releaseViewerType("CP437")).toBe("ASCII");
    expect(releaseViewerType("ANSI")).toBe("ANSI");
  });
});
