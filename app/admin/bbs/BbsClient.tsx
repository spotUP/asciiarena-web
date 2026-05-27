"use client";

import { useState } from "react";

interface Bbs {
  id: number;
  name: string | null;
  sysop: string | null;
  address: string | null;
  software: string | null;
  online: number | null;
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
  );
}

export default function BbsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bbs[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Bbs>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/bbs?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (b: Bbs) => {
    const e = edits[b.id] ?? {};
    await fetch("/api/admin/bbs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: b.id,
        sysop: e.sysop ?? b.sysop ?? "",
        address: e.address ?? b.address ?? "",
        software: e.software ?? b.software ?? "",
      }),
    });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this BBS?")) return;
    await fetch("/api/admin/bbs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResults(prev => prev.filter(b => b.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">BBS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by name or sysop..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={search} />
          <Msg msg={msg} />
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-2">NAME</div>
              <div className="col-2">SYSOP</div>
              <div className="col-3">ADDRESS</div>
              <div className="col-2">SOFTWARE</div>
              <div className="col-3">ACTIONS</div>
            </div>
            {results.map(b => {
              const e = edits[b.id] ?? {};
              return (
                <div key={b.id} className="row amb-1 align-items-center">
                  <div className="col-2 text-truncate white">{b.name}</div>
                  <div className="col-2">
                    <input type="text" className="form-control w-100" value={e.sysop ?? b.sysop ?? ""} onChange={ev => edit(b.id, "sysop", ev.target.value)} />
                  </div>
                  <div className="col-3">
                    <input type="text" className="form-control w-100" value={e.address ?? b.address ?? ""} onChange={ev => edit(b.id, "address", ev.target.value)} />
                  </div>
                  <div className="col-2">
                    <input type="text" className="form-control w-100" value={e.software ?? b.software ?? ""} onChange={ev => edit(b.id, "software", ev.target.value)} />
                  </div>
                  <div className="col-3" style={{ display: "flex", gap: "8px" }}>
                    <input type="button" className="btn-big" value="Save" onClick={() => save(b)} />
                    <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(b.id)} />
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
