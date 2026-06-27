import { describe, expect, it } from "vitest";
import {
  decodeCp437Bytes,
  decodeReleaseText,
  encodeReleaseText,
  releaseTextEncoding,
  releaseViewerType,
  stripFileIdDiz,
  BEGIN_FILE_ID_DIZ,
  END_FILE_ID_DIZ,
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

describe("stripFileIdDiz", () => {
  it("returns text unchanged when no markers present", () => {
    const result = stripFileIdDiz("hello world");
    expect(result.content).toBe("hello world");
    expect(result.dizText).toBeNull();
  });

  it("extracts content between @BEGIN_FILE_ID.DIZ and @END_FILE_ID.DIZ", () => {
    const result = stripFileIdDiz(
      `before text\n${BEGIN_FILE_ID_DIZ}\nembedded diz content\n${END_FILE_ID_DIZ}\nafter text`
    );
    expect(result.content).toBe("before text\nafter text");
    expect(result.dizText).toBe("embedded diz content");
  });

  it("trims whitespace from extracted diz text", () => {
    const result = stripFileIdDiz(
      `${BEGIN_FILE_ID_DIZ}\n\n  diz here  \n\n${END_FILE_ID_DIZ}`
    );
    expect(result.dizText).toBe("diz here");
  });

  it("returns null dizText for empty content between markers", () => {
    const result = stripFileIdDiz(
      `before${BEGIN_FILE_ID_DIZ}${END_FILE_ID_DIZ}after`
    );
    expect(result.content).toBe("beforeafter");
    expect(result.dizText).toBeNull();
  });

  it("handles markers without content between them", () => {
    const result = stripFileIdDiz(
      `before${BEGIN_FILE_ID_DIZ}\n${END_FILE_ID_DIZ}after`
    );
    expect(result.content).toBe("beforeafter");
    expect(result.dizText).toBeNull();
  });

  it("handles SMS-HATE.TXT style embedded diz content", () => {
    // Real CP437 block characters survive in the text
    const input =
      "ascii art header art here\nmore art\n" +
      `${BEGIN_FILE_ID_DIZ}\n` +
      "\u2584\u2588\u2588\u2588\u2580 header block art\n" +
      `${END_FILE_ID_DIZ}\n` +
      "rest of the colly content";
    const result = stripFileIdDiz(input);
    expect(result.content).toBe("ascii art header art here\nmore art\nrest of the colly content");
    expect(result.dizText).toBe("\u2584\u2588\u2588\u2588\u2580 header block art");
  });
});
