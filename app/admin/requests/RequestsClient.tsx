"use client";

import { useState } from "react";
import ContentLink from "@/components/ui/ContentLink";

interface Req {
  id: number;
  title: string | null;
  user: string | null;
  time: string | null;
  status: number | null;
}

export default function RequestsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Req[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/requests?filter=${encodeURIComponent(query)}&pagesize=30&viewmode=4`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this request and all its comments?")) return;
    await fetch(`/api/requests/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setResults(prev => prev.filter(r => r.id !== id));
    flash("Deleted.", true);
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">REQUESTS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div className="amb-1">
          <ContentLink href="/requests" className="lightgrey">Browse all requests &gt;</ContentLink>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control search-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by title, user..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={search} />
          {msg && (
            <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
              {msg.text}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-5">TITLE</div>
              <div className="col-3">USER</div>
              <div className="col-2">DATE</div>
              <div className="col-2">ACTIONS</div>
            </div>
            {results.map(r => (
              <div key={r.id} className="row amb-1 align-items-center">
                <div className="col-5 text-truncate">
                  <ContentLink className="magenta" href={`/requests/${r.id}`}>{r.title}</ContentLink>
                </div>
                <div className="col-3 lightgrey text-truncate">{r.user ?? ""}</div>
                <div className="col-2 lightgrey">{r.time ?? ""}</div>
                <div className="col-2">
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(r.id)} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
