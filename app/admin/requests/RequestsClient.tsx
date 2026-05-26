"use client";

import { useState } from "react";
import Link from "next/link";

interface Req { id: number; title: string | null; user: string | null; time: string | null; status: number | null }

export default function RequestsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Req[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/requests?filter=${encodeURIComponent(query)}&pagesize=30&viewmode=4`).then(r => r.json()).catch(() => []);
    setResults(rows);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this request and all its comments?")) return;
    await fetch(`/api/requests/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
    setResults(prev => prev.filter(r => r.id !== id));
    flash("Deleted.", true);
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">REQUESTS</h2>
        </div>
      </div>
      <div style={{ marginBottom: "8px" }}>
        <Link href="/requests"><input type="button" className="btn-big" value="Browse All Requests" readOnly /></Link>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input type="text" className="form-control" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()} placeholder="Search by title, user..." style={{ maxWidth: "320px" }} />
        <input type="button" className="btn-big" value="Search" onClick={search} />
        {msg && <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>}
      </div>
      {results.length > 0 && (
        <div>
          <div className="row" style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
            <div className="col-5">TITLE</div><div className="col-3">USER</div>
            <div className="col-2">DATE</div><div className="col-2">ACTIONS</div>
          </div>
          {results.map(r => (
            <div key={r.id} className="row" style={{ marginBottom: "4px", fontSize: "13px" }}>
              <div className="col-5 text-truncate"><Link className="magenta" href={`/requests/${r.id}`}>{r.title}</Link></div>
              <div className="col-3 lightgrey">{r.user ?? ""}</div>
              <div className="col-2 lightgrey">{r.time ?? ""}</div>
              <div className="col-2">
                <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(r.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
