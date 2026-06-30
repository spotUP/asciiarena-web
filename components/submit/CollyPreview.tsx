"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ANSI_FONT_MAP } from "@/lib/ansilove";
import AnsiLogo from "@/components/ui/AnsiLogo";

export interface PreviewReport {
  type: string;
  encoding: string;
  lineCount: number;
  tagged: boolean;
  text: string;
  meta: { title?: string; author?: string; crew?: string; font?: string; fg?: string; bg?: string; soundtrack?: string; logos?: { line: number; caption: string }[] };
  logos: { line: number; name: string; resolved: string | null; searchable: boolean }[];
  index: { num: number; name: string }[];
  warnings: string[];
}

// The editable live preview shared by the submit flow: rendered art (canvas for
// ANSI/CP437, <pre> for ASCII), a clickable line gutter to map logos, the parse
// report + warnings, and a legend. Controlled by the parent.
export default function CollyPreview({
  fileBytes, report, type, font, fg, bg, logoMap, setLogoMap,
}: {
  fileBytes: Uint8Array | null;
  report: PreviewReport;
  type: string;
  font: string;
  fg: string;
  bg: string;
  logoMap: { line: number; caption: string }[];
  setLogoMap: (m: { line: number; caption: string }[]) => void;
}) {
  const isCanvas = type === "ANSI" || type === "CP437";
  // eslint-disable-next-line no-control-regex
  const lines = useMemo(() => report.text.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").split("\n"), [report.text]);
  const mapped = useMemo(() => new Set(logoMap.map((l) => l.line)), [logoMap]);

  const visibleB64 = useMemo(() => {
    if (!fileBytes || !isCanvas) return null;
    const sub = fileBytes.indexOf(0x1a);
    const v = sub === -1 ? fileBytes : fileBytes.subarray(0, sub);
    let s = ""; for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
    return btoa(s);
  }, [fileBytes, isCanvas]);

  const toggle = (n: number) => setLogoMap(mapped.has(n) ? logoMap.filter((l) => l.line !== n) : [...logoMap, { line: n, caption: "" }].sort((a, b) => a.line - b.line));

  // For the canvas preview, measure the rendered art's row height so the clickable
  // line-number gutter aligns to the canvas rows (one merged view).
  const stageRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState(16);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !isCanvas) return;
    const measure = () => {
      const img = el.querySelector("img");
      const h = img?.clientHeight ?? 0;
      if (h > 0 && lines.length) setRowH(h / lines.length);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [isCanvas, lines.length, visibleB64]);

  // Clickable line-number gutter, sized to `rh` px per row.
  const gutter = (rh: number) => lines.map((_, i) => {
    const n = i + 1; const on = mapped.has(n);
    return (
      <div key={i} onClick={() => toggle(n)} title="mark/unmark a logo at this line"
        style={{ height: `${rh}px`, lineHeight: `${rh}px`, textAlign: "right", paddingRight: "6px", cursor: "pointer", fontFamily: "monospace", fontSize: "11px", color: on ? "#ff55ff" : "#888", background: on ? "rgba(255,85,255,0.18)" : "rgba(0,0,0,0.45)", userSelect: "none" }}>{n}</div>
    );
  });

  return (
    <div className="row amt-1">
      <div className="col-lg-7 amb-1">
        <div className="header bg-header ap-1">PREVIEW{isCanvas ? ` (${type})` : ""} &mdash; click a line number to mark a logo</div>
        {isCanvas && visibleB64 ? (
          <div style={{ background: type === "CP437" ? (bg || "#000") : "#000", overflow: "auto", maxHeight: "70vh" }}>
            <div ref={stageRef} style={{ position: "relative", display: "inline-block", minWidth: "100%" }}>
              <div style={{ paddingLeft: "40px" }}>
                <AnsiLogo ansiB64={visibleB64} font={ANSI_FONT_MAP[font] ?? null} maxHeight={100000} />
              </div>
              <div style={{ position: "absolute", top: 0, left: 0, width: "40px" }}>{gutter(rowH)}</div>
            </div>
          </div>
        ) : (
          <div style={{ background: bg || "#111111", overflow: "auto", maxHeight: "70vh", padding: "8px 0" }}>
            <pre style={{ margin: 0, fontFamily: `${font || "TopazPlus_a1200"}, monospace`, fontSize: "16px", lineHeight: "16px", color: fg || "#ff55ff", whiteSpace: "pre" }}>
              {lines.map((ln, i) => {
                const n = i + 1; const on = mapped.has(n);
                return (
                  <div key={i} style={{ display: "flex" }}>
                    <span onClick={() => toggle(n)} title="mark/unmark a logo at this line"
                      style={{ width: "48px", flexShrink: 0, textAlign: "right", paddingRight: "8px", cursor: "pointer", color: on ? "#ff55ff" : "#555", background: on ? "#332033" : "transparent", userSelect: "none" }}>{n}</span>
                    <span>{ln || " "}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        )}
      </div>

      <div className="col-lg-5">
        <div className="header bg-header ap-1">WHAT WE READ</div>
        <div className="bg-secondary ap-1 amb-1">
          <div className="lightgrey">Type: <span className="white">{report.type}</span> &middot; {report.lineCount} lines &middot; {report.tagged ? <span className="green">tag-mapped</span> : "auto-detected"}</div>
          {report.warnings.map((w, i) => <div key={i} className="yellow" style={{ marginTop: "4px" }}>! {w}</div>)}
          <div className="white" style={{ marginTop: "8px" }}>Logos ({report.logos.length})</div>
          {report.logos.map((l, i) => (
            <div key={i} className="lightgrey" style={{ fontSize: "13px" }}>
              <span style={{ color: "#555" }}>L{l.line}</span> {l.name}
              {l.resolved && <span className="green"> [{l.resolved}]</span>}
              {!l.searchable && <span className="yellow"> (not searchable)</span>}
            </div>
          ))}
          {report.index.length > 0 && (
            <><div className="white" style={{ marginTop: "8px" }}>Clickable index</div>
              <div className="lightgrey" style={{ fontSize: "13px" }}>{report.index.map((e) => `${e.num}. ${e.name}`).join("  ")}</div></>
          )}
        </div>
        <div className="header bg-header ap-1">HOW IT WORKS</div>
        <div className="bg-secondary ap-1" style={{ fontSize: "13px" }}>
          <p className="lightgrey">No rules &mdash; draw your colly however you like.</p>
          <p className="lightgrey"><span className="cyan">Let us detect it</span>: we auto-find logos, <span className="white">for</span>-dedications and <span className="white">o1&gt;</span> indexes.</p>
          <p className="lightgrey"><span className="cyan">Or point at it</span>: click line numbers to map each logo exactly.</p>
          <p className="lightgrey"><span className="cyan">Make it yours</span>: font / colours / soundtrack above &mdash; saved invisibly with the colly.</p>
        </div>
      </div>
    </div>
  );
}
