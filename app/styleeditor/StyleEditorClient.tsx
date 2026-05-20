"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FontMeta { fontid: number; fontname: string; fontstatus: number }

interface FigFont {
  fontid: number;
  fontname: string;
  fontstatus: number;   // 1=private 2=public-view 3=public-edit
  hardBlank: string;
  height: number;
  baseline: number;
  maxLength: number;
  printDirection: number;
  caseInsensitive: boolean;
  horizontalLayout: HLayout;
  verticalLayout: VLayout;
  hrule: Record<number, boolean>;
  vrule: Record<number, boolean>;
  codeTagCount: number;
  figChars: Record<number, string>; // charCode → ascii art rows
}

type HLayout = "Full" | "Fitted" | "Controlled Smushing" | "Universal Smushing";
type VLayout = "Full" | "Fitted" | "Controlled Smushing" | "Universal Smushing";
type Tab = "editor" | "maker";

const LAYOUTS: HLayout[] = ["Full", "Fitted", "Controlled Smushing", "Universal Smushing"];

// chars 32–126 + German umlauts
const CHAR_ORDER: number[] = [];
for (let i = 32; i <= 126; i++) CHAR_ORDER.push(i);
CHAR_ORDER.push(196, 214, 220, 228, 246, 252, 223);

// ─── FIGfont utilities (ported from controllers.js) ────────────────────────

function emptyFont(): FigFont {
  const figChars: Record<number, string> = {};
  figChars[-1] = "Font Author: Enter your name here\n\nFIGFont created with: https://www.asciiarena.se";
  CHAR_ORDER.forEach(c => { figChars[c] = ""; });
  return {
    fontid: 0, fontname: "", fontstatus: 1,
    hardBlank: "$", height: 6, baseline: 6, maxLength: 10,
    printDirection: 0, caseInsensitive: false,
    horizontalLayout: "Fitted", verticalLayout: "Full",
    hrule: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    vrule: { 1: false, 2: false, 3: false, 4: false, 5: false },
    codeTagCount: 0, figChars,
  };
}

function layoutToNumber(l: string): number {
  if (l === "Full") return 0;
  if (l === "Fitted") return 1;
  if (l === "Universal Smushing") return 2;
  return 3; // Controlled Smushing
}

function numberToLayout(n: number): HLayout {
  if (n === 0) return "Full";
  if (n === 1) return "Fitted";
  if (n === 2) return "Universal Smushing";
  return "Controlled Smushing";
}

function spacePad(n: number): string { return " ".repeat(n); }

function fixFigChars(font: FigFont): FigFont {
  const f = { ...font, figChars: { ...font.figChars } };

  // case insensitivity: copy uppercase → lowercase
  if (f.caseInsensitive) {
    for (let i = 97; i <= 122; i++) f.figChars[i] = f.figChars[i - 32] ?? "";
  }

  let height = 0;
  const charWidth: Record<number, number> = {};

  for (const idx of Object.keys(f.figChars).map(Number)) {
    if (idx === -1) continue;
    const rows = (f.figChars[idx] ?? "").replace(/\r\n/g, "\n").split("\n");
    let fheight = -1;
    for (let ii = rows.length - 1; ii >= 0; ii--) {
      if (rows[ii].trim().length > 0) { fheight = ii; break; }
    }
    height = Math.max(height, fheight + 2);
    charWidth[idx] = 0;
    rows.forEach(r => { charWidth[idx] = Math.max(charWidth[idx], r.length); });
  }

  // Normalise widths and heights
  for (const idx of Object.keys(f.figChars).map(Number)) {
    if (idx === -1) continue;
    const rows = (f.figChars[idx] ?? "").replace(/\r\n/g, "\n").split("\n");
    const padded = rows.map(r => r + spacePad(Math.max(0, charWidth[idx] - r.length)));
    while (padded.length > height) padded.pop();
    while (padded.length < height) padded.push(spacePad(charWidth[idx] ?? 0));
    f.figChars[idx] = padded.join("\n");
  }

  f.height = height;
  f.maxLength = Math.max(0, ...Object.values(charWidth)) + 2;
  return f;
}

function getOldLayout(font: FigFont): number {
  if (font.horizontalLayout === "Full") return -1;
  if (font.horizontalLayout === "Fitted") return 0;
  if (font.horizontalLayout === "Universal Smushing") return 0;
  let v = 0;
  for (let i = 1; i <= 6; i++) v += font.hrule[i] ? (1 << (i - 1)) : 0;
  return v;
}

function getFullLayout(font: FigFont): number {
  let v = 0;
  if (font.horizontalLayout === "Fitted") v += 64;
  else if (font.horizontalLayout === "Universal Smushing") v += 128;
  else if (font.horizontalLayout === "Controlled Smushing") {
    v += 128;
    for (let i = 1; i <= 6; i++) v += font.hrule[i] ? (1 << (i - 1)) : 0;
  }
  if (font.verticalLayout === "Fitted") v += 8192;
  else if (font.verticalLayout === "Universal Smushing") v += 16384;
  else if (font.verticalLayout === "Controlled Smushing") {
    v += 16384;
    for (let i = 1; i <= 5; i++) v += font.vrule[i] ? (1 << (i + 7)) : 0;
  }
  return v;
}

function createFigFileData(fontIn: FigFont): string {
  const font = fixFigChars(fontIn);
  const commentLines = (font.figChars[-1] ?? "").replace(/\r\n/g, "\n").split("\n").length;
  const baseline = Math.max(1, Math.min(font.baseline || font.height, font.height));
  const header = [
    `flf2a${font.hardBlank}`,
    font.height, baseline, font.maxLength,
    getOldLayout(font), commentLines,
    font.printDirection, getFullLayout(font), font.codeTagCount,
  ].join(" ");

  let out = header + "\n";
  out += (font.figChars[-1] ?? "").replace(/\r\n/g, "\n") + "\n";
  for (const ch of CHAR_ORDER) {
    const rows = (font.figChars[ch] ?? "").replace(/\r\n/g, "\n").split("\n");
    out += rows.map(r => r + font.hardBlank).join("\n") + font.hardBlank + font.hardBlank + "\n";
  }
  return out;
}

function parseFigFont(name: string, data: string): FigFont {
  const font = emptyFont();
  font.fontname = name;

  const lines = data.replace(/\r\n/g, "\n").split("\n");
  const headerParts = lines[0].split(" ");
  font.hardBlank = (headerParts[0] ?? "flf2a$").slice(-1);
  font.height = parseInt(headerParts[1] ?? "6") || 6;
  font.baseline = parseInt(headerParts[2] ?? "6") || 6;
  font.maxLength = parseInt(headerParts[3] ?? "10") || 10;
  const oldLayout = parseInt(headerParts[4] ?? "0") || 0;
  const commentCount = parseInt(headerParts[5] ?? "0") || 0;
  font.printDirection = parseInt(headerParts[6] ?? "0") || 0;
  const fullLayout = parseInt(headerParts[7] ?? "0") || 0;
  font.codeTagCount = parseInt(headerParts[8] ?? "0") || 0;

  // Decode layout
  if (oldLayout === -1) { font.horizontalLayout = "Full"; }
  else if (fullLayout & 128) {
    font.horizontalLayout = "Controlled Smushing";
    for (let i = 1; i <= 6; i++) font.hrule[i] = !!(fullLayout & (1 << (i - 1)));
  } else if (fullLayout & 64) { font.horizontalLayout = "Fitted"; }
  else { font.horizontalLayout = numberToLayout(layoutToNumber("Full")); }

  if (fullLayout & 16384) {
    font.verticalLayout = "Controlled Smushing";
    for (let i = 1; i <= 5; i++) font.vrule[i] = !!(fullLayout & (1 << (i + 7)));
  } else if (fullLayout & 8192) { font.verticalLayout = "Fitted"; }
  else { font.verticalLayout = "Full"; }

  // Comment block
  const commentLines = lines.slice(1, 1 + commentCount);
  font.figChars[-1] = commentLines.join("\n");

  // Parse characters
  let lineIdx = 1 + commentCount;
  for (const ch of CHAR_ORDER) {
    if (lineIdx >= lines.length) break;
    const rows: string[] = [];
    for (let h = 0; h < font.height; h++) {
      const row = lines[lineIdx++] ?? "";
      rows.push(row.replace(/@+$/, "").replace(/\$$/, ""));
    }
    font.figChars[ch] = rows.join("\n");
  }

  return font;
}

// ─── Tooltips for smushing rules ──────────────────────────────────────────────
const H_RULE_TIPS: Record<number, string> = {
  1: "Equal Character Smushing — adjacent identical chars merge into one.",
  2: "Underscore Smushing — underscores yield to |/\\[]{}()<>.",
  3: "Hierarchy Smushing — six classes; later class wins.",
  4: "Opposite Pair Smushing — [] {} () → |.",
  5: "Big X Smushing — /\\ → | \\/ → Y >< → X.",
  6: "Hard Blank Smushing — two hard blanks merge into one.",
};
const V_RULE_TIPS: Record<number, string> = {
  1: "Equal Character Smushing.",
  2: "Underscore Smushing.",
  3: "Hierarchy Smushing.",
  4: "Horizontal Line Smushing — stacked - and _ → =.",
  5: "Vertical Line Supersmushing — stacked | chars merge.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StyleEditorClient({ userNick }: { userNick: string }) {
  const [fonts, setFonts] = useState<FontMeta[]>([]);
  const [font, setFont] = useState<FigFont>(emptyFont());
  const [selectedChar, setSelectedChar] = useState<number>(65); // 'A'
  const [tab, setTab] = useState<Tab>("editor");
  const [testText, setTestText] = useState("Hello!");
  const [testOutput, setTestOutput] = useState("");
  const [showHardBlanks, setShowHardBlanks] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState("");
  const [figletReady, setFigletReady] = useState(false);
  const figletLoadedRef = useRef(false);

  // ── API ───────────────────────────────────────────────────────────────────

  const loadFontList = useCallback(async () => {
    const r = await fetch("/api/fonts");
    if (r.ok) setFonts(await r.json() as FontMeta[]);
  }, []);

  const loadFont = useCallback(async (id: number) => {
    if (id === 0) { setFont(emptyFont()); return; }
    const r = await fetch(`/api/fonts?id=${id}`);
    if (!r.ok) return;
    const [data] = await r.json() as { fontid: number; fontname: string; fontstatus: number; fontdata: string }[];
    if (!data) return;
    const parsed = parseFigFont(data.fontname, data.fontdata);
    parsed.fontid = data.fontid;
    parsed.fontstatus = data.fontstatus;
    setFont(parsed);
    // Register with figlet for Logo Maker
    if (figletLoadedRef.current) {
      (window as { figlet?: { parseFont: (n: string, d: string, cb: () => void) => void } })
        .figlet?.parseFont(data.fontname, data.fontdata, () => {});
    }
  }, [figletLoadedRef]);

  const saveFont = useCallback(async () => {
    if (!font.fontname.trim()) { setStatus({ msg: "Fill in the font name first.", ok: false }); return; }
    const body = {
      fontid: font.fontid || undefined,
      fontname: font.fontname,
      fontstatus: font.fontstatus,
      fontdata: createFigFileData(font),
    };
    const r = await fetch("/api/fonts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      setStatus({ msg: "Font saved!", ok: true });
      await loadFontList();
    } else {
      setStatus({ msg: "Save failed.", ok: false });
    }
  }, [font, loadFontList]);

  const deleteFont = useCallback(async () => {
    if (font.fontid === 0) { setStatus({ msg: "No saved font to delete.", ok: false }); return; }
    if (!confirm("Delete this font? This cannot be undone.")) return;
    const r = await fetch(`/api/fonts/${font.fontid}`, { method: "DELETE" });
    if (r.ok) {
      setStatus({ msg: "Font deleted.", ok: true });
      setFont(emptyFont());
      await loadFontList();
    } else if (r.status === 403) {
      setStatus({ msg: "You do not own this font.", ok: false });
    } else {
      setStatus({ msg: "Delete failed.", ok: false });
    }
  }, [font.fontid, loadFontList]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { loadFontList(); }, [loadFontList]);

  // Auto-dismiss status
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // Logo Maker: update output when text / font changes
  useEffect(() => {
    if (!figletReady || tab !== "maker") return;
    const w = window as { figlet?: { text: (t: string, opts: Record<string, unknown>, cb: (e: unknown, d: string) => void) => void } };
    if (!w.figlet) return;
    w.figlet.text(testText, {
      font: font.fontname || "__FONT_IN_PROGRESS__",
      showHardBlanks,
    }, (_err: unknown, data: string) => {
      setTestOutput(data || "(Font not loaded — open Character Editor first)");
    });
  }, [testText, showHardBlanks, font.fontname, figletReady, tab]);

  // ── Char editing ──────────────────────────────────────────────────────────

  const updateChar = (code: number, value: string) => {
    setFont(f => ({ ...f, figChars: { ...f.figChars, [code]: value } }));
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const doExport = () => {
    setExportText(createFigFileData(font));
    setShowExport(true);
  };

  const doImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = parseFigFont(font.fontname || "imported", importText);
      parsed.fontid = font.fontid;
      parsed.fontstatus = font.fontstatus;
      setFont(parsed);
      setShowImport(false);
      setImportText("");
      setStatus({ msg: "Font imported!", ok: true });
    } catch {
      setStatus({ msg: "Could not parse that data — is it a valid .flf file?", ok: false });
    }
  };

  // ── Char display ──────────────────────────────────────────────────────────

  const charLabel = (code: number) => {
    if (code === 32) return "SPC";
    try { return String.fromCharCode(code); } catch { return `#${code}`; }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Load figlet.js for Logo Maker */}
      <Script
        src="/assets/js/fonteditor/vendor/figlet/lib/figlet.js"
        strategy="afterInteractive"
        onLoad={() => { figletLoadedRef.current = true; setFigletReady(true); }}
      />
      <link rel="stylesheet" href="/assets/css/fonteditor.css" />

      <div className="col-lg-12 bg-secondary" id="main">

        {/* Status bar */}
        {status && (
          <div className={`alert alert-${status.ok ? "success" : "warning"} animate__animated animate__shakeX amt-1`}>
            {status.msg}
          </div>
        )}

        {/* ── Top toolbar ── */}
        <div className="row apt-1 apb-1 apl-1 apr-1 bg-secondary" style={{ gap: "8px", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
          {/* Style selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label className="fig-draw-label white" style={{ marginRight: "4px" }}>Style:</label>
            <select
              id="fontSelect"
              className="custom-select custom-select-sm"
              style={{ width: "180px" }}
              value={font.fontid}
              onChange={e => loadFont(parseInt(e.target.value))}
            >
              <option value={0}>— New —</option>
              {fonts.map(f => (
                <option key={f.fontid} value={f.fontid}>{f.fontname}</option>
              ))}
            </select>
          </div>

          {/* Font name */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label className="fig-draw-label white" style={{ marginRight: "4px" }}>Name:</label>
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: "160px" }}
              maxLength={20}
              value={font.fontname}
              placeholder="font name"
              onChange={e => setFont(f => ({ ...f, fontname: e.target.value }))}
            />
          </div>

          {/* Visibility */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label className="fig-draw-label white" style={{ marginRight: "4px" }}>Visibility:</label>
            <select
              className="custom-select custom-select-sm"
              style={{ width: "170px" }}
              value={font.fontstatus}
              onChange={e => setFont(f => ({ ...f, fontstatus: parseInt(e.target.value) }))}
            >
              <option value={1}>Private</option>
              <option value={2}>Public (view only)</option>
              <option value={3}>Public (anyone can edit)</option>
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
            <button className="btn-big" onClick={() => setFont(emptyFont())}>New</button>
            <button className="btn-big" onClick={saveFont}>Save</button>
            <button className="btn-big" onClick={deleteFont}>Delete</button>
            <button className="btn-big" onClick={doImport.bind(null)}>Import</button>
            <button className="btn-big" onClick={doExport}>Export</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <ul className="nav nav-tabs apt-1 bg-secondary">
          <li className="nav-item bg-secondary">
            <a
              className={`nav-link bg-secondary${tab === "editor" ? " active" : ""}`}
              style={{ background: "#212121 !important", cursor: "pointer" }}
              onClick={() => setTab("editor")}
            >
              Character Editor
            </a>
          </li>
          <li className="nav-item bg-secondary">
            <a
              className={`nav-link bg-secondary${tab === "maker" ? " active" : ""}`}
              style={{ background: "#212121 !important", cursor: "pointer" }}
              onClick={() => setTab("maker")}
            >
              Logo Maker
            </a>
          </li>
        </ul>

        {/* ── Character Editor ── */}
        {tab === "editor" && (
          <div className="row apt-1 apl-1 apr-1 apb-1">

            {/* Left: character grid */}
            <div className="col-lg-3 col-md-4">
              <div style={{ marginBottom: "8px" }}>
                <span className="white" style={{ fontSize: "12px" }}>Click a character to edit:</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {CHAR_ORDER.map(code => (
                  <button
                    key={code}
                    className={`fontbtn btn btn-lg${selectedChar === code ? " active" : ""}`}
                    style={{
                      background: selectedChar === code ? "#555" : "#bbb",
                      color: selectedChar === code ? "#fff" : "#000",
                      border: selectedChar === code ? "1px solid #fff" : "1px solid #888",
                      minWidth: "28px", padding: "4px 2px", fontSize: "11px", lineHeight: 1,
                    }}
                    title={`U+${code.toString(16).toUpperCase().padStart(4, "0")} ${charLabel(code)}`}
                    onClick={() => setSelectedChar(code)}
                  >
                    {charLabel(code)}
                  </button>
                ))}
              </div>

              {/* Font options */}
              <div style={{ marginTop: "16px" }}>
                <h6 className="white">Font Options</h6>

                <div className="row apt-1" style={{ fontSize: "12px" }}>
                  <div className="col-5 white">H-Layout:</div>
                  <div className="col-7">
                    <select
                      className="custom-select custom-select-sm"
                      value={font.horizontalLayout}
                      onChange={e => setFont(f => ({ ...f, horizontalLayout: e.target.value as HLayout }))}
                    >
                      {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {font.horizontalLayout === "Controlled Smushing" && (
                  <div style={{ paddingLeft: "8px", fontSize: "11px" }}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <input
                          type="checkbox"
                          id={`hrule${n}`}
                          checked={!!font.hrule[n]}
                          onChange={e => setFont(f => ({ ...f, hrule: { ...f.hrule, [n]: e.target.checked } }))}
                        />
                        <label htmlFor={`hrule${n}`} className="white" title={H_RULE_TIPS[n]} style={{ cursor: "help" }}>
                          H-Rule {n}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="row apt-1" style={{ fontSize: "12px" }}>
                  <div className="col-5 white">V-Layout:</div>
                  <div className="col-7">
                    <select
                      className="custom-select custom-select-sm"
                      value={font.verticalLayout}
                      onChange={e => setFont(f => ({ ...f, verticalLayout: e.target.value as VLayout }))}
                    >
                      {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {font.verticalLayout === "Controlled Smushing" && (
                  <div style={{ paddingLeft: "8px", fontSize: "11px" }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <input
                          type="checkbox"
                          id={`vrule${n}`}
                          checked={!!font.vrule[n]}
                          onChange={e => setFont(f => ({ ...f, vrule: { ...f.vrule, [n]: e.target.checked } }))}
                        />
                        <label htmlFor={`vrule${n}`} className="white" title={V_RULE_TIPS[n]} style={{ cursor: "help" }}>
                          V-Rule {n}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="row apt-1" style={{ fontSize: "12px" }}>
                  <div className="col-5 white">Hard blank:</div>
                  <div className="col-7">
                    <input
                      type="text" maxLength={1} className="form-control form-control-sm"
                      value={font.hardBlank}
                      onChange={e => setFont(f => ({ ...f, hardBlank: e.target.value.slice(-1) || "$" }))}
                    />
                  </div>
                </div>

                <div className="row apt-1" style={{ fontSize: "12px" }}>
                  <div className="col-5 white">Baseline:</div>
                  <div className="col-7">
                    <input
                      type="number" min={1} max={20} className="form-control form-control-sm"
                      value={font.baseline}
                      onChange={e => setFont(f => ({ ...f, baseline: parseInt(e.target.value) || f.height }))}
                    />
                  </div>
                </div>

                <div className="row apt-1" style={{ fontSize: "12px" }}>
                  <div className="col-5 white">Case insensitive:</div>
                  <div className="col-7">
                    <input
                      type="checkbox"
                      checked={font.caseInsensitive}
                      onChange={e => setFont(f => ({ ...f, caseInsensitive: e.target.checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: editor + preview */}
            <div className="col-lg-9 col-md-8">
              <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="white">
                  Editing: <strong style={{ color: "#55ffff" }}>
                    {selectedChar === -1 ? "[Comment Header]" : `'${charLabel(selectedChar)}'  (U+${selectedChar.toString(16).toUpperCase().padStart(4, "0")})`}
                  </strong>
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="btn-big"
                    style={{ fontSize: "11px" }}
                    onClick={() => {
                      const idx = CHAR_ORDER.indexOf(selectedChar);
                      if (idx > 0) setSelectedChar(CHAR_ORDER[idx - 1]);
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    className="btn-big"
                    style={{ fontSize: "11px" }}
                    onClick={() => {
                      const idx = CHAR_ORDER.indexOf(selectedChar);
                      if (idx < CHAR_ORDER.length - 1) setSelectedChar(CHAR_ORDER[idx + 1]);
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <textarea
                className="fig-txt fig-font"
                style={{
                  height: "280px", width: "100%",
                  background: "#111", color: "#55ffff",
                  border: "1px solid #444", padding: "8px",
                  fontFamily: "TopazPlus_a1200, monospace",
                  fontSize: "14px", lineHeight: "16px",
                  resize: "vertical", boxSizing: "border-box",
                }}
                spellCheck={false}
                value={font.figChars[selectedChar] ?? ""}
                onChange={e => updateChar(selectedChar, e.target.value)}
                placeholder={`Draw the ASCII art for '${charLabel(selectedChar)}' here…`}
              />

              {/* Live preview */}
              <div style={{ marginTop: "8px" }}>
                <span className="white" style={{ fontSize: "12px" }}>Preview:</span>
                <div
                  className="fig-test-output"
                  style={{ marginTop: "4px", minHeight: "60px", padding: "8px", background: "#0a0a0a", border: "1px solid #333" }}
                >
                  {font.figChars[selectedChar] || <span style={{ color: "#555" }}>(empty)</span>}
                </div>
              </div>

              {/* Comment header editor */}
              <div style={{ marginTop: "16px" }}>
                <span className="white" style={{ fontSize: "12px" }}>Font comment header:</span>
                <textarea
                  className="fig-font"
                  style={{
                    width: "100%", height: "80px", marginTop: "4px",
                    background: "#111", color: "#aaa", border: "1px solid #333",
                    fontFamily: "TopazPlus_a1200, monospace", fontSize: "12px", padding: "4px",
                    boxSizing: "border-box", resize: "vertical",
                  }}
                  value={font.figChars[-1] ?? ""}
                  onChange={e => updateChar(-1, e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Logo Maker ── */}
        {tab === "maker" && (
          <div className="apt-1 apl-1 apr-1 apb-1">
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: "400px" }}
                placeholder="Type something…"
                value={testText}
                onChange={e => setTestText(e.target.value)}
                autoFocus
              />
              <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "#aaa", fontSize: "12px" }}>
                <input
                  type="checkbox"
                  checked={showHardBlanks}
                  onChange={e => setShowHardBlanks(e.target.checked)}
                />
                Show hard blanks
              </label>
            </div>
            {!font.fontname && (
              <p style={{ color: "#ffff55", fontSize: "12px" }}>
                Load or create a font in the Character Editor tab first.
              </p>
            )}
            <pre className="fig-test-output" style={{ minHeight: "200px", padding: "12px", border: "1px solid #333" }}>
              {testOutput || "(output will appear here)"}
            </pre>
          </div>
        )}

        {/* ── Import modal ── */}
        {showImport && (
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header" style={{ background: "#333" }}>
                  <h4 className="modal-title white">Import FIGFont Data</h4>
                  <button type="button" className="close white" onClick={() => setShowImport(false)}>×</button>
                </div>
                <div className="modal-body" style={{ background: "#222" }}>
                  <textarea
                    className="fig-data-txt fig-font"
                    style={{ background: "#111", color: "#0ff", border: "1px solid #444", width: "100%", height: "200px" }}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Paste .flf file contents here…"
                  />
                  <p style={{ color: "#aaa", fontSize: "12px", marginTop: "8px" }}>
                    Copy the contents of a *.flf file and paste above, then press Import.
                  </p>
                </div>
                <div className="modal-footer" style={{ background: "#222" }}>
                  <button className="btn-big" onClick={doImport}>Import</button>
                  <button className="btn-big" onClick={() => setShowImport(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Export modal ── */}
        {showExport && (
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header" style={{ background: "#333" }}>
                  <h4 className="modal-title white">Exported FIGFont Data</h4>
                  <button type="button" className="close white" onClick={() => setShowExport(false)}>×</button>
                </div>
                <div className="modal-body" style={{ background: "#222" }}>
                  <textarea
                    className="fig-data-txt fig-font"
                    style={{ background: "#111", color: "#0ff", border: "1px solid #444", width: "100%", height: "200px" }}
                    readOnly
                    value={exportText}
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                  />
                  <p style={{ color: "#aaa", fontSize: "12px", marginTop: "8px" }}>
                    Copy the text above into a *.flf file for use with FIGlet.
                  </p>
                </div>
                <div className="modal-footer" style={{ background: "#222" }}>
                  <button className="btn-big" onClick={() => {
                    navigator.clipboard.writeText(exportText).then(() => setStatus({ msg: "Copied to clipboard!", ok: true }));
                  }}>Copy All</button>
                  <button className="btn-big" onClick={() => setShowExport(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
