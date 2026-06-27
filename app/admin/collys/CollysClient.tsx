"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  broken?: number;
  broken_comment?: string | null;
}

function splitNames(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
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
    const exact = rows.find((row: Colly) => row.filename.toLowerCase() === trimmed.toLowerCase());
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
    await fetch("/api/admin/collys", {
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
      }),
    });
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
    if (!selected) { setDizContent(""); return; }
    fetch(`/api/admin/collys/diz?filename=${encodeURIComponent(selected.filename)}`)
      .then(r => r.json())
      .then(d => setDizContent(d.content ?? ""))
      .catch(() => setDizContent(""));
  }, [selected]);

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
              <div className="col-3 lightgrey">FILENAME</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.filename ?? selected.filename} onChange={e => edit(selected.id, "filename", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">NAME</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.name ?? selected.name ?? ""} onChange={e => edit(selected.id, "name", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">RELEASE DATE</div>
              <div className="col-9">
                <input
                  type="date"
                  className="form-control w-100 date-dos"
                  value={(() => {
                    const y = edits[selected.id]?.year ?? selected.year;
                    const m = edits[selected.id]?.month ?? selected.month;
                    const d = edits[selected.id]?.day ?? selected.day;
                    if (!y || !m || !d) return "";
                    return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  })()}
                  onChange={e => {
                    const v = e.target.value;
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
              <div className="col-3 lightgrey">TYPE</div>
              <div className="col-9">
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
              <div className="col-3 lightgrey">FILE ID</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.file_id ?? selected.file_id ?? ""} onChange={e => edit(selected.id, "file_id", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1">
              <div className="col-3 lightgrey">FILE_ID.DIZ</div>
              <div className="col-9">
                <textarea
                  className="form-control"
                  rows={15}
                  cols={45}
                  style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "1", whiteSpace: "pre", overflowWrap: "normal" }}
                  value={dizContent}
                  onChange={e => setDizContent(e.target.value)}
                />
                <div style={{ marginTop: "4px" }}>
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
                </div>
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">BROKEN</div>
              <div className="col-9">
                <select className="form-select w-100" value={edits[selected.id]?.broken ?? selected.broken ?? 0} onChange={e => edit(selected.id, "broken", parseInt(e.target.value))}>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">BROKEN NOTE</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.broken_comment ?? selected.broken_comment ?? ""} onChange={e => edit(selected.id, "broken_comment", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">ARTISTS</div>
              <div className="col-9">
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
              <div className="col-3 lightgrey">CREWS</div>
              <div className="col-9">
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
            <div className="row amb-1">
              <div className="col-3" />
              <div className="col-9" style={{ display: "flex", gap: "8px" }}>
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
