"use client";

import { useState } from "react";
import Link from "next/link";

interface InactiveUser {
  id: number;
  nick: string;
  nickurl: string;
  rank: string | null;
  joined: string | null;
  lastactive: number | null;
  uploaded: number;
  comment_count: number;
}

function formatDate(ts: number | null): string {
  if (!ts) return "never";
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export default function InactiveClient() {
  const [years, setYears] = useState(2);
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    const rows = await fetch(`/api/admin/users/inactive?years=${years}`).then(r => r.json()).catch(() => []);
    setUsers(Array.isArray(rows) ? rows : []);
    setLoading(false);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(users.map(u => u.id)) : new Set());
  };

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} account(s) permanently?`)) return;
    const ids = [...selected];
    await fetch("/api/admin/users/inactive", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setUsers(prev => prev.filter(u => !selected.has(u.id)));
    setSelected(new Set());
    flash(`Deleted ${ids.length} account(s).`, true);
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">INACTIVE ACCOUNTS</h2>
        </div>
      </div>

      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span className="lightgrey" style={{ fontSize: "13px" }}>No activity in the last</span>
        <select
          className="form-select"
          value={years}
          onChange={e => setYears(parseInt(e.target.value))}
          style={{ width: "80px", fontSize: "13px" }}
        >
          {[1, 2, 3, 5, 10].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="lightgrey" style={{ fontSize: "13px" }}>year(s)</span>
        <input type="button" className="btn-big" value={loading ? "Loading..." : "Load"} onClick={load} disabled={loading} />
        {msg && <span style={{ color: msg.ok ? "#55ff55" : "#ff5555", fontSize: "13px" }}>{msg.text}</span>}
      </div>

      {users.length > 0 && (
        <div>
          <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="lightgrey" style={{ fontSize: "13px" }}>{users.length} accounts found</span>
            {selected.size > 0 && (
              <input
                type="button"
                className="btn-big"
                value={`Delete selected (${selected.size})`}
                style={{ color: "#ff5555" }}
                onClick={deleteSelected}
              />
            )}
          </div>

          <div className="row" style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
            <div className="col-1">
              <input
                type="checkbox"
                onChange={e => toggleAll(e.target.checked)}
                checked={selected.size === users.length && users.length > 0}
              />
            </div>
            <div className="col-2">NICK</div>
            <div className="col-1">RANK</div>
            <div className="col-2">JOINED</div>
            <div className="col-2">LAST ACTIVE</div>
            <div className="col-2">UPLOADS</div>
            <div className="col-2">COMMENTS</div>
          </div>

          {users.map(u => (
            <div key={u.id} className="row" style={{ marginBottom: "2px", fontSize: "13px", alignItems: "center" }}>
              <div className="col-1">
                <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
              </div>
              <div className="col-2 text-truncate">
                <Link className="magenta" href={`/member/${u.nickurl}`}>{u.nick}</Link>
              </div>
              <div className="col-1 lightgrey" style={{ fontSize: "11px" }}>{u.rank ?? ""}</div>
              <div className="col-2 lightgrey" style={{ fontSize: "11px" }}>{u.joined ?? "-"}</div>
              <div className="col-2 lightgrey" style={{ fontSize: "11px" }}>{formatDate(u.lastactive)}</div>
              <div className="col-2 lightgrey" style={{ fontSize: "11px" }}>{u.uploaded}</div>
              <div className="col-2 lightgrey" style={{ fontSize: "11px" }}>{u.comment_count}</div>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && !loading && msg === null && (
        <div className="lightgrey" style={{ fontSize: "13px" }}>Click Load to fetch inactive accounts.</div>
      )}
    </div>
  );
}
