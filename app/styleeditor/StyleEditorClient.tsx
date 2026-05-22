"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Script from "next/script";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FontMeta { fontid: number; fontname: string; fontstatus: number; group_id: number | null }
interface FontGroup { id: number; name: string; owner_id: number; is_owner: boolean; members: { user_id: number; nick: string }[] }

interface FigFont {
  fontid: number;
  fontname: string;
  fontstatus: number;   // 1=private 2=public-view 3=public-edit
  group_id: number | null;
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
  figChars: Record<number, string>;
}

type HLayout = "Full" | "Fitted" | "Controlled Smushing" | "Universal Smushing";
type VLayout = "Full" | "Fitted" | "Controlled Smushing" | "Universal Smushing";
type Tab = "editor" | "preview";

const LAYOUTS: HLayout[] = ["Full", "Fitted", "Controlled Smushing", "Universal Smushing"];

const CHAR_ORDER: number[] = [];
for (let i = 32; i <= 126; i++) CHAR_ORDER.push(i);
CHAR_ORDER.push(196, 214, 220, 228, 246, 252, 223);

// ─── FIGfont utilities ────────────────────────────────────────────────────────

function emptyFont(): FigFont {
  const figChars: Record<number, string> = {};
  figChars[-1] = "Font Author: Enter your name here\n\nFIGFont created with: https://www.asciiarena.se";
  CHAR_ORDER.forEach(c => { figChars[c] = ""; });
  return {
    fontid: 0, fontname: "", fontstatus: 1, group_id: null,
    hardBlank: "$", height: 6, baseline: 6, maxLength: 10,
    printDirection: 0, caseInsensitive: false,
    horizontalLayout: "Fitted", verticalLayout: "Full",
    hrule: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    vrule: { 1: false, 2: false, 3: false, 4: false, 5: false },
    codeTagCount: 0, figChars,
  };
}

function spacePad(n: number): string { return " ".repeat(Math.max(0, n)); }

function fixFigChars(font: FigFont): FigFont {
  const f = { ...font, figChars: { ...font.figChars } };
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
  for (const idx of Object.keys(f.figChars).map(Number)) {
    if (idx === -1) continue;
    const rows = (f.figChars[idx] ?? "").replace(/\r\n/g, "\n").split("\n");
    const padded = rows.map(r => r + spacePad(charWidth[idx] - r.length));
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
  const hp = lines[0].split(" ");
  font.hardBlank = (hp[0] ?? "flf2a$").slice(-1);
  font.height = parseInt(hp[1] ?? "6") || 6;
  font.baseline = parseInt(hp[2] ?? "6") || 6;
  font.maxLength = parseInt(hp[3] ?? "10") || 10;
  const oldLayout = parseInt(hp[4] ?? "0") || 0;
  const commentCount = parseInt(hp[5] ?? "0") || 0;
  font.printDirection = parseInt(hp[6] ?? "0") || 0;
  const fullLayout = parseInt(hp[7] ?? "0") || 0;
  font.codeTagCount = parseInt(hp[8] ?? "0") || 0;
  if (oldLayout === -1) { font.horizontalLayout = "Full"; }
  else if (fullLayout & 128) {
    font.horizontalLayout = "Controlled Smushing";
    for (let i = 1; i <= 6; i++) font.hrule[i] = !!(fullLayout & (1 << (i - 1)));
  } else if (fullLayout & 64) { font.horizontalLayout = "Fitted"; }
  if (fullLayout & 16384) {
    font.verticalLayout = "Controlled Smushing";
    for (let i = 1; i <= 5; i++) font.vrule[i] = !!(fullLayout & (1 << (i + 7)));
  } else if (fullLayout & 8192) { font.verticalLayout = "Fitted"; }
  const commentLines = lines.slice(1, 1 + commentCount);
  font.figChars[-1] = commentLines.join("\n");
  let lineIdx = 1 + commentCount;
  for (const ch of CHAR_ORDER) {
    if (lineIdx >= lines.length) break;
    const rows: string[] = [];
    for (let h = 0; h < font.height; h++) {
      rows.push((lines[lineIdx++] ?? "").replace(/@+$/, "").replace(/\$$/, ""));
    }
    font.figChars[ch] = rows.join("\n");
  }
  return font;
}

function charDimensions(art: string): { rows: number; maxCols: number } {
  if (!art.trim()) return { rows: 0, maxCols: 0 };
  const lines = art.replace(/\r\n/g, "\n").split("\n");
  return { rows: lines.length, maxCols: Math.max(0, ...lines.map(l => l.length)) };
}

// Ruler string: "    5    0    5    0" etc up to width
function makeRuler(width: number): string {
  let r = "";
  for (let i = 1; i <= width; i++) {
    if (i % 10 === 0) r += String(i % 100).slice(-1);
    else if (i % 5 === 0) r += "5";
    else r += ".";
  }
  return r;
}


const H_RULE_TIPS: Record<number, string> = {
  1: "Equal chars merge into one.",
  2: "Underscores yield to |/\\[]{}()<>.",
  3: "Six classes; later class wins.",
  4: "Opposing brackets/braces/parens -> |.",
  5: "/\\ -> | \\/ -> Y >< -> X.",
  6: "Two hard blanks merge into one.",
};
const V_RULE_TIPS: Record<number, string> = {
  1: "Equal chars merge.",
  2: "Underscores yield to |/\\[]{}()<>.",
  3: "Six classes; later class wins.",
  4: "Stacked - and _ -> =.",
  5: "Stacked | chars supersmush.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StyleEditorClient({ userId }: { userNick: string; userId: number }) {
  const [fonts, setFonts] = useState<FontMeta[]>([]);
  const [font, setFont] = useState<FigFont>(emptyFont());
  const [selectedChar, setSelectedChar] = useState<number>(65);
  const [tab, setTab] = useState<Tab>("editor");
  const [previewText, setPreviewText] = useState("Hello!");
  const [previewOutput, setPreviewOutput] = useState("");
  const [showHardBlanks, setShowHardBlanks] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState("");
  const [figletReady, setFigletReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<FontGroup[]>([]);
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteNick, setInviteNick] = useState<Record<number, string>>({});
  const [groupMsg, setGroupMsg] = useState<{ id: number | "new"; msg: string; ok: boolean } | null>(null);

  // Undo/redo stacks per character code
  const undoStacks = useRef<Map<number, { past: string[]; future: string[] }>>(new Map());
  const figletLoadedRef = useRef(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function getStack(code: number) {
    if (!undoStacks.current.has(code)) undoStacks.current.set(code, { past: [], future: [] });
    return undoStacks.current.get(code)!;
  }

  const [editorDark, setEditorDark] = useState(true);
  const dim = charDimensions(font.figChars[selectedChar] ?? "");
  const rulerStr = makeRuler(Math.max(dim.maxCols + 2, 40));

  // ── API ───────────────────────────────────────────────────────────────────

  const loadFontList = useCallback(async () => {
    const r = await fetch("/api/fonts");
    if (r.ok) setFonts(await r.json() as FontMeta[]);
  }, []);

  const loadGroups = useCallback(async () => {
    const r = await fetch("/api/font-groups");
    if (r.ok) setGroups(await r.json() as FontGroup[]);
  }, []);

  const loadFont = useCallback(async (id: number) => {
    if (id === 0) { setFont(emptyFont()); undoStacks.current.clear(); return; }
    const r = await fetch(`/api/fonts?id=${id}`);
    if (!r.ok) return;
    const [data] = await r.json() as { fontid: number; fontname: string; fontstatus: number; fontdata: string; group_id: number | null }[];
    if (!data) return;
    const parsed = parseFigFont(data.fontname, data.fontdata);
    parsed.fontid = data.fontid;
    parsed.fontstatus = data.fontstatus;
    parsed.group_id = data.group_id ?? null;
    setFont(parsed);
    undoStacks.current.clear();
    if (figletLoadedRef.current) {
      (window as { figlet?: { parseFont: (n: string, d: string, cb: () => void) => void } })
        .figlet?.parseFont(data.fontname, data.fontdata, () => {});
    }
  }, []);

  const saveFont = useCallback(async () => {
    if (!font.fontname.trim()) { setStatus({ msg: "Fill in the font name first.", ok: false }); return; }
    const body = { fontid: font.fontid || undefined, fontname: font.fontname, fontstatus: font.fontstatus, fontdata: createFigFileData(font), group_id: font.group_id };
    const r = await fetch("/api/fonts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { setStatus({ msg: "Font saved!", ok: true }); await loadFontList(); }
    else setStatus({ msg: "Save failed.", ok: false });
  }, [font, loadFontList]);

  const deleteFont = useCallback(async () => {
    if (font.fontid === 0) { setStatus({ msg: "No saved font to delete.", ok: false }); return; }
    if (!confirm("Delete this font? This cannot be undone.")) return;
    const r = await fetch(`/api/fonts/${font.fontid}`, { method: "DELETE" });
    if (r.ok) { setStatus({ msg: "Font deleted.", ok: true }); setFont(emptyFont()); undoStacks.current.clear(); await loadFontList(); }
    else if (r.status === 403) setStatus({ msg: "You do not own this font.", ok: false });
    else setStatus({ msg: "Delete failed.", ok: false });
  }, [font.fontid, loadFontList]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { loadFontList(); loadGroups(); }, [loadFontList, loadGroups]);
  useEffect(() => { if (!status) return; const t = setTimeout(() => setStatus(null), 4000); return () => clearTimeout(t); }, [status]);
  useEffect(() => { if (!groupMsg) return; const t = setTimeout(() => setGroupMsg(null), 3000); return () => clearTimeout(t); }, [groupMsg]);

  // Debounced figlet re-parse + preview render whenever font data or preview text changes
  const figletFontKey = font.fontname || "__preview__";
  const figCharsSnapshot = useMemo(() => font.figChars, [font.figChars]); // stable ref for effect dep
  useEffect(() => {
    if (!figletReady) return;
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      const w = window as {
        figlet?: {
          parseFont: (n: string, d: string, cb: () => void) => void;
          text: (t: string, opts: Record<string, unknown>, cb: (e: unknown, d: string) => void) => void;
        };
      };
      const data = createFigFileData({ ...font, figChars: figCharsSnapshot });
      w.figlet?.parseFont(figletFontKey, data, () => {
        w.figlet?.text(previewText, { font: figletFontKey, showHardBlanks }, (_e, d) => setPreviewOutput(d || ""));
      });
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figCharsSnapshot, previewText, showHardBlanks, figletFontKey, figletReady]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S = save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveFont();
        return;
      }
      // Ctrl+Z = undo char, Ctrl+Y = redo char (when textarea focused)
      if (document.activeElement === textareaRef.current) {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault();
          const stack = getStack(selectedChar);
          if (stack.past.length > 0) {
            const prev = stack.past.pop()!;
            stack.future.push(font.figChars[selectedChar] ?? "");
            setFont(f => ({ ...f, figChars: { ...f.figChars, [selectedChar]: prev } }));
          }
          return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
          e.preventDefault();
          const stack = getStack(selectedChar);
          if (stack.future.length > 0) {
            const next = stack.future.pop()!;
            stack.past.push(font.figChars[selectedChar] ?? "");
            setFont(f => ({ ...f, figChars: { ...f.figChars, [selectedChar]: next } }));
          }
          return;
        }
        return; // don't intercept other keys when editing
      }
      // Tab / Shift+Tab = cycle chars
      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const idx = CHAR_ORDER.indexOf(selectedChar);
        if (e.shiftKey) { if (idx > 0) setSelectedChar(CHAR_ORDER[idx - 1]); }
        else { if (idx < CHAR_ORDER.length - 1) setSelectedChar(CHAR_ORDER[idx + 1]); }
      }
      // Arrow keys to navigate char grid
      if (e.key === "ArrowRight" && !e.ctrlKey) {
        const idx = CHAR_ORDER.indexOf(selectedChar);
        if (idx < CHAR_ORDER.length - 1) setSelectedChar(CHAR_ORDER[idx + 1]);
      }
      if (e.key === "ArrowLeft" && !e.ctrlKey) {
        const idx = CHAR_ORDER.indexOf(selectedChar);
        if (idx > 0) setSelectedChar(CHAR_ORDER[idx - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFont, selectedChar, font.figChars]);

  // ── Char editing with undo ────────────────────────────────────────────────

  const updateChar = (code: number, value: string) => {
    const stack = getStack(code);
    stack.past.push(font.figChars[code] ?? "");
    if (stack.past.length > 100) stack.past.shift(); // cap history
    stack.future = [];
    setFont(f => ({ ...f, figChars: { ...f.figChars, [code]: value } }));
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const doExport = () => { setExportText(createFigFileData(font)); setShowExport(true); };

  const doImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = parseFigFont(font.fontname || "imported", importText);
      parsed.fontid = font.fontid;
      parsed.fontstatus = font.fontstatus;
      setFont(parsed);
      undoStacks.current.clear();
      setShowImport(false);
      setImportText("");
      setStatus({ msg: "Font imported!", ok: true });
    } catch {
      setStatus({ msg: "Could not parse that data - is it a valid .flf file?", ok: false });
    }
  };

  const copyChar = () => {
    const art = font.figChars[selectedChar] ?? "";
    navigator.clipboard.writeText(art).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const charLabel = (code: number) => {
    if (code === 32) return "SPC";
    try { return String.fromCharCode(code); } catch { return `#${code}`; }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const undoAvail = getStack(selectedChar).past.length > 0;
  const redoAvail = getStack(selectedChar).future.length > 0;

  return (
    <>
      <Script src="/assets/js/fonteditor/vendor/figlet/lib/figlet.js" strategy="afterInteractive"
        onLoad={() => { figletLoadedRef.current = true; setFigletReady(true); }} />
      <link rel="stylesheet" href="/assets/css/fonteditor.css" />

      <div className="col-lg-12 bg-secondary" id="main" style={{ padding: "0" }}>

        {/* Status bar */}
        {status && (
          <div className={`alert alert-${status.ok ? "success" : "warning"} animate__animated animate__shakeX amt-1 aml-1 amr-1`} style={{ marginBottom: "4px" }}>
            {status.msg}
          </div>
        )}

        {/* ── Top toolbar ── */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", padding: "6px 8px", background: "#1a1a1a", borderBottom: "1px solid #333" }}>
          <label className="white" style={{ marginBottom: 0 }}>Style:</label>
          <select className="form-select" style={{ width: "160px" }}
            value={font.fontid}
            onChange={e => loadFont(parseInt(e.target.value))}>
            <option value={0}>-- New --</option>
            {fonts.map(f => <option key={f.fontid} value={f.fontid}>{f.fontname}</option>)}
          </select>

          <label className="white" style={{ marginBottom: 0 }}>Name:</label>
          <input type="text" className="form-control" style={{ width: "140px" }}
            maxLength={20} value={font.fontname} placeholder="font name"
            onChange={e => setFont(f => ({ ...f, fontname: e.target.value }))} />

          <label className="white" style={{ marginBottom: 0 }}>Visibility:</label>
          <select className="form-select" style={{ width: "155px" }}
            value={font.fontstatus}
            onChange={e => setFont(f => ({ ...f, fontstatus: parseInt(e.target.value) }))}>
            <option value={1}>Private</option>
            <option value={2}>Public (view only)</option>
            <option value={3}>Public (anyone can edit)</option>
          </select>

          <label className="white" style={{ marginBottom: 0 }}>Group:</label>
          <select className="form-select" style={{ width: "140px" }}
            value={font.group_id ?? 0}
            onChange={e => setFont(f => ({ ...f, group_id: parseInt(e.target.value) || null }))}>
            <option value={0}>No group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <div style={{ display: "flex", gap: "4px", marginLeft: "auto", flexWrap: "wrap" }}>
            <input type="button" className="btn-big" value="New" onClick={() => { setFont(emptyFont()); undoStacks.current.clear(); }} />
            <input type="button" className="btn-big" value="Save" onClick={saveFont} />
            <input type="button" className="btn-big" value="Delete" onClick={deleteFont} />
            <input type="button" className="btn-big" value="Groups" onClick={() => { loadGroups(); setShowGroups(true); }} />
            <input type="button" className="btn-big" value="Import" onClick={() => setShowImport(true)} />
            <input type="button" className="btn-big" value="Export" onClick={doExport} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <ul className="nav nav-tabs bg-secondary" style={{ marginBottom: 0 }}>
          {(["editor", "preview"] as Tab[]).map(t => (
            <li key={t} className="nav-item bg-secondary">
              <a className={`nav-link bg-secondary${tab === t ? " active" : ""}`}
                style={{ cursor: "pointer", background: "#212121 !important", padding: "6px 12px" }}
                onClick={() => setTab(t)}>
                {t === "editor" ? "Character Editor" : "All Characters"}
              </a>
            </li>
          ))}
          <li style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: "8px" }}>
            <span style={{ color: "#555", fontSize: "11px" }}>Ctrl+S = save | Tab/Shift+Tab = cycle chars | Ctrl+Z/Y = undo/redo</span>
          </li>
        </ul>

        {/* ── Character Editor ── */}
        {tab === "editor" && (
          <div style={{ display: "flex", gap: "0", height: "calc(100vh - 200px)", minHeight: "480px" }}>

            {/* Left panel: char grid + font options */}
            <div style={{ width: "200px", minWidth: "200px", overflowY: "auto", background: "#1a1a1a", borderRight: "1px solid #333", padding: "6px" }}>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>Click or use arrow keys:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {CHAR_ORDER.map(code => (
                  <input
                    key={code}
                    type="button"
                    title={`U+${code.toString(16).toUpperCase().padStart(4,"0")} ${charLabel(code)}`}
                    value={charLabel(code)}
                    style={{
                      background: selectedChar === code ? "#444" : "#222",
                      color: selectedChar === code ? "#55ffff" : (font.figChars[code]?.trim() ? "#aaa" : "#555"),
                      border: selectedChar === code ? "1px solid #55ffff" : "1px solid #333",
                      width: "26px", height: "26px", padding: "0",
                      fontSize: "11px", lineHeight: "26px",
                      cursor: "pointer", fontFamily: "TopazPlus_a1200, monospace",
                      textAlign: "center",
                    }}
                    onClick={() => setSelectedChar(code)}
                  />
                ))}
              </div>

            </div>

            {/* Center: editor */}
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", overflow: "hidden", padding: "6px 8px" }}>
              {/* Char info + actions bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span className="white">
                  Editing: <strong style={{ color: "#55ffff" }}>
                    {selectedChar === -1 ? "[Comment]" : `'${charLabel(selectedChar)}' (U+${selectedChar.toString(16).toUpperCase().padStart(4,"0")})`}
                  </strong>
                </span>
                <span style={{ fontSize: "11px", color: dim.maxCols > 0 ? "#55ff55" : "#555" }}>
                  {dim.maxCols > 0 ? `${dim.rows} rows x ${dim.maxCols} cols` : "empty"}
                </span>
                <div style={{ display: "flex", gap: "4px", marginLeft: "auto", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: 0, cursor: "pointer", userSelect: "none" }}>
                    <div
                      onClick={() => setEditorDark(d => !d)}
                      style={{
                        width: "36px", height: "18px", borderRadius: "0", position: "relative",
                        background: editorDark ? "#333" : "#ccc", border: "1px solid #555",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute", top: "2px",
                        left: editorDark ? "2px" : "18px",
                        width: "12px", height: "12px", borderRadius: "0",
                        background: editorDark ? "#55ffff" : "#fff",
                        transition: "left 0.15s",
                      }} />
                    </div>
                    <span style={{ fontSize: "11px", color: editorDark ? "#55ffff" : "#aaa" }}>
                      {editorDark ? "dark/cyan" : "light"}
                    </span>
                  </label>
                  <input type="button" className="btn-big" value="&lt; Prev" style={{ padding: "0 8px", minHeight: "28px", height: "28px" }}
                    onClick={() => { const i = CHAR_ORDER.indexOf(selectedChar); if (i > 0) setSelectedChar(CHAR_ORDER[i-1]); }} />
                  <input type="button" className="btn-big" value="Next &gt;" style={{ padding: "0 8px", minHeight: "28px", height: "28px" }}
                    onClick={() => { const i = CHAR_ORDER.indexOf(selectedChar); if (i < CHAR_ORDER.length-1) setSelectedChar(CHAR_ORDER[i+1]); }} />
                  <input type="button" className="btn-big" value={copied ? "Copied!" : "Copy"} style={{ padding: "0 8px", minHeight: "28px", height: "28px" }}
                    onClick={copyChar} />
                  <input type="button" className="btn-big" value="Undo" style={{ padding: "0 8px", minHeight: "28px", height: "28px", opacity: undoAvail ? 1 : 0.4 }}
                    onClick={() => {
                      const stack = getStack(selectedChar);
                      if (stack.past.length > 0) {
                        const prev = stack.past.pop()!;
                        stack.future.push(font.figChars[selectedChar] ?? "");
                        setFont(f => ({ ...f, figChars: { ...f.figChars, [selectedChar]: prev } }));
                      }
                    }} />
                  <input type="button" className="btn-big" value="Redo" style={{ padding: "0 8px", minHeight: "28px", height: "28px", opacity: redoAvail ? 1 : 0.4 }}
                    onClick={() => {
                      const stack = getStack(selectedChar);
                      if (stack.future.length > 0) {
                        const next = stack.future.pop()!;
                        stack.past.push(font.figChars[selectedChar] ?? "");
                        setFont(f => ({ ...f, figChars: { ...f.figChars, [selectedChar]: next } }));
                      }
                    }} />
                </div>
              </div>

              {/* Main textarea + line numbers side-by-side */}
              <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Ruler row: spacer matches line-numbers width, then ruler aligned to textarea */}
                <div style={{ display: "flex", flexShrink: 0 }}>
                  {/* Spacer for line-number column */}
                  <div style={{ minWidth: "32px", background: "#0a0a0a", borderLeft: "1px solid #333" }} />
                  {/* Ruler — same font, size, padding as textarea */}
                  <div style={{
                    fontFamily: "TopazPlus_a1200, monospace", fontSize: "13px", lineHeight: "16px",
                    color: editorDark ? "#444" : "#999", background: editorDark ? "#0a0a0a" : "#d8d8d8", padding: "0 4px",
                    borderLeft: "1px solid #333", borderRight: "1px solid #333",
                    borderTop: "1px solid #222",
                    flex: "1 1 0", overflowX: "hidden", whiteSpace: "pre",
                  }}>
                    {rulerStr}
                  </div>
                </div>

                <div style={{ flex: "1 1 0", display: "flex", overflow: "hidden" }}>
                {/* Line numbers */}
                <div style={{
                  fontFamily: "TopazPlus_a1200, monospace", fontSize: "13px", lineHeight: "16px",
                  color: editorDark ? "#444" : "#999", background: editorDark ? "#0a0a0a" : "#d8d8d8", padding: "2px 4px",
                  borderLeft: "1px solid #333", borderBottom: "1px solid #333",
                  minWidth: "32px", textAlign: "right", userSelect: "none",
                  overflowY: "hidden", whiteSpace: "pre",
                }}>
                  {(font.figChars[selectedChar] ?? "").split("\n").map((_, i) => `${i + 1}\n`).join("")}
                </div>
                <textarea
                  ref={textareaRef}
                  style={{
                    flex: "1 1 0",
                    background: editorDark ? "#111" : "#e8e8e8",
                    color: editorDark ? "#55ffff" : "#000",
                    border: "1px solid #333", borderLeft: "none",
                    fontFamily: "TopazPlus_a1200, monospace",
                    fontSize: "13px", lineHeight: "16px",
                    resize: "none", padding: "2px 4px",
                    outline: "none", tabSize: 1,
                    overflowX: "auto", overflowY: "auto",
                    whiteSpace: "pre",
                  }}
                  spellCheck={false}
                  value={font.figChars[selectedChar] ?? ""}
                  onChange={e => updateChar(selectedChar, e.target.value)}
                  placeholder={`Draw the ASCII art for '${charLabel(selectedChar)}' here...`}
                />
              </div>
              </div>

              {/* Comment header */}
              <div style={{ marginTop: "6px" }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Font comment header:</div>
                <textarea style={{
                  width: "100%", height: "56px", background: "#0d0d0d", color: "#666",
                  border: "1px solid #2a2a2a", fontFamily: "TopazPlus_a1200, monospace",
                  fontSize: "11px", padding: "2px 4px", resize: "vertical",
                }}
                  value={font.figChars[-1] ?? ""}
                  onChange={e => updateChar(-1, e.target.value)} />
              </div>
            </div>

            {/* Right panel: live figlet preview + stats */}
            <div style={{ width: "280px", minWidth: "200px", borderLeft: "1px solid #333", background: "#0d0d0d", padding: "6px 8px", overflowY: "auto" }}>
              <div style={{ color: "#888", marginTop: "4px", marginBottom: "2px" }}>Preview:</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ flex: "1 1 0", fontFamily: "TopazPlus_a1200, monospace" }}
                  value={previewText}
                  placeholder="type something..."
                  onChange={e => setPreviewText(e.target.value)}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: 0, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={showHardBlanks} onChange={e => setShowHardBlanks(e.target.checked)} />
                  <span style={{ color: "#888" }}>HB</span>
                </label>
              </div>
              <div style={{
                fontFamily: "TopazPlus_a1200, monospace", fontSize: "11px", lineHeight: "14px",
                color: "#55ffff", background: "#0a0a0a", padding: "4px",
                border: "1px solid #222", minHeight: "60px", whiteSpace: "pre",
                overflowX: "auto",
              }}>
                {previewOutput || <span style={{ color: "#333" }}>(edit a character to see preview)</span>}
              </div>

              <div style={{ fontSize: "11px", color: "#888", marginTop: "12px", marginBottom: "4px" }}>Width info:</div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>
                {(() => {
                  const current = charDimensions(font.figChars[selectedChar] ?? "");
                  const allWidths = CHAR_ORDER.map(c => charDimensions(font.figChars[c] ?? "").maxCols).filter(w => w > 0);
                  const maxW = allWidths.length > 0 ? Math.max(...allWidths) : 0;
                  const minW = allWidths.length > 0 ? Math.min(...allWidths) : 0;
                  const consistent = allWidths.every(w => w === maxW);
                  return (
                    <>
                      <div>Current: {current.rows}h x {current.maxCols}w</div>
                      {maxW > 0 && <>
                        <div>Max across font: {maxW}</div>
                        <div>Min across font: {minW}</div>
                        <div style={{ color: consistent ? "#55ff55" : "#ffff55", marginTop: "2px" }}>
                          {consistent ? "[OK] All chars same width" : "[!] Inconsistent widths"}
                        </div>
                      </>}
                    </>
                  );
                })()}
              </div>

              <div style={{ fontSize: "11px", color: "#888", marginTop: "12px", marginBottom: "4px" }}>Char status:</div>
              <div style={{ fontSize: "11px" }}>
                {(() => {
                  const filled = CHAR_ORDER.filter(c => (font.figChars[c] ?? "").trim().length > 0).length;
                  return <span style={{ color: "#55ff55" }}>{filled} / {CHAR_ORDER.length} chars defined</span>;
                })()}
              </div>

              <div style={{ borderTop: "1px solid #333", marginTop: "12px", paddingTop: "8px" }}>
                <div className="white" style={{ fontWeight: "bold", marginBottom: "6px" }}>Font Options</div>

                <div style={{ color: "#aaa", marginBottom: "4px" }}>H-Layout:</div>
                <select className="form-select" style={{ width: "100%", marginBottom: "4px" }}
                  value={font.horizontalLayout}
                  onChange={e => setFont(f => ({ ...f, horizontalLayout: e.target.value as HLayout }))}>
                  {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                {font.horizontalLayout === "Controlled Smushing" && (
                  <div style={{ paddingLeft: "4px", marginBottom: "4px" }}>
                    {[1,2,3,4,5,6].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                        <input type="checkbox" id={`hrule${n}`} checked={!!font.hrule[n]}
                          onChange={e => setFont(f => ({ ...f, hrule: { ...f.hrule, [n]: e.target.checked } }))} />
                        <label htmlFor={`hrule${n}`} className="white" title={H_RULE_TIPS[n]} style={{ cursor: "help" }}>H-Rule {n}</label>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ color: "#aaa", marginBottom: "4px" }}>V-Layout:</div>
                <select className="form-select" style={{ width: "100%", marginBottom: "4px" }}
                  value={font.verticalLayout}
                  onChange={e => setFont(f => ({ ...f, verticalLayout: e.target.value as VLayout }))}>
                  {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                {font.verticalLayout === "Controlled Smushing" && (
                  <div style={{ paddingLeft: "4px", marginBottom: "4px" }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                        <input type="checkbox" id={`vrule${n}`} checked={!!font.vrule[n]}
                          onChange={e => setFont(f => ({ ...f, vrule: { ...f.vrule, [n]: e.target.checked } }))} />
                        <label htmlFor={`vrule${n}`} className="white" title={V_RULE_TIPS[n]} style={{ cursor: "help" }}>V-Rule {n}</label>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
                  <span style={{ color: "#aaa", width: "80px" }}>Hard blank:</span>
                  <input type="text" maxLength={1} className="form-control" style={{ width: "40px" }}
                    value={font.hardBlank}
                    onChange={e => setFont(f => ({ ...f, hardBlank: e.target.value.slice(-1) || "$" }))} />
                </div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
                  <span style={{ color: "#aaa", width: "80px" }}>Baseline:</span>
                  <input type="number" min={1} max={20} className="form-control" style={{ width: "60px" }}
                    value={font.baseline}
                    onChange={e => setFont(f => ({ ...f, baseline: parseInt(e.target.value) || f.height }))} />
                </div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
                  <input type="checkbox" id="caseInsensitive" checked={font.caseInsensitive}
                    onChange={e => setFont(f => ({ ...f, caseInsensitive: e.target.checked }))} />
                  <label htmlFor="caseInsensitive" className="white" style={{ cursor: "pointer" }}>Case insensitive</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── All Characters Preview ── */}
        {tab === "preview" && (
          <div style={{ padding: "8px", overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>
              Click any character to edit it. Green = defined, grey = empty.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CHAR_ORDER.map(code => {
                const art = font.figChars[code] ?? "";
                const hasContent = art.trim().length > 0;
                return (
                  <div key={code}
                    onClick={() => { setSelectedChar(code); setTab("editor"); }}
                    style={{
                      cursor: "pointer", background: "#111", border: `1px solid ${code === selectedChar ? "#55ffff" : hasContent ? "#333" : "#222"}`,
                      padding: "4px", minWidth: "60px",
                    }}>
                    <div style={{ fontSize: "9px", color: "#555", marginBottom: "2px", textAlign: "center" }}>
                      {charLabel(code)}
                    </div>
                    <pre style={{
                      fontFamily: "TopazPlus_a1200, monospace", fontSize: "6px", lineHeight: "7px",
                      color: hasContent ? "#55ff55" : "#2a2a2a", margin: 0, overflow: "hidden",
                      maxHeight: "56px", whiteSpace: "pre",
                    }}>
                      {hasContent ? art : ".\n.\n.\n.\n.\n."}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ── Groups modal ── */}
        {showGroups && (
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header" style={{ background: "#333" }}>
                  <span className="modal-title white" style={{ fontWeight: "bold" }}>Font Groups</span>
                  <button type="button" className="close white" onClick={() => setShowGroups(false)}>x</button>
                </div>
                <div className="modal-body" style={{ background: "#1a1a1a", maxHeight: "70vh", overflowY: "auto" }}>

                  {/* Create new group */}
                  <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #333" }}>
                    <div className="white" style={{ fontWeight: "bold", marginBottom: "6px" }}>Create new group</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="text" className="form-control" style={{ maxWidth: "260px" }}
                        placeholder="Group name..."
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key !== "Enter") return;
                          const name = newGroupName.trim();
                          if (!name) return;
                          const r = await fetch("/api/font-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                          if (r.ok) { setNewGroupName(""); setGroupMsg({ id: "new", msg: "Group created!", ok: true }); await loadGroups(); }
                          else setGroupMsg({ id: "new", msg: "Failed to create group.", ok: false });
                        }}
                      />
                      <input type="button" className="btn-big" value="Create"
                        onClick={async () => {
                          const name = newGroupName.trim();
                          if (!name) return;
                          const r = await fetch("/api/font-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                          if (r.ok) { setNewGroupName(""); setGroupMsg({ id: "new", msg: "Group created!", ok: true }); await loadGroups(); }
                          else setGroupMsg({ id: "new", msg: "Failed to create group.", ok: false });
                        }}
                      />
                    </div>
                    {groupMsg?.id === "new" && (
                      <div style={{ color: groupMsg.ok ? "#55ff55" : "#ff5555", marginTop: "4px" }}>{groupMsg.msg}</div>
                    )}
                  </div>

                  {/* Existing groups */}
                  {groups.length === 0 && <div style={{ color: "#555" }}>No groups yet.</div>}
                  {groups.map(g => (
                    <div key={g.id} style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #222" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className="white" style={{ fontWeight: "bold" }}>{g.name}</span>
                        <span style={{ color: "#555" }}>{g.is_owner ? "(owner)" : "(member)"}</span>
                        {g.is_owner && (
                          <input type="button" className="btn-big" value="Delete group"
                            style={{ marginLeft: "auto" }}
                            onClick={async () => {
                              if (!confirm(`Delete group "${g.name}"?`)) return;
                              await fetch(`/api/font-groups/${g.id}`, { method: "DELETE" });
                              await loadGroups();
                              if (font.group_id === g.id) setFont(f => ({ ...f, group_id: null }));
                            }}
                          />
                        )}
                        {!g.is_owner && (
                          <input type="button" className="btn-big" value="Leave"
                            style={{ marginLeft: "auto" }}
                            onClick={async () => {
                              await fetch(`/api/font-groups/${g.id}/members/${userId}`, { method: "DELETE" });
                              await loadGroups();
                            }}
                          />
                        )}
                      </div>

                      {/* Member list */}
                      <div style={{ paddingLeft: "8px", marginBottom: "6px" }}>
                        {g.members.length === 0
                          ? <div style={{ color: "#555" }}>No members yet.</div>
                          : g.members.map(m => (
                            <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                              <a href={`/member/${m.nick}`} style={{ color: "#aaa" }}>{m.nick}</a>
                              {g.is_owner && (
                                <input type="button" className="btn-big" value="Remove"
                                  onClick={async () => {
                                    await fetch(`/api/font-groups/${g.id}/members/${m.user_id}`, { method: "DELETE" });
                                    await loadGroups();
                                  }}
                                />
                              )}
                            </div>
                          ))}
                      </div>

                      {/* Invite (owner only) */}
                      {g.is_owner && (
                        <div style={{ display: "flex", gap: "8px", paddingLeft: "8px" }}>
                          <input type="text" className="form-control" style={{ maxWidth: "200px" }}
                            placeholder="Invite by nick..."
                            value={inviteNick[g.id] ?? ""}
                            onChange={e => setInviteNick(n => ({ ...n, [g.id]: e.target.value }))}
                            onKeyDown={async e => {
                              if (e.key !== "Enter") return;
                              const nick = (inviteNick[g.id] ?? "").trim();
                              if (!nick) return;
                              const r = await fetch(`/api/font-groups/${g.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nick }) });
                              if (r.ok) { setInviteNick(n => ({ ...n, [g.id]: "" })); setGroupMsg({ id: g.id, msg: `${nick} added!`, ok: true }); await loadGroups(); }
                              else { const err = await r.json() as { error?: string }; setGroupMsg({ id: g.id, msg: err.error ?? "Failed.", ok: false }); }
                            }}
                          />
                          <input type="button" className="btn-big" value="Invite"
                            onClick={async () => {
                              const nick = (inviteNick[g.id] ?? "").trim();
                              if (!nick) return;
                              const r = await fetch(`/api/font-groups/${g.id}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nick }) });
                              if (r.ok) { setInviteNick(n => ({ ...n, [g.id]: "" })); setGroupMsg({ id: g.id, msg: `${nick} added!`, ok: true }); await loadGroups(); }
                              else { const err = await r.json() as { error?: string }; setGroupMsg({ id: g.id, msg: err.error ?? "Failed.", ok: false }); }
                            }}
                          />
                          {groupMsg?.id === g.id && (
                            <span style={{ color: groupMsg.ok ? "#55ff55" : "#ff5555", alignSelf: "center" }}>{groupMsg.msg}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="modal-footer" style={{ background: "#222" }}>
                  <input type="button" className="btn-big" value="Close" onClick={() => setShowGroups(false)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Import modal ── */}
        {showImport && (
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header" style={{ background: "#333" }}>
                  <span className="modal-title white" style={{ fontWeight: "bold" }}>Import FIGFont Data</span>
                  <button type="button" className="close white" onClick={() => setShowImport(false)}>x</button>
                </div>
                <div className="modal-body" style={{ background: "#222" }}>
                  <textarea className="fig-data-txt fig-font"
                    style={{ background: "#111", color: "#0ff", border: "1px solid #444", width: "100%", height: "200px" }}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Paste .flf file contents here..." />
                  <p style={{ color: "#aaa", marginTop: "8px" }}>
                    Copy the contents of a *.flf file and paste above, then press Import.
                  </p>
                </div>
                <div className="modal-footer" style={{ background: "#222" }}>
                  <input type="button" className="btn-big" value="Import" onClick={doImport} />
                  <input type="button" className="btn-big" value="Cancel" onClick={() => setShowImport(false)} />
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
                  <span className="modal-title white" style={{ fontWeight: "bold" }}>Exported FIGFont Data</span>
                  <button type="button" className="close white" onClick={() => setShowExport(false)}>x</button>
                </div>
                <div className="modal-body" style={{ background: "#222" }}>
                  <textarea className="fig-data-txt fig-font"
                    style={{ background: "#111", color: "#0ff", border: "1px solid #444", width: "100%", height: "200px" }}
                    readOnly value={exportText}
                    onClick={e => (e.target as HTMLTextAreaElement).select()} />
                  <p style={{ color: "#aaa", marginTop: "8px" }}>
                    Copy the text above into a *.flf file for use with FIGlet.
                  </p>
                </div>
                <div className="modal-footer" style={{ background: "#222" }}>
                  <input type="button" className="btn-big" value={copied ? "Copied!" : "Copy All"} onClick={() => {
                    navigator.clipboard.writeText(exportText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
                  }} />
                  <input type="button" className="btn-big" value="Close" onClick={() => setShowExport(false)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
