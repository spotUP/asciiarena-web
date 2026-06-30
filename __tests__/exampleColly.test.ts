import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCollyBytes } from "@/lib/collyTrailer";
import { detectLogoSections } from "@/lib/logoSections";
import { buildLogoRows } from "@/lib/collyLogoRows";
import { parseCollyIndex } from "@/lib/collyIndex";
import { encodeReleaseText, stripFileIdDiz } from "@/lib/releaseText";

// The canonical end-to-end example: a colly that exercises every parse feature.
// If this breaks, the artist guidelines no longer match the parser.
describe("example-arena-colly fixture", () => {
  const bytes = new Uint8Array(readFileSync(join(__dirname, "fixtures", "example-arena-colly.txt")));
  const { visible, meta } = parseCollyBytes(bytes);
  // The release flow: decode visible bytes, strip the embedded file_id.diz.
  const text = stripFileIdDiz(encodeReleaseText(visible, "auto")).content;

  it("parses the invisible trailer (font / colours / soundtrack)", () => {
    expect(meta.font).toBe("TopazPlus_a1200");
    expect(meta.fg).toBe("#55ff55");
    expect(meta.bg).toBe("#111111");
    expect(meta.soundtrack).toBe("Protracker/4-Mat/madness.mod");
  });

  it("hides the trailer + file_id.diz from the visible art", () => {
    expect(text).not.toContain("soundtrack:");
    expect(text).not.toContain("FILE_ID");
    expect(new TextDecoder("latin1").decode(visible)).not.toContain("soundtrack:");
  });

  it("detects the three captioned logos", () => {
    const sections = detectLogoSections(text);
    expect(sections.length).toBe(3);
  });

  it("extracts logo labels and treats 'for X' as a dedication, not the logo", () => {
    const rows = buildLogoRows(1, text, { artists: [], crews: [], users: [] });
    const labels = rows.map((r) => r.label);
    expect(labels.some((l) => /STATiC/i.test(l))).toBe(true);
    expect(labels.some((l) => /up rough/i.test(l))).toBe(true);
    expect(labels.some((l) => /ROGUELANDS/i.test(l))).toBe(true);
    // The recipient after "for" is excluded from the search key.
    const statik = rows.find((r) => /STATiC/i.test(r.label))!;
    expect(statik.label_norm).not.toContain("nexus");
    const rogue = rows.find((r) => /ROGUELANDS/i.test(r.label))!;
    expect(rogue.label_norm).not.toContain("zeus");
  });

  it("parses the embedded oN> index", () => {
    const idx = parseCollyIndex(text);
    expect(idx.map((e) => e.name)).toEqual(["STATiC", "UP ROUGH", "ROGUELANDS"]);
  });
});
