"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Colly {
  id: number;
  filename: string;
  name: string | null;
  year: number | null;
  type: string | null;
  broken?: number;
  broken_comment?: string | null;
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
  );
}

export default function CollysClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Colly[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<Colly>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
        name: e.name ?? colly.name,
        year: e.year ?? colly.year,
        type: e.type ?? colly.type,
      }),
    });
    flash("Saved!", true);
    setResults(prev => prev.map(row => row.id === colly.id ? {
      ...row,
      name: e.name ?? colly.name,
      year: e.year ?? colly.year,
      type: e.type ?? colly.type,
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
              <div className="col-1">YEAR</div>
              <div className="col-1">TYPE</div>
              <div className="col-3">ACTIONS</div>
            </div>
            {results.map(c => (
              <div key={c.id} className="row amb-1 align-items-center">
                <div className="col-3 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>{c.filename}</Link>
                </div>
                <div className="col-4 text-truncate lightgrey">{c.name ?? ""}</div>
                <div className="col-1 lightgrey">{c.year ?? ""}</div>
                <div className="col-1 lightgrey">{c.type ?? ""}</div>
                <div className="col-3" style={{ display: "flex", gap: "8px" }}>
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
                <Link className="magenta" href={`/release/${selected.filename}`}>{selected.filename}</Link>
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">NAME</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.name ?? selected.name ?? ""} onChange={e => edit(selected.id, "name", e.target.value)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">YEAR</div>
              <div className="col-9">
                <input type="number" className="form-control w-100" value={edits[selected.id]?.year ?? selected.year ?? ""} onChange={e => edit(selected.id, "year", parseInt(e.target.value) || null)} />
              </div>
            </div>
            <div className="row amb-1 align-items-center">
              <div className="col-3 lightgrey">TYPE</div>
              <div className="col-9">
                <input type="text" className="form-control w-100" value={edits[selected.id]?.type ?? selected.type ?? ""} onChange={e => edit(selected.id, "type", e.target.value)} />
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
