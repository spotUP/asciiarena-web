import React from "react";
import { colorOf, dimColorOf } from "@/lib/polls/palette";

// ANSI-style horizontal bar built from background-coloured cells. No Unicode
// block characters — every char is plain ASCII (Topaz-safe). Each cell is
// the canonical 8×16 grid unit.
//
//   style="solid"    - whole-cell precision. Bar = round(pct * width) full cells.
//   style="tail"     - solid portion + 1 fractional tail cell whose ASCII char
//                      hints at 0/25/50/75% within that cell. (Default.)
//   style="dual_row" - two-row layout: bar on top, label/value beneath. Caller
//                      should pass the label/value via children.

const CELL = 8; // px

export type BarStyle = "solid" | "tail" | "dual_row" | "stretch";

interface BarProps {
  pct: number;                // 0..1
  colorIdx: number;           // 0..15 ANSI palette
  widthCells?: number;        // bar width in 8px cells (default 32 → 256px)
  style?: BarStyle;
  emptyChar?: string;         // char drawn on empty cells (default ".")
}

function tailChar(frac: number): string {
  // frac in [0,1). Topaz-safe progression.
  if (frac < 0.125) return ".";
  if (frac < 0.375) return ":";
  if (frac < 0.625) return "-";
  if (frac < 0.875) return "=";
  return " ";
}

export default function AnsiBar({
  pct,
  colorIdx,
  widthCells = 32,
  style = "tail",
  emptyChar = ".",
}: BarProps) {
  const clamped = Math.max(0, Math.min(1, pct));
  // Stretch variant: percentage-based, fills the parent's available width.
  // Bar = a row of colons in the option's colour; empty portion = faint dots
  // on the same dark backdrop. Each row of 200 chars × 8px = 1600px, wider
  // than any column we render in, so overflow:hidden trims to the actual
  // container width.
  if (style === "stretch") {
    const fill = "/".repeat(200);
    const blank = ".".repeat(200);
    return (
      <span
        style={{
          display: "flex",
          width: "100%",
          height: "16px",
          lineHeight: "16px",
          fontFamily: "TopazPlus_a1200, monospace",
          fontSize: "16px",
          backgroundColor: "transparent",
          whiteSpace: "pre",
        }}
        aria-hidden
      >
        <span
          style={{
            width: `${clamped * 100}%`,
            overflow: "hidden",
            color: colorOf(colorIdx),
          }}
        >{fill}</span>
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            color: "#333",
          }}
        >{blank}</span>
      </span>
    );
  }
  const exact = clamped * widthCells;
  const solidCells = style === "solid" ? Math.round(exact) : Math.floor(exact);
  const frac = exact - solidCells;
  const showTail = style === "tail" && solidCells < widthCells && frac > 0;
  const emptyCells = widthCells - solidCells - (showTail ? 1 : 0);
  const color = colorOf(colorIdx);
  const dim = dimColorOf(colorIdx);

  return (
    <span
      className="ansi-bar"
      style={{
        display: "inline-block",
        height: "16px",
        lineHeight: "16px",
        whiteSpace: "pre",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
        letterSpacing: 0,
      }}
      aria-hidden
    >
      {solidCells > 0 && (
        <span
          style={{
            display: "inline-block",
            backgroundColor: color,
            color,
            width: `${solidCells * CELL}px`,
            height: "16px",
          }}
        >{" ".repeat(solidCells)}</span>
      )}
      {showTail && (
        <span
          style={{
            display: "inline-block",
            backgroundColor: dim,
            color,
            width: `${CELL}px`,
            height: "16px",
            textAlign: "center",
          }}
        >{tailChar(frac)}</span>
      )}
      {emptyCells > 0 && (
        <span
          style={{
            display: "inline-block",
            color: "#5e5d5e",
            backgroundColor: "#1a1a1a",
            width: `${emptyCells * CELL}px`,
            height: "16px",
            textAlign: "center",
          }}
        >{emptyChar.repeat(emptyCells)}</span>
      )}
    </span>
  );
}

// Stacked bar variant for the approval matrix: each segment is a bg-colored
// run of cells, all stitched together so the row reads as a 100% bar split
// across stances. Caller passes per-segment counts; we normalise.
export function AnsiStackedBar({
  segments,
  colorIdx,
  widthCells = 32,
  stretch = false,
  stanceColors,
}: {
  segments: number[];
  colorIdx: number;
  widthCells?: number;
  stretch?: boolean;
  stanceColors?: number[]; // optional per-stance palette indices
}) {
  const total = segments.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <AnsiBar pct={0} colorIdx={colorIdx} widthCells={widthCells} style={stretch ? "stretch" : "solid"} />;
  }

  if (stretch) {
    const fallback = [10, 11, 9, 1];
    const fill = "/".repeat(200);
    return (
      <span
        style={{
          display: "flex", width: "100%", height: "16px", lineHeight: "16px",
          fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px",
          backgroundColor: "transparent", whiteSpace: "pre",
        }}
        aria-hidden
      >
        {segments.map((s, i) => (
          s > 0 ? (
            <span
              key={i}
              style={{
                width: `${(s / total) * 100}%`,
                overflow: "hidden",
                color: colorOf(stanceColors?.[i] ?? fallback[i] ?? colorIdx),
              }}
            >{fill}</span>
          ) : null
        ))}
      </span>
    );
  }
  // Allocate integer cells per segment, distributing rounding remainder so
  // the bar fills exactly `widthCells`.
  const raw = segments.map(s => (s / total) * widthCells);
  const cells = raw.map(Math.floor);
  let used = cells.reduce((a, b) => a + b, 0);
  const remainders = raw.map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r);
  for (let k = 0; used < widthCells && k < remainders.length; k++) {
    cells[remainders[k].i]++;
    used++;
  }

  const fallbackPalette = [10, 11, 9, 1]; // green / yellow / orange-ish / red — for the default 4-stance ordering
  return (
    <span
      style={{
        display: "inline-block",
        height: "16px",
        lineHeight: "16px",
        whiteSpace: "pre",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "16px",
      }}
      aria-hidden
    >
      {cells.map((c, i) => {
        if (c === 0) return null;
        const segIdx = stanceColors?.[i] ?? fallbackPalette[i] ?? colorIdx;
        const bg = colorOf(segIdx);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              backgroundColor: bg,
              color: bg,
              width: `${c * CELL}px`,
              height: "16px",
            }}
          >{" ".repeat(c)}</span>
        );
      })}
    </span>
  );
}
