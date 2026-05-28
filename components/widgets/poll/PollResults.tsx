import React from "react";
import type { PollResults as Results, PollResultLayout } from "@/lib/polls/types";
import { resolveConfig } from "@/lib/polls/types";
import AnsiBar, { AnsiStackedBar } from "./AnsiBar";

interface Props {
  results: Results;
  layout?: PollResultLayout;
  widthCells?: number;
  approvalStances?: string[];
}

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  height: "16px",
  lineHeight: "16px",
  marginBottom: "0",
  fontFamily: "TopazPlus_a1200, monospace",
  fontSize: "16px",
};

const LABEL: React.CSSProperties = {
  width: "200px",
  flex: "0 0 200px",
  height: "16px",
  lineHeight: "16px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const BAR_CELL: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  height: "16px",
};

const VAL: React.CSSProperties = {
  flex: "0 0 96px",
  height: "16px",
  lineHeight: "16px",
  whiteSpace: "nowrap",
};

// Stance accent palette: light green / yellow / light red / red — pure ANSI,
// matches the fallback in AnsiStackedBar so the legend swatches read correctly.
const STANCE_BG = ["#55ff55", "#ffff55", "#ff5555", "#aa0000"];

export default function PollResults({ results, layout = "tail", widthCells = 32, approvalStances }: Props) {
  if (results.rows.length === 0) {
    return <div className="lightgrey" style={{ padding: "8px 0", fontFamily: "TopazPlus_a1200, monospace" }}>
      No options yet.
    </div>;
  }

  if (results.type === "approval") {
    return (
      <div>
        {results.rows.map(row => (
          <div key={row.option_id} style={ROW}>
            <span className="magenta" style={LABEL}>{row.label}</span>
            <span style={BAR_CELL}>
              <AnsiStackedBar segments={row.stances ?? []} colorIdx={row.color_idx} widthCells={widthCells} stretch />
            </span>
            <span className="lightcyan" style={VAL}>{row.display}</span>
          </div>
        ))}
        {approvalStances && (
          <div className="lightgrey" style={{ marginTop: "16px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
            <span className="yellow">legend: </span>
            {approvalStances.map((s, i) => (
              <span key={s} style={{ marginRight: "16px" }}>
                <span style={{
                  display: "inline-block", width: "16px", height: "16px",
                  backgroundColor: STANCE_BG[i] ?? "#888",
                  verticalAlign: "top", marginRight: "8px",
                }} />
                {s}
              </span>
            ))}
          </div>
        )}
        <Footer voters={results.total_voters} />
      </div>
    );
  }

  // For the sidebar variant the caller asks for layout="solid" with a small
  // widthCells; preserve cell-precise rendering there. Everything else uses
  // the flex-stretch bar that fills the row.
  const useStretch = layout !== "solid";
  return (
    <div>
      {results.rows.map(row => (
        <div key={row.option_id} style={ROW}>
          <span className="magenta" style={LABEL}>{row.label}</span>
          <span style={BAR_CELL}>
            {useStretch
              ? <AnsiBar pct={row.pct} colorIdx={row.color_idx} style="stretch" />
              : <AnsiBar pct={row.pct} colorIdx={row.color_idx} widthCells={widthCells} style="solid" />}
          </span>
          <span className="lightcyan" style={VAL}>{row.display}</span>
        </div>
      ))}
      <Footer voters={results.total_voters} />
    </div>
  );
}

function Footer({ voters }: { voters: number }) {
  return (
    <div className="lightgrey" style={{ marginTop: "8px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
      <span className="yellow">total:</span> {voters} {voters === 1 ? "voter" : "voters"}
    </div>
  );
}

export function pickStanceLabels(approval_stances: string[] | undefined): string[] {
  return approval_stances && approval_stances.length > 0
    ? approval_stances
    : resolveConfig({ type: "approval", config: null }).approval_stances;
}
