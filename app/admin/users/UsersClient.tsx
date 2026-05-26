"use client";

import { useState } from "react";
import Link from "next/link";

interface User { id: number; nick: string; nickurl: string; rank: string | null; crew: string | null; mail: string | null }

const RANKS = ["", "Inactive", "Member", "Senior Member", "Uploader", "Admin"];

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>;
}

export default function UsersClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<User>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (user: User) => {
    const e = edits[user.id] ?? {};
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, rank: e.rank ?? user.rank ?? "", crew: e.crew ?? user.crew ?? "" }) });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this user account permanently?")) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setResults(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">USERS</h2>
        </div>
      </div>
      <div style={{ marginBottom: "8px", fontSize: "13px" }}>
        <Link href="/admin/users/inactive" className="lightgrey" style={{ borderBottom: "1px solid #444" }}>
          View inactive accounts
        </Link>
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
            <div className="col-3">NICK</div><div className="col-2">RANK</div>
            <div className="col-3">CREW</div><div className="col-2">EMAIL</div><div className="col-2">ACTIONS</div>
          </div>
          {results.map(u => {
            const e = edits[u.id] ?? {};
            return (
              <div key={u.id} className="row" style={{ marginBottom: "4px", fontSize: "13px" }}>
                <div className="col-3 text-truncate"><Link className="magenta" href={`/member/${u.nickurl}`}>{u.nick}</Link></div>
                <div className="col-2">
                  <select className="form-select" value={e.rank ?? u.rank ?? ""} onChange={ev => edit(u.id, "rank", ev.target.value)}>
                    {RANKS.map(r => <option key={r} value={r}>{r || "(none)"}</option>)}
                  </select>
                </div>
                <div className="col-3"><input type="text" className="form-control" value={e.crew ?? u.crew ?? ""} onChange={ev => edit(u.id, "crew", ev.target.value)} placeholder="Crew" /></div>
                <div className="col-2 lightgrey text-truncate" style={{ fontSize: "11px", paddingTop: "6px" }}>{u.mail ?? ""}</div>
                <div className="col-2" style={{ display: "flex", gap: "4px" }}>
                  <input type="button" className="btn-big" value="Save" onClick={() => save(u)} />
                  <input type="button" className="btn-big" value="Del" style={{ color: "#ff5555" }} onClick={() => del(u.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
