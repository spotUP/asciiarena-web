"use client";

import { useState } from "react";
import Link from "next/link";

interface Artist { id: number; nick: string; artisturl: string; active: string | null; country: string | null; www: string | null }

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>;
}

export default function ArtistsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Artist>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/artists?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (a: Artist) => {
    const e = edits[a.id] ?? {};
    await fetch("/api/admin/artists", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, active: e.active ?? a.active ?? "", country: e.country ?? a.country ?? "", www: e.www ?? a.www ?? "" }) });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete artist and all crew memberships?")) return;
    await fetch("/api/admin/artists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setResults(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">ARTISTS</h2>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input type="text" className="form-control" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()} placeholder="Search by nick..." style={{ maxWidth: "320px" }} />
        <input type="button" className="btn-big" value="Search" onClick={search} />
        <Msg msg={msg} />
      </div>
      {results.length > 0 && (
        <div>
          <div className="row" style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
            <div className="col-2">NICK</div><div className="col-2">STATUS</div>
            <div className="col-2">COUNTRY</div><div className="col-3">WEBSITE</div><div className="col-3">ACTIONS</div>
          </div>
          {results.map(a => {
            const e = edits[a.id] ?? {};
            return (
              <div key={a.id} className="row" style={{ marginBottom: "4px", fontSize: "13px" }}>
                <div className="col-2 text-truncate"><Link className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</Link></div>
                <div className="col-2"><input type="text" className="form-control" value={e.active ?? a.active ?? ""} onChange={ev => edit(a.id, "active", ev.target.value)} placeholder="active/ex-member" /></div>
                <div className="col-2"><input type="text" className="form-control" value={e.country ?? a.country ?? ""} onChange={ev => edit(a.id, "country", ev.target.value)} placeholder="Country" /></div>
                <div className="col-3"><input type="text" className="form-control" value={e.www ?? a.www ?? ""} onChange={ev => edit(a.id, "www", ev.target.value)} placeholder="Website" /></div>
                <div className="col-3" style={{ display: "flex", gap: "4px" }}>
                  <input type="button" className="btn-big" value="Save" onClick={() => save(a)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(a.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
