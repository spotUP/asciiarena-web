import { describe, expect, it } from "vitest";
import {
  decodeCp437Bytes,
  decodeReleaseText,
  encodeReleaseText,
  releaseTextEncoding,
  releaseViewerType,
  stripFileIdDiz,
  looksLikeCp437Art,
  isRenderableArt,
  isAnsiAnimation,
  BEGIN_FILE_ID_DIZ,
  END_FILE_ID_DIZ,
} from "@/lib/releaseText";

const esc = (s: string) => new TextEncoder().encode(s.replace(/\\e/g, "\x1b"));

describe("release text decoding", () => {
  it("decodes PC charset block art bytes as CP437 glyphs", () => {
    const decoded = decodeCp437Bytes(new Uint8Array([
      0xdc, 0xdb, 0xdb, 0xdb, 0xdf, 0xb2, 0xde, 0xdd,
    ]));

    expect(decoded).toBe("\u2584\u2588\u2588\u2588\u2580\u2593\u2590\u258c");
  });

  it("still decodes block art as CP437 when the release is typed PC/CP437", () => {
    // 0xDC 0xDB 0xDF = ▄ █ ▀ in CP437, not Ü Û ß in Latin-1
    expect(decodeReleaseText(new Uint8Array([0xdc, 0xdb, 0xdf]), "cp437"))
      .toBe("\u2584\u2588\u2580");
  });

  it("decodes non-UTF-8 'auto' (Amiga) text as Latin-1, not CP437", () => {
    // aSCIIaRENA is Amiga-first: in "auto" mode 0xB4 0xF7 are acute + division
    // (Latin-1 decoration), not CP437 box/approx glyphs. PC art uses "cp437".
    expect(decodeReleaseText(new Uint8Array([0xb4, 0xf7]), "auto"))
      .toBe("\u00b4\u00f7");
  });

  it("renders the m's-odds file_id.diz decoration as Amiga Latin-1", () => {
    // Regression: 0xB4 and 0xF7 were mangled into box/approx glyphs by the
    // global CP437 fallback added in 0249030. Amiga colly \u2014 must be Latin-1.
    const bytes = new Uint8Array([
      0xf7, 0x65, 0xf7, 0x20, 0xb4, 0x61, 0x6e, 0x64, 0x20,
      0x74, 0x68, 0x65, 0x20, 0x6f, 0x64, 0x64, 0x73, 0x3f, 0xb4,
    ]);
    expect(decodeReleaseText(bytes, "auto")).toBe("\u00f7e\u00f7 \u00b4and the odds?\u00b4");
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

  it("decodes invalid-UTF-8 'auto' bytes as Latin-1 (not CP437)", () => {
    // 0xD5 0xCD is NOT valid UTF-8 (0xCD is not a continuation byte), so it
    // hits the fallback. On an Amiga-first site that fallback is Latin-1:
    // 0xD5 0xCD = Õ Í, not CP437 ╒═.
    const result = decodeReleaseText(new Uint8Array([0xD5, 0xCD]), "auto");
    expect(result).toBe("ÕÍ");
  });

  it("re-decodes genuine CP437-disguised-as-UTF-8 art (heuristic, >=16 high bytes)", () => {
    // 0xC3 0xA9 is a valid UTF-8 'e-acute'. 16 such pairs are valid UTF-8 but
    // only 16 non-ASCII chars from 32 high bytes (50% < 80% threshold), so the
    // heuristic treats it as CP437 art and re-decodes byte-per-byte.
    const bytes = new Uint8Array(Array.from({ length: 16 }, () => [0xc3, 0xa9]).flat());
    const result = decodeReleaseText(bytes, "auto");
    expect(result).toBe(decodeCp437Bytes(bytes));
    expect(result.length).toBe(32);
  });

  it("keeps genuine UTF-8 when high bytes survive", () => {
    // Genuine UTF-8: "café" where é = 0xC3 0xA9
    // 2 high bytes → 1 non-ASCII char (é), which is 50%.
    // But with only 2 high bytes and 1 char, it's right at the boundary.
    // Add more ASCII chars so the ratio doesn't skew.
    const utf8 = new TextEncoder().encode("abc \u00e9 def");
    const result = decodeReleaseText(utf8, "auto");
    expect(result).toBe("abc \u00e9 def");
  });

  it("auto-detects untyped CP437 block art by content and decodes as CP437", () => {
    // PC art stored under a generic "ASCII" type: a run of shade/block glyphs
    // is unmistakably CP437, so decode it as CP437 even in "auto" mode.
    const art = new Uint8Array([0xb0, 0xb1, 0xb2, 0xdb, 0xdc, 0xdf, 0xdb, 0xb2]);
    expect(decodeReleaseText(art, "auto")).toBe(decodeCp437Bytes(art));
    expect(decodeReleaseText(art, "auto")).toContain("\u2588"); // full block, not Latin-1
  });

  it("does NOT misread sparse Latin-1 decoration (the diz) as CP437 art", () => {
    // 0xB4 / 0xF7 are Latin-1 punctuation, not block glyphs \u2014 stay Latin-1.
    expect(looksLikeCp437Art(new Uint8Array([0xb4, 0xf7, 0xb4]))).toBe(false);
  });

  it("looksLikeCp437Art needs several block glyphs (avoids false positives)", () => {
    expect(looksLikeCp437Art(new Uint8Array([0xb0, 0xb1, 0xb2]))).toBe(false);
    expect(looksLikeCp437Art(new Uint8Array([0xb0, 0xb1, 0xb2, 0xdb, 0xdc, 0xdf]))).toBe(true);
  });

  it("isRenderableArt accepts text art by content, regardless of filename", () => {
    // Plain ASCII logo (like bis.2kADbig: no recognised extension).
    expect(isRenderableArt(new TextEncoder().encode("  _____/\\\n /     \\ \n"))).toBe(true);
    // ANSI art (ESC sequences allowed).
    expect(isRenderableArt(new Uint8Array([0x1b, 0x5b, 0x33, 0x32, 0x6d, 0x41, 0x0a]))).toBe(true);
    // CP437 block art (high bytes are fine).
    expect(isRenderableArt(new Uint8Array([0xdb, 0xdc, 0xdf, 0x0a]))).toBe(true);
  });

  it("isAnsiAnimation detects cursor-repositioning animations, not static art", () => {
    // Many absolute cursor positions (ESC[r;cH) => animation (like PLANE_LOVE).
    let anim = "";
    for (let i = 0; i < 12; i++) anim += `\\e[${i + 1};5HX`;
    expect(isAnsiAnimation(esc(anim))).toBe(true);
    // Static ANSI art: colour codes + newlines, no repositioning.
    expect(isAnsiAnimation(esc("\\e[32mhello\\n\\e[36mworld\\n"))).toBe(false);
    // A couple of positions is not enough (below threshold).
    expect(isAnsiAnimation(esc("\\e[1;1Hhi\\e[2;1Hyo"))).toBe(false);
  });

  it("isRenderableArt rejects binary blobs (NUL / stray control bytes)", () => {
    // A NUL byte => binary (image/module/executable).
    expect(isRenderableArt(new Uint8Array([0x41, 0x00, 0x42]))).toBe(false);
    // PNG header begins with 0x89 'PNG' then a NUL-laden body.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(isRenderableArt(png)).toBe(false);
    // Dense non-text control bytes => binary.
    expect(isRenderableArt(new Uint8Array(100).fill(0x07))).toBe(false);
    expect(isRenderableArt(new Uint8Array())).toBe(false);
  });

  it("treats large plain-ASCII art with a few stray block bytes as NOT CP437", () => {
    // Like m's-odds.txt: a big ASCII file with a handful of incidental high
    // bytes (well under the density threshold) must not be read as block art.
    const big = new Uint8Array(20000).fill(0x20); // 20 KB of spaces
    for (let i = 0; i < 30; i++) big[i] = 0xdb;    // 30 block bytes = 0.15%
    expect(looksLikeCp437Art(big)).toBe(false);
    // A dense block-art file of the same size IS CP437.
    const dense = new Uint8Array(20000).fill(0xb1); // 100% shade glyphs
    expect(looksLikeCp437Art(dense)).toBe(true);
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
