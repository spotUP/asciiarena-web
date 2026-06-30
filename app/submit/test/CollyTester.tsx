"use client";

import { useMemo, useRef, useState } from "react";
import { FONTS, ANSI_FONT_MAP } from "@/lib/ansilove";
import { COLLY_TYPES } from "@/lib/collyType";
import DosSelect from "@/components/ui/DosSelect";
import ColorSwatch from "@/components/ui/ColorSwatch";
import AnsiLogo from "@/components/ui/AnsiLogo";
import SoundtrackPicker from "@/components/music/SoundtrackPicker";

interface LogoReport { line: number; name: string; resolved: string | null; searchable: boolean }
interface Report {
  type: string; encoding: string; lineCount: number; tagged: boolean; text: string;
  meta: { title?: string; author?: string; crew?: string; font?: string; fg?: string; bg?: string; soundtrack?: string; logos?: { line: number; caption: string }[] };
  logos: LogoReport[];
  index: { num: number; name: string }[];
  warnings: string[];
}

const SUB = "\x1a";

export default function CollyTester() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable settings (seeded from the file's trailer when analyzed).
  const [font, setFont] = useState("");
  const [fg, setFg] = useState("");
  const [bg, setBg] = useState("");
  const [soundtrack, setSoundtrack] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("ASCII"); // detected, overridable
  const [logoMap, setLogoMap] = useState<{ line: number; caption: string }[]>([]);

  const analyze = async (file: File) => {
    setLoading(true);
    const buf = new Uint8Array(await file.arrayBuffer());
    setFileBytes(buf);
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/collys/preview", { method: "POST", body: fd });
      const data = (await r.json()) as Report;
      setReport(data);
      setType(data.type);
      setFont(data.meta.font ?? "");
      setFg(data.meta.fg ?? "");
      setBg(data.meta.bg ?? "");
      setSoundtrack(data.meta.soundtrack ?? "");
      setTitle(data.meta.title ?? "");
      setAuthor(data.meta.author ?? "");
      setLogoMap(data.meta.logos ?? []);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const isCanvas = type === "ANSI" || type === "CP437";
  // Mapping panel shows ESC-code-stripped lines so ANSI is readable.
  // eslint-disable-next-line no-control-regex
  const lines = useMemo(() => (report ? report.text.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").split("\n") : []), [report]);
  const mappedLines = useMemo(() => new Set(logoMap.map((l) => l.line)), [logoMap]);
  // Base64 of the visible art bytes (trailer stripped) for the AnsiLove canvas.
  const visibleB64 = useMemo(() => {
    if (!fileBytes || !isCanvas) return null;
    const sub = fileBytes.indexOf(0x1a);
    const v = sub === -1 ? fileBytes : fileBytes.subarray(0, sub);
    let s = "";
    for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
    return btoa(s);
  }, [fileBytes, isCanvas]);

  const toggleLogo = (lineNum: number) => {
    setLogoMap((prev) => prev.some((l) => l.line === lineNum)
      ? prev.filter((l) => l.line !== lineNum)
      : [...prev, { line: lineNum, caption: "" }].sort((a, b) => a.line - b.line));
  };
  const setCaption = (lineNum: number, caption: string) =>
    setLogoMap((prev) => prev.map((l) => (l.line === lineNum ? { ...l, caption } : l)));

  const seedFromDetected = () => {
    if (!report) return;
    setLogoMap(report.logos.map((l) => ({ line: l.line, caption: l.name })).sort((a, b) => a.line - b.line));
  };

  const download = () => {
    if (!fileBytes) return;
    // Visible art = bytes up to any existing Ctrl-Z trailer.
    const sub = fileBytes.indexOf(0x1a);
    const visible = sub === -1 ? fileBytes : fileBytes.subarray(0, sub);
    const tags: string[] = [];
    if (title) tags.push(`title: ${title}`);
    if (author) tags.push(`author: ${author}`);
    if (font) tags.push(`font: ${font}`);
    if (fg) tags.push(`fg: ${fg}`);
    if (bg) tags.push(`bg: ${bg}`);
    if (soundtrack) tags.push(`soundtrack: ${soundtrack}`);
    for (const lg of [...logoMap].sort((a, b) => a.line - b.line)) {
      if (lg.caption.trim()) tags.push(`logo: ${lg.line} ${lg.caption.trim()}`);
    }
    const trailer = SUB + tags.join("\n") + "\n";
    const trailerBytes = new Uint8Array([...trailer].map((c) => c.charCodeAt(0) & 0xff));
    const out = new Uint8Array(visible.length + trailerBytes.length);
    out.set(visible, 0); out.set(trailerBytes, visible.length);
    const url = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = fileName || "colly.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid apb-1">
      <div className="row apt-1"><div className="col-lg-12"><h2 className="ap-1 bg-header">cOLLY tESTER &mdash; dry run</h2></div></div>

      <div className="bg-secondary ap-1 amb-1">
        <p className="lightgrey" style={{ marginBottom: "8px" }}>
          Drop your colly here to see exactly how asciiarena will read it &mdash; detected
          logos, requesters, the clickable index, colours and soundtrack &mdash; before you
          publish. Nothing is uploaded. Style your art however you like; tags only guide us.
        </p>
        <input ref={fileRef} type="file" className="lightgrey" accept=".txt,.asc,.ans,.nfo,.diz"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void analyze(f); }} />
        {loading && <span className="cyan" style={{ marginLeft: "8px" }}>analyzing...</span>}
      </div>

      {report && (
        <div className="row">
          {/* Left: live preview with clickable line numbers */}
          <div className="col-lg-7 amb-1">
            {isCanvas && visibleB64 && (
              <>
                <div className="header bg-header ap-1">RENDERED ({type})</div>
                <div style={{ background: type === "CP437" ? (bg || "#000") : "#000", overflow: "auto", maxHeight: "60vh", marginBottom: "8px" }}>
                  <AnsiLogo ansiB64={visibleB64} font={ANSI_FONT_MAP[font] ?? null} maxHeight={100000} />
                </div>
              </>
            )}
            <div className="header bg-header ap-1">
              {isCanvas ? "MAP LOGOS" : "PREVIEW"} &mdash; click a line number to mark a logo
            </div>
            <div style={{ background: isCanvas ? "#111111" : (bg || "#111111"), overflow: "auto", maxHeight: "70vh", padding: "8px 0" }}>
              <pre style={{ margin: 0, fontFamily: `${font || "TopazPlus_a1200"}, monospace`, fontSize: "16px", lineHeight: "16px", color: fg || "#ff55ff", whiteSpace: "pre" }}>
                {lines.map((ln, i) => {
                  const n = i + 1;
                  const marked = mappedLines.has(n);
                  return (
                    <div key={i} style={{ display: "flex" }}>
                      <span
                        onClick={() => toggleLogo(n)}
                        style={{ width: "48px", flexShrink: 0, textAlign: "right", paddingRight: "8px", cursor: "pointer", color: marked ? "#ff55ff" : "#555", background: marked ? "#332033" : "transparent", userSelect: "none" }}
                        title="mark/unmark a logo at this line"
                      >{n}</span>
                      <span>{ln || " "}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>

          {/* Right: settings + report + legend */}
          <div className="col-lg-5">
            <div className="header bg-header ap-1">SETTINGS</div>
            <div className="bg-secondary ap-1 amb-1" style={{ display: "grid", gap: "8px" }}>
              <div className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>Type
                <DosSelect padded width={140} value={type} options={COLLY_TYPES.map((t) => ({ value: t, label: t }))} onChange={setType} />
                <span style={{ color: "#555", fontSize: "12px" }}>(auto-detected)</span></div>
              <label className="lightgrey">Title <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="lightgrey">Author <input className="form-control" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
              <div className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>Font
                <DosSelect padded width={200} value={font} options={[{ value: "", label: "Default / viewer" }, ...FONTS]} onChange={setFont} /></div>
              <div className="lightgrey" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>text <ColorSwatch current={fg || "#ff55ff"} onChange={setFg} /></span>
                <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>bg <ColorSwatch current={bg || "#111111"} onChange={setBg} /></span>
              </div>
              <div className="lightgrey">Soundtrack<div style={{ marginTop: "4px" }}><SoundtrackPicker value={soundtrack} onChange={setSoundtrack} /></div></div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input type="button" className="btn-big" value="Seed logo map from detected" onClick={seedFromDetected} />
                <input type="button" className="btn-big bg-green white" value="Download tagged colly" onClick={download} />
              </div>
            </div>

            <div className="header bg-header ap-1">WHAT WE READ</div>
            <div className="bg-secondary ap-1 amb-1">
              <div className="lightgrey">Type: <span className="white">{report.type}</span> &middot; {report.lineCount} lines &middot; {report.tagged ? <span className="green">tag-mapped logos</span> : "auto-detected logos"}</div>
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
              <p className="lightgrey">No rules &mdash; draw your colly however you like. Two ways to get great parsing:</p>
              <p className="lightgrey"><span className="cyan">Let us detect it</span>: we auto-find logos, <span className="white">for</span>-dedications and classic <span className="white">o1&gt;</span> indexes in common styles. Most collys just work.</p>
              <p className="lightgrey"><span className="cyan">Or point at it</span>: click the line numbers to map each logo exactly &mdash; works for any layout, no format required.</p>
              <p className="lightgrey"><span className="cyan">Make it yours</span>: set a font, colours and a soundtrack above. &quot;Download tagged colly&quot; saves them invisibly inside the file (after a Ctrl-Z) &mdash; never shown in your art.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
