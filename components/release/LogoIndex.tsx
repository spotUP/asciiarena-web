"use client";

import { cleanLabel } from "@/lib/handleMatch";
import type { LogoSection } from "@/lib/logoSections";

// The clickable logo index shown ABOVE a hand-tagged colly.
//
// Only human-tagged collys get this. Their captions were written by a person,
// so the list is worth putting in the most prominent spot on the page.
// Auto-detected labels are guesses -- frequently wrong or unnamed -- and stay
// behind the existing Index button, out of the way.

export interface LogoIndexEntry {
  label: string;
  section: LogoSection;
}

export interface LogoIndexProps {
  entries: LogoIndexEntry[];
  /** Scroll the viewer to a logo. */
  onJump: (section: LogoSection) => void;
  /** The logo autoplay is currently showing, highlighted in the list. */
  currentSection?: LogoSection | null;
}

export default function LogoIndex({ entries, onJump, currentSection }: LogoIndexProps) {
  if (!entries.length) return null;

  return (
    <div className="container-fluid m-0 p-0 amb-1">
      <div className="header w-100 col-12">
        <h2 className="ap-1 am-0 bg-header">LOGOS iN THiS COLLY ({entries.length})</h2>
      </div>
      {/* Wrapping columns: a 12-logo colly stays one short block and a 90-logo
          pack a few rows, so the art is never pushed off the screen. The column
          width is a multiple of the 8px cell. */}
      <div
        className="bg-secondary ap-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          columnGap: "16px",
          rowGap: "0px",
        }}
      >
        {entries.map((entry, n) => {
          const current = !!currentSection && currentSection === entry.section;
          const name = cleanLabel(entry.label) || `Logo ${n + 1}`;
          return (
            <button
              key={`${entry.section.startLine}-${n}`}
              type="button"
              onClick={() => onJump(entry.section)}
              title={entry.label}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "baseline",
                background: current ? "#222" : "transparent",
                border: "none",
                padding: "0 8px",
                height: "16px",
                lineHeight: "16px",
                fontFamily: "inherit",
                fontSize: "16px",
                color: current ? "#ff55ff" : "#aaaaaa",
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
              }}
            >
              <span style={{ color: "#555555", flexShrink: 0 }}>{n + 1}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
