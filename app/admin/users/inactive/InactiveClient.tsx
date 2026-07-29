"use client";

import { useState } from "react";
import ContentLink from "@/components/ui/ContentLink";
import DosSelect from "@/components/ui/DosSelect";

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

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    const rows = await fetch(`/api/admin/users/inactive?years=${years}`)
      .then(r => r.json())
      .catch(() => []);
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
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">INACTiVE ACCOUNTS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }} className="amb-1">
          <span className="lightgrey">No activity in the last</span>
          <DosSelect
            width={80}
            value={years.toString()}
            options={[1, 2, 3, 5, 10].map(y => ({ value: y.toString(), label: y.toString() }))}
            onChange={v => setYears(parseInt(v))}
          />
          <span className="lightgrey">year(s)</span>
          <input type="button" className="btn-big" value={loading ? "Loading..." : "Load"} onClick={load} disabled={loading} />
          {msg && <span className={msg.ok ? "green" : "red"}>{msg.text}</span>}
        </div>

        {users.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="amb-1">
              <span className="lightgrey">{users.length} accounts found</span>
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

            <div className="row lightgrey amb-1 align-items-center" style={{ borderBottom: "1px solid #444" }}>
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
              <div key={u.id} className="row amb-1 align-items-center">
                <div className="col-1">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                </div>
                <div className="col-2 text-truncate">
                  <ContentLink className="magenta" href={`/member/${u.nickurl}`}>{u.nick}</ContentLink>
                </div>
                <div className="col-1 lightgrey">{u.rank ?? ""}</div>
                <div className="col-2 lightgrey">{u.joined ?? "-"}</div>
                <div className="col-2 lightgrey">{formatDate(u.lastactive)}</div>
                <div className="col-2 lightgrey">{u.uploaded}</div>
                <div className="col-2 lightgrey">{u.comment_count}</div>
              </div>
            ))}
          </>
        )}

        {users.length === 0 && !loading && msg === null && (
          <div className="lightgrey">Click Load to fetch inactive accounts.</div>
        )}
      </div>
    </>
  );
}
