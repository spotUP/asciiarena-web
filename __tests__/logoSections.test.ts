import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { detectLogoSections, computeScrollTarget, pingPongNext } from "@/lib/logoSections";

const colly = (...lines: string[]) => lines.join("\n");

// Two art fragments of the SAME logo, split by ONE internal blank line, sharing
// the same columns. Smart detection should merge them into a single section.
const SPLIT_LOGO = colly(
  "",
  "_/\\__/\\__ ___ /\\/\\ ___ __/\\__/\\_ _/\\",
  "|  ||  | /   \\ |  | /   \\ |  ||  | |  |",
  "|__||__| \\___/ |__| \\___/ |__||__| |__|",
  "", // <- single internal gap that used to split the logo
  "/\\__/\\_ ___ /\\ ___ _/\\__/\\__ ___ /\\_",
  "|  ||  |/   \\|  |/   \\|  ||  | /   \\| |",
  "|__||__|\\___/|__|\\___/|__||__| \\___/|_",
  "",
  "",
);

// Two DISTINCT logos one blank line apart, occupying non-overlapping columns.
// These must stay separate (no over-merge).
const TWO_LOGOS = colly(
  "",
  "/\\_/\\_/\\_/\\__",
  "| || || || _|",
  "|_||_||_||__|",
  "/\\_/\\_/\\_/\\__",
  "|_||_||_||__|",
  "",
  "                              __/\\__/\\__/\\_",
  "                              |  ||  ||  | |",
  "                              |__||__||__|_|",
  "                              __/\\__/\\__/\\_",
  "                              |__||__||__|_|",
  "",
);

// Wide art followed by a short narrow caption line. The caption is a label,
// not a logo, and must be excluded entirely.
const ART_WITH_CAPTION = colly(
  "",
  "_/\\__/\\__ ___ /\\/\\ ___ __/\\__/\\_ _/\\__",
  "|  ||  | /   \\ |  | /   \\ |  ||  | |  ||",
  "|__||__| \\___/ |__| \\___/ |__||__| |__||",
  "|  ||  | /   \\ |  | /   \\ |  ||  | |  ||",
  "|__||__| \\___/ |__| \\___/ |__||__| |__||",
  "",
  "  -mort",
  "",
);

// A small (3-line) but full-width logo — dropped by the old `lineCount >= 5`
// gate, kept now.
const SMALL_LOGO = colly(
  "",
  "_/\\__/\\__ ___ /\\/\\ ___ __/\\__/\\_ _/\\__",
  "|  ||  | /   \\ |  | /   \\ |  ||  | |  ||",
  "|__||__| \\___/ |__| \\___/ |__||__| |__||",
  "",
);

// Two logos separated by a repeating 2-line divider frame (appears 3x). The
// frame's first line has >=3 distinct chars, so it is caught only by the
// repeated-fingerprint rule, not the all-frame rule.
const DIVIDER = colly("+-+-+ DiViDeR neWS +-+-+", "+-+-+-+-+-+-+-+-+-+-+-+-+");
const LOGO_A = colly(
  "_/\\__/\\__ ___ AAA ___ __/\\__/\\_ _/\\_",
  "|  ||  | /   \\ |  | /   \\ |  ||  | | |",
  "|__||__| \\___/ |__| \\___/ |__||__| |_|",
  "|  ||  | /   \\ |  | /   \\ |  ||  | | |",
  "|__||__| \\___/ |__| \\___/ |__||__| |_|",
);
const LOGO_B = colly(
  "/\\__/\\_ ___ BBB ___ _/\\__/\\__ ___ /\\",
  "|  ||  |/   \\|  |/   \\|  ||  | /   \\||",
  "|__||__|\\___/|__|\\___/|__||__| \\___/|_",
  "|  ||  |/   \\|  |/   \\|  ||  | /   \\||",
  "|__||__|\\___/|__|\\___/|__||__| \\___/|_",
);
const WITH_DIVIDERS = colly(DIVIDER, "", LOGO_A, "", DIVIDER, "", LOGO_B, "", DIVIDER, "");

// A divider frame repeated between logos, GLUED to each following logo with no
// blank line (the hos-afro case). The frame shape recurs across islands; the
// interior name text varies. Autoplay must scroll past the divider to each
// logo, so the divider rows must not appear in any section.
const DIVIDER_TOP = (name: string) => `+-+-+ ${name} +-+-+`; // names same length -> same shape
const DIVIDER_BOT = "+------------------+";
const GLUED_DIVIDERS = colly(
  DIVIDER_TOP("LOGOONE1"),
  DIVIDER_BOT,
  "/\\/\\/\\ ___ /\\/\\/\\ ___ /\\",
  "|  |  | /   \\ |  |  | /   \\|",
  "|__|__| \\___/ |__|__| \\___/|",
  "",
  DIVIDER_TOP("LOGOTWO2"),
  DIVIDER_BOT,
  "_____ /\\ _____ /\\ _____ /\\__",
  "|   |/  \\|   |/  \\|   |/   \\",
  "|___|\\__/|___|\\__/|___|\\___/",
  "",
  DIVIDER_TOP("LOGOTRE3"),
  DIVIDER_BOT,
  "  __/\\__  __/\\__  __/\\__  _",
  " /      \\/      \\/      \\/ ",
  " \\______/\\______/\\______/\\ ",
  "",
);

describe("detectLogoSections", () => {
  it("scrolls past a repeated divider glued to each logo (no pause on dividers)", () => {
    const secs = detectLogoSections(GLUED_DIVIDERS);
    expect(secs).toHaveLength(3); // the three logos, not the dividers
    expect(secs.map((s) => s.startLine)).toEqual([2, 8, 14]); // each starts at its logo art
    expect(secs.every((s) => s.lineCount === 3)).toBe(true); // divider rows excluded
  });

  it("merges a logo split by a single internal blank line into one section", () => {
    const secs = detectLogoSections(SPLIT_LOGO);
    expect(secs).toHaveLength(1);
    expect(secs[0].startLine).toBe(1);
    expect(secs[0].endLine).toBe(7);
    // Ink box spans the whole art, across the internal gap.
    expect(secs[0].inkTop).toBe(1);
    expect(secs[0].inkBottom).toBe(7);
  });

  it("keeps two distinct logos separate when columns do not overlap", () => {
    const secs = detectLogoSections(TWO_LOGOS);
    expect(secs).toHaveLength(2);
  });

  it("excludes a short narrow caption after a logo (fails the width/height gate)", () => {
    const secs = detectLogoSections(ART_WITH_CAPTION);
    expect(secs).toHaveLength(1);
    expect(secs[0].startLine).toBe(1);
    expect(secs[0].endLine).toBe(5); // the caption line (7) is not part of any section
  });

  it("includes a small (sub-5-line) full-width logo", () => {
    const secs = detectLogoSections(SMALL_LOGO);
    expect(secs).toHaveLength(1);
    expect(secs[0].lineCount).toBe(3);
  });

  it("filters out repeating divider frames", () => {
    const secs = detectLogoSections(WITH_DIVIDERS);
    expect(secs).toHaveLength(2); // only LOGO_A and LOGO_B survive
  });

  it("does not crash and yields consistent bounds on a real colly", () => {
    const txt = readFileSync(join(__dirname, "fixtures", "colly-spn-russ.txt"), "latin1");
    const secs = detectLogoSections(txt);
    expect(secs.length).toBeGreaterThan(0);
    let prevEnd = -1;
    for (const s of secs) {
      expect(s.startLine).toBeLessThanOrEqual(s.endLine);
      expect(s.lineCount).toBe(s.endLine - s.startLine + 1);
      expect(s.inkTop).toBeGreaterThanOrEqual(s.startLine);
      expect(s.inkBottom).toBeLessThanOrEqual(s.endLine);
      expect(s.inkTop).toBeLessThanOrEqual(s.inkBottom);
      expect(s.startLine).toBeGreaterThan(prevEnd); // ordered, non-overlapping
      prevEnd = s.endLine;
    }
  });
});

describe("pingPongNext", () => {
  it("advances forward in the middle", () => {
    expect(pingPongNext(2, 1, 5)).toEqual({ index: 3, dir: 1 });
  });

  it("reverses at the last logo (forward -> backward)", () => {
    expect(pingPongNext(4, 1, 5)).toEqual({ index: 3, dir: -1 });
  });

  it("reverses at the first logo (backward -> forward)", () => {
    expect(pingPongNext(0, -1, 5)).toEqual({ index: 1, dir: 1 });
  });

  it("loops forever (a full there-and-back cycle never stops)", () => {
    let i = 0, dir = 1;
    const seen: number[] = [];
    for (let s = 0; s < 8; s++) { const r = pingPongNext(i, dir, 3); i = r.index; dir = r.dir; seen.push(i); }
    // 0 ->1->2->1->0->1->2->1->0  (bounces between 0 and 2 indefinitely)
    expect(seen).toEqual([1, 2, 1, 0, 1, 2, 1, 0]);
  });

  it("stays put for a single-logo colly", () => {
    expect(pingPongNext(0, 1, 1)).toEqual({ index: 0, dir: 1 });
  });
});

describe("computeScrollTarget", () => {
  const opts = { spacers: 4, lineHeight: 16, viewH: 800, maxScroll: 10000 };

  it("places the ink-box centre at the viewport centre for a mid-document logo", () => {
    const target = computeScrollTarget({ inkTop: 50, inkBottom: 60 }, opts);
    const boxCentrePx = (opts.spacers + 50) * 16 + ((60 - 50 + 1) * 16) / 2;
    expect(target + opts.viewH / 2).toBe(boxCentrePx);
    expect(target).toBe(552);
  });

  it("clamps to 0 for a logo near the top", () => {
    expect(computeScrollTarget({ inkTop: 0, inkBottom: 3 }, opts)).toBe(0);
  });

  it("clamps to maxScroll for a logo past the bottom", () => {
    expect(computeScrollTarget({ inkTop: 5000, inkBottom: 5010 }, opts)).toBe(10000);
  });

  it("offsets by the pre's origin so logos don't land low (fullscreen offset bug)", () => {
    const base = computeScrollTarget({ inkTop: 50, inkBottom: 60 }, opts);
    const shifted = computeScrollTarget({ inkTop: 50, inkBottom: 60 }, { ...opts, originTop: 426 });
    expect(shifted).toBe(base + 426); // the pre's document offset is added to the target
    // ink-box centre still lands at the viewport centre, now measured from origin
    const boxCentrePx = 426 + (opts.spacers + 50) * 16 + ((60 - 50 + 1) * 16) / 2;
    expect(shifted + opts.viewH / 2).toBe(boxCentrePx);
  });
});
