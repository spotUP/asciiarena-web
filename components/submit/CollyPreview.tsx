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
  meta: { title?: string; author?: string; crew?: string; font?: string; fg?: string; bg?: string; soundtrack?: string; logos?: { line: number; end?: number; caption: string }[] };
  logos: { line: number; end: number; name: string; resolved: string | null; searchable: boolean }[];
  index: { num: number; name: string }[];
  warnings: string[];
}

// `auto` = a kept asciiarena suggestion (shown in a different colour); cleared
// once the artist edits/replaces it.
export type LogoEntry = { line: number; end?: number; caption: string; auto?: boolean };

// caption <-> {name, by, for}: "NAME -AUTHOR for REQUESTER" (reuses the existing
// caption grammar: subject before "for", author as a trailing -signature).
function compose(name: string, by: string, forr: string): string {
  let c = name.trim();
  if (by.trim()) c += ` -${by.trim()}`;
  if (forr.trim()) c += ` for ${forr.trim()}`;
  return c;
}
function decompose(caption: string): { name: string; by: string; for: string } {
  const f = caption.split(/ for /i);
  const forr = f.length > 1 ? f.slice(1).join(" for ").trim() : "";
  const b = f[0].split(/ -/);
  return { name: b[0].trim(), by: b.length > 1 ? b.slice(1).join(" -").trim() : "", for: forr };
}

export default function CollyPreview({
  fileBytes, report, type, font, fg, bg, logoMap, setLogoMap, defaultAuthor = "",
}: {
  fileBytes: Uint8Array | null;
  report: PreviewReport;
  type: string;
  font: string;
  fg: string;
  bg: string;
  logoMap: LogoEntry[];
  setLogoMap: (m: LogoEntry[]) => void;
  defaultAuthor?: string;
}) {
  const isCanvas = type === "ANSI" || type === "CP437";
  // eslint-disable-next-line no-control-regex
  const lines = useMemo(() => report.text.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").split("\n"), [report.text]);

  const visibleB64 = useMemo(() => {
    if (!fileBytes || !isCanvas) return null;
    const sub = fileBytes.indexOf(0x1a);
    const v = sub === -1 ? fileBytes : fileBytes.subarray(0, sub);
    let s = ""; for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
    return btoa(s);
  }, [fileBytes, isCanvas]);

  // Canvas row height (measured) so the gutter + selection align to art rows.
  const stageRef = useRef<HTMLDivElement>(null);
  const [canvasRowH, setCanvasRowH] = useState(16);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !isCanvas) return;
    const measure = () => { const img = el.querySelector("img"); const h = img?.clientHeight ?? 0; if (h > 0 && lines.length) setCanvasRowH(h / lines.length); };
    const ro = new ResizeObserver(measure); ro.observe(el); measure();
    return () => ro.disconnect();
  }, [isCanvas, lines.length, visibleB64]);
  const rowH = isCanvas ? canvasRowH : 16;

  // Drag-select + edit state.
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [fName, setFName] = useState(""); const [fBy, setFBy] = useState(""); const [fFor, setFFor] = useState("");

  const close = () => { setSel(null); setEditIdx(null); };
  const openNew = (s: number, e: number) => { setSel({ start: s, end: e }); setEditIdx(null); setFName(""); setFBy(defaultAuthor); setFFor(""); };
  const openEdit = (i: number) => { const en = logoMap[i]; const d = decompose(en.caption); setSel({ start: en.line, end: en.end ?? en.line }); setEditIdx(i); setFName(d.name); setFBy(d.by || defaultAuthor); setFFor(d.for); };
  const save = () => {
    if (!sel || !fName.trim()) return;
    const entry: LogoEntry = { line: sel.start, end: sel.end > sel.start ? sel.end : undefined, caption: compose(fName, fBy, fFor), auto: false };
    let next: LogoEntry[];
    if (editIdx != null) {
      next = logoMap.map((x, i) => (i === editIdx ? entry : x));
    } else {
      // New mapping replaces ONLY the entries it overlaps; the rest (other auto
      // suggestions + manual logos) stay put.
      next = [...logoMap.filter((en) => !(sel.start <= (en.end ?? en.line) && sel.end >= en.line)), entry];
    }
    setLogoMap(next.sort((a, b) => a.line - b.line));
    close();
  };
  const del = () => { if (editIdx != null) setLogoMap(logoMap.filter((_, i) => i !== editIdx)); close(); };

  // Finalize a drag on mouse-up anywhere.
  useEffect(() => {
    if (!drag) return;
    const onUp = () => {
      const s = Math.min(drag.a, drag.b), e = Math.max(drag.a, drag.b);
      if (s === e) { const i = logoMap.findIndex((en) => s >= en.line && s <= (en.end ?? en.line)); if (i >= 0) openEdit(i); else openNew(s, e); }
      else openNew(s, e);
      setDrag(null);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, logoMap, defaultAuthor]);

  const rowBg = (n: number): string | undefined => {
    if (drag && n >= Math.min(drag.a, drag.b) && n <= Math.max(drag.a, drag.b)) return "rgba(255,85,255,0.45)";
    if (sel && n >= sel.start && n <= sel.end) return "rgba(255,85,255,0.45)";
    const en = logoMap.find((e) => n >= e.line && n <= (e.end ?? e.line));
    if (en) return en.auto ? "rgba(85,255,255,0.20)" : "rgba(255,85,255,0.20)"; // auto = cyan, manual = magenta
    return undefined;
  };
  const down = (n: number) => (e: React.MouseEvent) => { e.preventDefault(); setDrag({ a: n, b: n }); };
  const enter = (n: number) => () => setDrag((d) => (d ? { a: d.a, b: n } : null));

  const panel = sel && (
    <div style={{
      position: "absolute", top: `${(sel.start - 1) * rowH}px`, right: "8px", zIndex: 20, width: "240px",
      background: "#111", border: "1px solid #ff55ff", padding: "8px", display: "grid", gap: "6px",
      fontFamily: "TopazPlus_a1200, monospace", fontSize: "13px",
    }}>
      <div className="magenta">Selected logo</div>
      <input className="form-control" placeholder="logo name" autoFocus value={fName} onChange={(e) => setFName(e.target.value)} />
      <input className="form-control" placeholder="author (who drew it)" value={fBy} onChange={(e) => setFBy(e.target.value)} />
      <input className="form-control" placeholder="for (requested by)" value={fFor} onChange={(e) => setFFor(e.target.value)} />
      <div style={{ display: "flex", gap: "6px" }}>
        <input type="button" className="btn-big bg-green white" value="Save" onClick={save} />
        <input type="button" className="btn-big" value="Cancel" onClick={close} />
        {editIdx != null && <input type="button" className="btn-big" value="Delete" onClick={del} />}
      </div>
    </div>
  );

  return (
    <div className="row amt-1">
      <div className="col-lg-7 amb-1">
        <div className="header bg-header ap-1">PREVIEW{isCanvas ? ` (${type})` : ""} &mdash; drag over a logo to map it</div>
        <div style={{ position: "relative", background: isCanvas && type !== "CP437" ? "#000" : (bg || "#111111"), overflow: "auto", maxHeight: "70vh" }}>
          {isCanvas && visibleB64 ? (
            <div ref={stageRef} style={{ position: "relative", display: "inline-block", minWidth: "100%" }}>
              <AnsiLogo ansiB64={visibleB64} font={ANSI_FONT_MAP[font] ?? null} maxHeight={100000} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                {lines.map((_, i) => (
                  <div key={i} className="colly-line" onMouseDown={down(i + 1)} onMouseEnter={enter(i + 1)}
                    style={{ height: `${rowH}px`, background: rowBg(i + 1) }} />
                ))}
              </div>
              {panel}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <pre style={{ margin: 0, fontFamily: `${font || "TopazPlus_a1200"}, monospace`, fontSize: "16px", lineHeight: "16px", color: fg || "#ff55ff", whiteSpace: "pre" }}>
                {lines.map((ln, i) => (
                  <div key={i} className="colly-line" onMouseDown={down(i + 1)} onMouseEnter={enter(i + 1)} style={{ background: rowBg(i + 1) }}>
                    {ln || " "}
                  </div>
                ))}
              </pre>
              {panel}
            </div>
          )}
        </div>
      </div>

      <div className="col-lg-5">
        <div className="header bg-header ap-1">WHAT WE READ</div>
        <div className="bg-secondary ap-1 amb-1">
          <div className="lightgrey">Type: <span className="white">{report.type}</span></div>
          <div className="lightgrey">{report.lineCount} lines</div>
          <div className="lightgrey">{logoMap.length} logos</div>
          {report.warnings.map((w, i) => <div key={i} className="yellow">{w}</div>)}
          {logoMap.map((l, i) => (
            <div key={i} className="lightgrey colly-line" onClick={() => openEdit(i)} style={{ fontSize: "13px" }}>
              <span style={{ color: l.auto ? "#55ffff" : "#ff55ff" }}>{l.auto ? "auto" : "set"}</span> {l.caption}
            </div>
          ))}
        </div>
        <div className="header bg-header ap-1">INSTRUCTIONS</div>
        <div className="bg-secondary ap-1" style={{ fontSize: "13px" }}>
          <p className="lightgrey">aSCIIaRENA maps logos automatically at best effort.</p>
          <p className="lightgrey">Override it by selecting a logo and filling the form.</p>
        </div>
      </div>
    </div>
  );
}
