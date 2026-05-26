"use client";

import { useState } from "react";
import Link from "next/link";

interface Crew { id: number; name: string; crewurl: string; acronym: string | null; active: string | null; www: string | null }

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>;
}

export default function CrewsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Crew[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Crew>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/crews?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (c: Crew) => {
    const e = edits[c.id] ?? {};
    await fetch("/api/admin/crews", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, name: e.name ?? c.name, acronym: e.acronym ?? c.acronym ?? "", active: e.active ?? c.active ?? "", www: e.www ?? c.www ?? "" }) });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete crew?")) return;
    await fetch("/api/admin/crews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setResults(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">CREWS</h2>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input type="text" className="form-control" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()} placeholder="Search by name..." style={{ maxWidth: "320px" }} />
        <input type="button" className="btn-big" value="Search" onClick={search} />
        <Msg msg={msg} />
      </div>
      {results.length > 0 && (
        <div>
          <div className="row" style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
            <div className="col-2">NAME</div><div className="col-2">EDIT NAME</div><div className="col-1">TAG</div>
            <div className="col-2">STATUS</div><div className="col-2">WEBSITE</div><div className="col-3">ACTIONS</div>
          </div>
          {results.map(c => {
            const e = edits[c.id] ?? {};
            return (
              <div key={c.id} className="row" style={{ marginBottom: "4px", fontSize: "13px" }}>
                <div className="col-2 text-truncate"><Link className="magenta" href={`/crew/${c.crewurl}`}>{c.name}</Link></div>
                <div className="col-2"><input type="text" className="form-control" value={e.name ?? c.name} onChange={ev => edit(c.id, "name", ev.target.value)} /></div>
                <div className="col-1"><input type="text" className="form-control" value={e.acronym ?? c.acronym ?? ""} onChange={ev => edit(c.id, "acronym", ev.target.value)} style={{ width: "60px" }} /></div>
                <div className="col-2"><input type="text" className="form-control" value={e.active ?? c.active ?? ""} onChange={ev => edit(c.id, "active", ev.target.value)} placeholder="active/ex" /></div>
                <div className="col-2"><input type="text" className="form-control" value={e.www ?? c.www ?? ""} onChange={ev => edit(c.id, "www", ev.target.value)} placeholder="Website" /></div>
                <div className="col-3" style={{ display: "flex", gap: "4px" }}>
                  <input type="button" className="btn-big" value="Save" onClick={() => save(c)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
