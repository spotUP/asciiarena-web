"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  const [broken, setBroken] = useState<Colly[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Colly[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Colly>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    fetch("/api/admin/collys?broken=1").then(r => r.json()).then(setBroken).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/collys?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
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
  };

  const del = async (id: number, isBroken = false) => {
    if (!confirm("Delete this colly permanently? Files will be removed.")) return;
    await fetch("/api/admin/collys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (isBroken) setBroken(prev => prev.filter(c => c.id !== id));
    else setResults(prev => prev.filter(c => c.id !== id));
  };

  const markFixed = async (id: number) => {
    await fetch("/api/admin/collys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, broken: 0, broken_comment: null }),
    });
    setBroken(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">
          BROKEN COLLYS{" "}
          {broken.length > 0 && <span className="red">({broken.length})</span>}
        </h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        {broken.length === 0 ? (
          <div className="lightgrey">No broken collys reported.</div>
        ) : (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-4">FILENAME</div>
              <div className="col-4">COMMENT</div>
              <div className="col-4">ACTIONS</div>
            </div>
            {broken.map(c => (
              <div key={c.id} className="row amb-1 align-items-center">
                <div className="col-4 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>{c.filename}</Link>
                </div>
                <div className="col-4 lightgrey text-truncate">{c.broken_comment ?? ""}</div>
                <div className="col-4" style={{ display: "flex", gap: "8px" }}>
                  <input type="button" className="btn-big" value="Mark Fixed" onClick={() => markFixed(c.id)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id, true)} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">SEARCH COLLYS</h2>
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
              <div className="col-3">NAME</div>
              <div className="col-1">YEAR</div>
              <div className="col-1">TYPE</div>
              <div className="col-4">ACTIONS</div>
            </div>
            {results.map(c => {
              const e = edits[c.id] ?? {};
              return (
                <div key={c.id} className="row amb-1 align-items-center">
                  <div className="col-3 text-truncate">
                    <Link className="magenta" href={`/release/${c.filename}`}>{c.filename}</Link>
                  </div>
                  <div className="col-3">
                    <input type="text" className="form-control w-100" value={e.name ?? c.name ?? ""} onChange={e2 => edit(c.id, "name", e2.target.value)} />
                  </div>
                  <div className="col-1">
                    <input type="number" className="form-control w-100" value={e.year ?? c.year ?? ""} onChange={e2 => edit(c.id, "year", parseInt(e2.target.value) || null)} />
                  </div>
                  <div className="col-1">
                    <input type="text" className="form-control w-100" value={e.type ?? c.type ?? ""} onChange={e2 => edit(c.id, "type", e2.target.value)} />
                  </div>
                  <div className="col-4" style={{ display: "flex", gap: "8px" }}>
                    <input type="button" className="btn-big" value="Save" onClick={() => save(c)} />
                    <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id)} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
