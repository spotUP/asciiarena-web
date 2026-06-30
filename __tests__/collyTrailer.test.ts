import { describe, it, expect } from "vitest";
import { parseCollyBytes, resolveFont, sectionsFromLogoMap } from "@/lib/collyTrailer";

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
const SUB = "\x1a";

// Build a minimal 128-byte SAUCE record.
function sauce(opts: { title?: string; author?: string; group?: string; date?: string; width?: number; font?: string }): Uint8Array {
  const rec = new Uint8Array(128).fill(0);
  const put = (off: number, str: string, len: number) => {
    for (let i = 0; i < Math.min(str.length, len); i++) rec[off + i] = str.charCodeAt(i);
  };
  put(0, "SAUCE00", 7);
  if (opts.title) put(7, opts.title, 35);
  if (opts.author) put(42, opts.author, 20);
  if (opts.group) put(62, opts.group, 20);
  if (opts.date) put(82, opts.date, 8);
  if (opts.width) { rec[96] = opts.width & 0xff; rec[97] = (opts.width >> 8) & 0xff; }
  if (opts.font) put(106, opts.font, 22);
  return rec;
}

describe("parseCollyBytes — key:value trailer", () => {
  it("parses key:value lines after Ctrl-Z and hides them from the visible art", () => {
    const art = "  ___ LOGO ___\n |__art__|\n";
    const file = bytes(art + SUB + "font: A1200 Topaz+\nfg: #00ff00\nsoundtrack: Protracker/4-Mat/madness.mod\n");
    const { visible, meta } = parseCollyBytes(file);
    expect(new TextDecoder().decode(visible)).toBe(art); // trailer not in visible
    expect(meta.font).toBe("TopazPlus_a1200");
    expect(meta.fg).toBe("#00ff00");
    expect(meta.soundtrack).toBe("Protracker/4-Mat/madness.mod");
  });

  it("accepts named colours and 3-digit hex", () => {
    const file = bytes("art\n" + SUB + "bg: black\nfg: #0f0\n");
    const { meta } = parseCollyBytes(file);
    expect(meta.bg).toBe("#111111");
    expect(meta.fg).toBe("#00ff00");
  });
});

describe("parseCollyBytes — SAUCE record", () => {
  it("parses a trailing SAUCE record and strips it (+ Ctrl-Z) from the art", () => {
    const art = "ANSI ART HERE\n";
    const file = new Uint8Array([...bytes(art + SUB), ...sauce({ title: "My Colly", author: "spot", group: "up rough", date: "20240615", width: 80, font: "Amiga Topaz 2+" })]);
    const { visible, meta } = parseCollyBytes(file);
    expect(new TextDecoder().decode(visible)).toBe(art);
    expect(meta.title).toBe("My Colly");
    expect(meta.author).toBe("spot");
    expect(meta.crew).toBe("up rough");
    expect(meta.date).toBe("2024-06-15");
    expect(meta.width).toBe(80);
    expect(meta.font).toBe("TopazPlus_a1200");
  });

  it("merges SAUCE (title/author/font) with key:value extras (soundtrack/fg)", () => {
    const art = "art\n";
    const file = new Uint8Array([
      ...bytes(art + SUB + "soundtrack: AHX/Pink/song.ahx\nfg: cyan\n"),
      ...sauce({ author: "zeus", font: "Amiga Topaz 1" }),
    ]);
    const { meta } = parseCollyBytes(file);
    expect(meta.author).toBe("zeus");          // from SAUCE
    expect(meta.font).toBe("Topaz_a500");       // SAUCE "Amiga Topaz 1"
    expect(meta.soundtrack).toBe("AHX/Pink/song.ahx"); // from key:value
    expect(meta.fg).toBe("#55ffff");            // from key:value
  });
});

describe("parseCollyBytes — no trailer", () => {
  it("returns the whole file as visible with empty meta", () => {
    const file = bytes("just art\nno trailer\n");
    const { visible, meta } = parseCollyBytes(file);
    expect(new TextDecoder().decode(visible)).toBe("just art\nno trailer\n");
    expect(meta).toEqual({});
  });
});

describe("explicit logo map (tagged collys)", () => {
  it("parses repeated `logo: <line> <caption>` lines into an ordered map", () => {
    const file = bytes("wild art with chars all over\n" + SUB +
      "logo: 8 STATiC for NEXUS\nlogo: 22 up rough\nlogo: 36 ROGUELANDS for zeus\n");
    const { meta } = parseCollyBytes(file);
    expect(meta.logos).toEqual([
      { line: 8, caption: "STATiC for NEXUS" },
      { line: 22, caption: "up rough" },
      { line: 36, caption: "ROGUELANDS for zeus" },
    ]);
  });

  it("builds exact sections from the map (1-based lines, span to the next logo)", () => {
    const secs = sectionsFromLogoMap([{ line: 8, caption: "a" }, { line: 22, caption: "b" }], 40);
    expect(secs[0]).toMatchObject({ startLine: 7, endLine: 20, inkTop: 7 });
    expect(secs[1]).toMatchObject({ startLine: 21, endLine: 39 }); // last spans to totalLines
  });
});

describe("resolveFont", () => {
  it("maps values, labels, and SAUCE names", () => {
    expect(resolveFont("TopazPlus_a1200")).toBe("TopazPlus_a1200");
    expect(resolveFont("A1200 Topaz+")).toBe("TopazPlus_a1200");
    expect(resolveFont("Amiga Topaz 2+")).toBe("TopazPlus_a1200");
    expect(resolveFont("mOsOul")).toBe("mOsOul");
    expect(resolveFont("nonsense")).toBeUndefined();
  });
});
