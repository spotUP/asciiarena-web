"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { convertPcbColors, hasPcbCodes } from "@/lib/pcbColors";
import { convertAnsiCodes, hasAnsiCodes, escapeHtmlText } from "@/lib/releaseText";
import Cp437DizPreview from "@/components/release/Cp437DizPreview";
import DatePicker from "@/components/ui/DatePicker";
import DosSelect from "@/components/ui/DosSelect";
import ColorSwatch from "@/components/ui/ColorSwatch";
import SoundtrackPicker from "@/components/music/SoundtrackPicker";
import CollyPreview, { type PreviewReport, type LogoEntry } from "@/components/submit/CollyPreview";
import { FONTS } from "@/lib/ansilove";
import { COLLY_TYPES } from "@/lib/collyType";

interface Colly {
  id: number;
  filename: string;
  name: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  type: string | null;
  file_id: string | null;
  artists: string | null;
  crews: string | null;
  // Nullable in the DB (and in the API's GET rows) — the editor echoes these
  // back verbatim on save, so the types have to admit null or the PATCH
  // contract and the client drift apart again.
  broken?: number | null;
  broken_comment?: string | null;
  render_font?: string | null;
  render_fg?: string | null;
  render_bg?: string | null;
  soundtrack?: string | null;
}

function splitNames(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  // Fixed floating toast so it is visible no matter where the page is
  // scrolled — the Save buttons sit far below the top of the list.
  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
        padding: "8px 16px",
        backgroundColor: "#111111",
        border: `1px solid ${msg.ok ? "#55ff55" : "#ff5555"}`,
      }}
    >
      <span className={msg.ok ? "green" : "red"}>{msg.text}</span>
    </div>
  );
}

interface NameOption { id: number; name?: string; nick?: string }

function NamePicker({ label, names, onAdd, onRemove }: {
  label: string;
  names: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [options, setOptions] = useState<NameOption[]>([]);
  const [pick, setPick] = useState("");

  useEffect(() => {
    const ep = label === "artist" ? "/api/admin/artists?q=*" : "/api/admin/crews?q=*";
    fetch(ep).then(r => r.json()).then(setOptions).catch(() => setOptions([]));
  }, [label]);

  const displayName = (o: NameOption) => o.nick ?? o.name ?? "";

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
        {names.map(n => (
          <span key={n} style={{
            background: "#333", padding: "2px 8px", display: "inline-flex",
            alignItems: "center", gap: "6px"
          }}>
            {n}
            <span onClick={() => onRemove(n)} style={{ cursor: "pointer", color: "#ff5555" }}>x</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <select className="form-select w-100" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Select {label}...</option>
          {options.filter(o => !names.includes(displayName(o))).map(o => (
            <option key={o.id} value={displayName(o)}>{displayName(o)}</option>
          ))}
        </select>
        <input type="button" className="btn-big" value="Add" onClick={() => { if (pick) { onAdd(pick); setPick(""); } }} />
      </div>
    </div>
  );
}

export default function CollysClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Colly[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<Colly>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [dizContent, setDizContent] = useState("");
  const [dizCp437, setDizCp437] = useState(false);
  const [dizB64, setDizB64] = useState<string | null>(null);
  const [showDizPreview, setShowDizPreview] = useState(false);
  // Logo-map editor: the preview report (art + detection) and the editable map,
  // both keyed to the selected colly. Loaded lazily when the editor is opened.
  const [report, setReport] = useState<PreviewReport | null>(null);
  const [logoMap, setLogoMap] = useState<LogoEntry[]>([]);
  // True once the admin actually edits the logo map (vs. it just being seeded
  // from a rescan). Only a dirty map is persisted on save, so opening a colly
  // and saving metadata never freezes auto-detection into hand-picked rows.
  const logosDirty = useRef(false);
  const editLogoMap = useCallback((v: React.SetStateAction<LogoEntry[]>) => {
    logosDirty.current = true;
    setLogoMap(v);
  }, []);
  const [showMapEditor, setShowMapEditor] = useState(false);
  // All artist names, for the logo editor's filterable author picker.
  const [artistNames, setArtistNames] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/admin/artists?q=*").then(r => r.json())
      .then((os: NameOption[]) => setArtistNames(os.map(o => o.nick ?? o.name ?? "").filter(Boolean)))
      .catch(() => setArtistNames([]));
  }, []);

  const dizPreviewHtml = useMemo(() => {
    if (!dizContent) return { html: "", hasPcb: false, hasAnsi: false };
    const escaped = escapeHtmlText(dizContent);
    let html = escaped;
    const hasAnsi = hasAnsiCodes(html);
    if (hasAnsi) html = convertAnsiCodes(html);
    const hasPcb = hasPcbCodes(html);
    if (hasPcb) html = convertPcbColors(html);
    return { html, hasPcb, hasAnsi };
  }, [dizContent]);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const searchFor = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const rows = await fetch(`/api/admin/collys?q=${encodeURIComponent(trimmed)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
    const exact = rows.find((row: Colly) => row.filename.trim().toLowerCase() === trimmed.toLowerCase());
    setSelectedId(exact?.id ?? null);
  }, []);

  useEffect(() => {
    const initialQuery = searchParams.get("q")?.trim() ?? "";
    if (!initialQuery) return;
    setQuery(initialQuery);
    void searchFor(initialQuery);
  }, [searchFor, searchParams]);

  const search = async () => {
    await searchFor(query);
  };

  const edit = (id: number, field: string, value: string | number | null) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (colly: Colly) => {
    const e = edits[colly.id] ?? {};
    let res: Response;
    try {
      res = await fetch("/api/admin/collys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: colly.id,
          filename: e.filename ?? colly.filename,
          name: e.name ?? colly.name,
          year: e.year ?? colly.year,
          month: e.month ?? colly.month,
          day: e.day ?? colly.day,
          type: e.type ?? colly.type,
          file_id: e.file_id ?? colly.file_id,
          broken: e.broken ?? colly.broken,
          broken_comment: e.broken_comment ?? colly.broken_comment,
          artistNames: splitNames((e.artists ?? colly.artists) as string | null),
          crewNames: splitNames((e.crews ?? colly.crews) as string | null),
          render_font: (e.render_font ?? colly.render_font) || "",
          render_fg: (e.render_fg ?? colly.render_fg) || "",
          render_bg: (e.render_bg ?? colly.render_bg) || "",
          soundtrack: (e.soundtrack ?? colly.soundtrack) || "",
          // Only send the map when the editor was actually opened/loaded —
          // otherwise leave the colly's existing catalog rows untouched.
          // Only persist the map when the admin actually edited logos, so a
          // metadata-only save leaves the auto-detected catalog untouched.
          ...(logosDirty.current
            ? { logos: logoMap.map(l => ({ line: l.line, end: l.end, caption: l.caption })) }
            : {}),
        }),
      });
    } catch {
      flash("Save failed — network error", false);
      return;
    }
    if (!res.ok) {
      flash(`Save failed (${res.status})`, false);
      return;
    }
    flash("Saved!", true);
    setResults(prev => prev.map(row => row.id === colly.id ? {
      ...row,
      filename: e.filename ?? colly.filename,
      name: e.name ?? colly.name,
      year: e.year ?? colly.year,
      month: e.month ?? colly.month,
      day: e.day ?? colly.day,
      type: e.type ?? colly.type,
      file_id: e.file_id ?? colly.file_id,
      broken: e.broken ?? colly.broken,
      broken_comment: e.broken_comment ?? colly.broken_comment,
      artists: (e.artists ?? colly.artists) as string | null,
      crews: (e.crews ?? colly.crews) as string | null,
      render_font: (e.render_font ?? colly.render_font) || null,
      render_fg: (e.render_fg ?? colly.render_fg) || null,
      render_bg: (e.render_bg ?? colly.render_bg) || null,
      soundtrack: (e.soundtrack ?? colly.soundtrack) || null,
    } : row));
  };

  const del = async (id: number) => {
    if (!confirm("Delete this colly permanently? Files will be removed.")) return;
    await fetch("/api/admin/collys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResults(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = selectedId !== null ? results.find(c => c.id === selectedId) ?? null : null;

  // Fetch .diz content when a colly is selected
  useEffect(() => {
    if (!selected) { setDizContent(""); setDizCp437(false); setDizB64(null); return; }
    fetch(`/api/admin/collys/diz?filename=${encodeURIComponent(selected.filename)}`)
      .then(r => r.json())
      .then(d => { setDizContent(d.content ?? ""); setDizCp437(!!d.cp437); setDizB64(d.b64 ?? null); })
      .catch(() => { setDizContent(""); setDizCp437(false); setDizB64(null); });
  }, [selected]);

  // Auto-open the logo editor for the newly-selected colly (parity with the
  // submit page, where the preview shows automatically). Still collapsible.
  useEffect(() => { setShowMapEditor(true); setReport(null); setLogoMap([]); logosDirty.current = false; }, [selectedId]);

  // Lazily load the preview report + the colly's saved manual map when the
  // admin opens the visual editor (parity with the submit-time editor).
  useEffect(() => {
    if (!showMapEditor || !selected || report) return;
    const fn = selected.filename;
    const id = selected.id;
    Promise.all([
      fetch(`/api/collys/preview?filename=${encodeURIComponent(fn)}`).then(r => r.json()),
      fetch(`/api/admin/collys?logos=${id}`).then(r => r.json()),
    ])
      .then(([rep, map]: [PreviewReport, { line: number; end?: number; caption: string }[]]) => {
        setReport(rep);
        // Hand-picked (saved manual) logos — kept verbatim, never overwritten.
        const manual: LogoEntry[] = (Array.isArray(map) ? map : []).map(m => ({ line: m.line, end: m.end, caption: m.caption, auto: false }));
        // Rescan: seed auto-detected regions too, but only where they don't
        // overlap a hand-picked entry (ANSI/CP437 rows can't map to text lines,
        // so no auto-bands there — matches the submit flow).
        const isCanvas = rep.type === "ANSI" || rep.type === "CP437";
        const overlapsManual = (a: { line: number; end?: number }) =>
          manual.some(m => a.line <= (m.end ?? m.line) && (a.end ?? a.line) >= m.line);
        const auto: LogoEntry[] = isCanvas ? [] : (rep.logos ?? [])
          .map(l => ({
            line: l.line,
            end: l.end,
            caption: l.searchable ? (l.author ? `${l.name} -${l.author}` : l.name) : "",
            auto: true,
          }))
          .filter(a => !overlapsManual(a));
        setLogoMap([...manual, ...auto].sort((x, y) => x.line - y.line));
        logosDirty.current = false; // seeding is not an edit
      })
      .catch(() => { setReport(null); setLogoMap([]); flash("Could not load logo editor", false); });
  }, [showMapEditor, selected, report]);

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">COLLYS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by name or filename..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={search} />
          <Msg msg={msg} />
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-3">FILENAME</div>
              <div className="col-4">NAME</div>
              <div className="col-2">DATE</div>
              <div className="col-1">TYPE</div>
              <div className="col-2">ACTIONS</div>
            </div>
            {results.map(c => (
              <div key={c.id} className="row amb-1 align-items-center">
                <div className="col-3 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>{c.filename}</Link>
                </div>
                <div className="col-4 text-truncate lightgrey">{c.name ?? ""}</div>
                <div className="col-2 lightgrey">
                  {[c.year || null, c.month || null, c.day || null].filter(Boolean).join("-")}
                </div>
                <div className="col-1 lightgrey">{c.type ?? ""}</div>
                <div className="col-2" style={{ display: "flex", gap: "8px" }}>
                  <input type="button" className="btn-big" value={selectedId === c.id ? "Selected" : "Edit"} onClick={() => setSelectedId(c.id)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id)} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {selected && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">EDIT COLLY</h2>
          </div>

          <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <div className="row amb-1">
              <div className="col-12 lightgrey amb-1">FILENAME</div>
              <div className="col-12">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.filename ?? selected.filename} onChange={e => edit(selected.id, "filename", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">NAME</div>
              <div className="col-12">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.name ?? selected.name ?? ""} onChange={e => edit(selected.id, "name", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">RELEASE DATE</div>
              <div className="col-12">
                <DatePicker
                  value={(() => {
                    const y = edits[selected.id]?.year ?? selected.year;
                    const m = edits[selected.id]?.month ?? selected.month;
                    const d = edits[selected.id]?.day ?? selected.day;
                    if (!y || !m || !d) return "";
                    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  })()}
                  onChange={v => {
                    if (!v) { edit(selected.id, "year", null); edit(selected.id, "month", null); edit(selected.id, "day", null); return; }
                    const [y, m, d] = v.split("-");
                    edit(selected.id, "year", parseInt(y) || null);
                    edit(selected.id, "month", parseInt(m) || null);
                    edit(selected.id, "day", parseInt(d) || null);
                  }}
                />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">TYPE</div>
              <div className="col-12">
                <select className="form-select w-100" value={edits[selected.id]?.type ?? selected.type ?? ""} onChange={e => edit(selected.id, "type", e.target.value)}>
                  <option value="ASCII">ASCII</option>
                  <option value="ANSI">ANSI</option>
                  <option value="ARCHIVE">ARCHIVE</option>
                  <option value="CP437">CP437</option>
                  <option value="PC">PC</option>
                  <option value="PC ASCII">PC ASCII</option>
                </select>
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">FILE ID</div>
              <div className="col-12">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.file_id ?? selected.file_id ?? ""} onChange={e => edit(selected.id, "file_id", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1">
              <div className="col-12 lightgrey amb-1">
                FILE_ID.DIZ
                {(dizPreviewHtml.hasPcb || dizPreviewHtml.hasAnsi) && (
                  <div style={{ marginTop: "4px" }}>
                    {dizPreviewHtml.hasPcb && <span style={{ background: "#55FFFF", color: "#000", padding: "1px 4px", marginRight: "4px", fontSize: "11px" }}>PCB</span>}
                    {dizPreviewHtml.hasAnsi && <span style={{ background: "#FF55FF", color: "#000", padding: "1px 4px", fontSize: "11px" }}>ANSI</span>}
                  </div>
                )}
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  rows={15}
                  cols={45}
                  style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "1", whiteSpace: "pre", overflowWrap: "normal" }}
                  value={dizContent}
                  onChange={e => setDizContent(e.target.value)}
                />
                <div style={{ marginTop: "4px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="button"
                    className="btn-big"
                    value="Save DIZ"
                    onClick={async () => {
                      await fetch("/api/admin/collys/diz", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: selected.filename, content: dizContent }),
                      });
                      flash("DIZ saved!", true);
                    }}
                  />
                  <input
                    type="button"
                    className="btn-big"
                    value={showDizPreview ? "Hide Preview" : "Preview"}
                    onClick={() => setShowDizPreview(p => !p)}
                  />
                </div>
                {showDizPreview && dizContent && (
                  <div style={{ marginTop: "8px" }}>
                    {dizCp437 && dizB64 ? (
                      // PC/CP437 block art renders gap-free via AnsiLove (matches
                      // the public viewer). Reflects the saved file.
                      <div style={{ background: "#111111", padding: "8px", border: "1px solid #444" }}>
                        <Cp437DizPreview bytesB64={dizB64} />
                      </div>
                    ) : (
                      <pre
                        style={{
                          background: "#111111",
                          color: "#AAAAAA",
                          fontFamily: "TopazPlus_a1200, monospace",
                          fontSize: "16px",
                          lineHeight: "1",
                          whiteSpace: "pre",
                          overflowX: "auto",
                          padding: "8px",
                          border: "1px solid #444",
                        }}
                        dangerouslySetInnerHTML={{ __html: dizPreviewHtml.html }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">BROKEN</div>
              <div className="col-12">
                <select className="form-select w-100" value={edits[selected.id]?.broken ?? selected.broken ?? 0} onChange={e => edit(selected.id, "broken", parseInt(e.target.value))}>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">BROKEN NOTE</div>
              <div className="col-12">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.broken_comment ?? selected.broken_comment ?? ""} onChange={e => edit(selected.id, "broken_comment", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">ARTISTS</div>
              <div className="col-12">
                <NamePicker
                  label="artist"
                  names={splitNames((edits[selected.id]?.artists ?? selected.artists) as string | null)}
                  onAdd={name => {
                    const cur = splitNames((edits[selected.id]?.artists ?? selected.artists) as string | null);
                    if (!cur.includes(name)) edit(selected.id, "artists", [...cur, name].join(", "));
                  }}
                  onRemove={name => {
                    const cur = splitNames((edits[selected.id]?.artists ?? selected.artists) as string | null);
                    edit(selected.id, "artists", cur.filter(n => n !== name).join(", "));
                  }}
                />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-12 lightgrey amb-1">CREWS</div>
              <div className="col-12">
                <NamePicker
                  label="crew"
                  names={splitNames((edits[selected.id]?.crews ?? selected.crews) as string | null)}
                  onAdd={name => {
                    const cur = splitNames((edits[selected.id]?.crews ?? selected.crews) as string | null);
                    if (!cur.includes(name)) edit(selected.id, "crews", [...cur, name].join(", "));
                  }}
                  onRemove={name => {
                    const cur = splitNames((edits[selected.id]?.crews ?? selected.crews) as string | null);
                    edit(selected.id, "crews", cur.filter(n => n !== name).join(", "));
                  }}
                />
              </div>
            </div>
            {(() => {
              const curType = edits[selected.id]?.type ?? selected.type ?? "";
              const font = (edits[selected.id]?.render_font ?? selected.render_font ?? "") as string;
              const fg = (edits[selected.id]?.render_fg ?? selected.render_fg ?? "") as string;
              const bg = (edits[selected.id]?.render_bg ?? selected.render_bg ?? "") as string;
              const soundtrack = (edits[selected.id]?.soundtrack ?? selected.soundtrack ?? "") as string;
              const author = splitNames((edits[selected.id]?.artists ?? selected.artists) as string | null)[0] ?? "";
              return (
                <>
                  {curType !== "ARCHIVE" && (
                    <div className="row amb-1 align-items-center">
                      <div className="col-12 lightgrey amb-1">FONT</div>
                      <div className="col-12">
                        <DosSelect width={240} value={font}
                          options={[{ value: "", label: "Default / viewer choice" }, ...FONTS]}
                          onChange={v => edit(selected.id, "render_font", v)} />
                      </div>
                    </div>
                  )}
                  {(curType === "ASCII" || curType === "CP437") && (
                    <div className="row amb-1 align-items-center">
                      <div className="col-12 lightgrey amb-1">COLOURS</div>
                      <div className="col-12" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <span className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          text <ColorSwatch current={fg || "#ff55ff"} onChange={v => edit(selected.id, "render_fg", v)} />
                        </span>
                        <span className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          background <ColorSwatch current={bg || "#111111"} onChange={v => edit(selected.id, "render_bg", v)} />
                        </span>
                        {(fg || bg) && (
                          <input type="button" className="btn-big" value="Reset colours"
                            onClick={() => { edit(selected.id, "render_fg", ""); edit(selected.id, "render_bg", ""); }} />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="row amb-1 align-items-center">
                    <div className="col-12 lightgrey amb-1">SOUNDTRACK</div>
                    <div className="col-12">
                      <SoundtrackPicker value={soundtrack} onChange={v => edit(selected.id, "soundtrack", v)} />
                    </div>
                  </div>
                  <div className="row amb-1">
                    <div className="col-12 lightgrey amb-1">LOGOS</div>
                    <div className="col-12">
                      <input type="button" className="btn-big" value={showMapEditor ? "Hide logo editor" : "Edit logos"}
                        onClick={() => setShowMapEditor(p => !p)} />
                      {showMapEditor && (
                        report ? (
                          <div className="amt-1">
                            <CollyPreview
                              report={report}
                              type={curType}
                              font={font}
                              fg={fg}
                              bg={bg}
                              logoMap={logoMap}
                              setLogoMap={editLogoMap}
                              defaultAuthor={author}
                              artistOptions={artistNames}
                            />
                          </div>
                        ) : (
                          <div className="lightgrey amt-1">Loading logo editor…</div>
                        )
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
            <div className="row amb-1">
              <div className="col-12" style={{ display: "flex", gap: "8px" }}>
                <input type="button" className="btn-big" value="Save" onClick={() => save(selected)} />
                <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(selected.id)} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
