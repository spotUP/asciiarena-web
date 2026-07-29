"use client";

import { useState } from "react";
import Link from "next/link";
import ContentLink from "@/components/ui/ContentLink";
import DosSelect from "@/components/ui/DosSelect";
// Single source of truth for the rank ladder, shared with the forum's gates.
import { RANKS } from "@/lib/accountRules";

interface User {
  id: number;
  nick: string;
  nickurl: string;
  rank: string | null;
  crew: string | null;
  mail: string | null;
}


function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
  );
}

export default function UsersClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<User>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (user: User) => {
    const e = edits[user.id] ?? {};
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        rank: e.rank ?? user.rank ?? "",
        crew: e.crew ?? user.crew ?? "",
      }),
    });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this user account permanently?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResults(prev => prev.filter(u => u.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">USERS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div className="amb-1">
          <Link href="/admin/users/inactive" className="lightgrey">
            View inactive accounts &gt;
          </Link>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by nick..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={search} />
          <Msg msg={msg} />
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-3">NICK</div>
              <div className="col-2">RANK</div>
              <div className="col-3">CREW</div>
              <div className="col-2">EMAIL</div>
              <div className="col-2">ACTIONS</div>
            </div>
            {results.map(u => {
              const e = edits[u.id] ?? {};
              return (
                <div key={u.id} className="row amb-1 align-items-center">
                  <div className="col-3 text-truncate">
                    <ContentLink className="magenta" href={`/member/${u.nickurl}`}>{u.nick}</ContentLink>
                  </div>
                  <div className="col-2">
                    <DosSelect
                      width={160}
                      value={e.rank ?? u.rank ?? ""}
                      options={RANKS.map(r => ({ value: r, label: r || "(none)" }))}
                      onChange={v => edit(u.id, "rank", v)}
                    />
                  </div>
                  <div className="col-3">
                    <input
                      type="text"
                      className="form-control w-100"
                      value={e.crew ?? u.crew ?? ""}
                      onChange={ev => edit(u.id, "crew", ev.target.value)}
                      placeholder="Crew"
                    />
                  </div>
                  <div className="col-2 lightgrey text-truncate">{u.mail ?? ""}</div>
                  <div className="col-2" style={{ display: "flex", gap: "8px" }}>
                    <input type="button" className="btn-big" value="Save" onClick={() => save(u)} />
                    <input type="button" className="btn-big" value="Del" style={{ color: "#ff5555" }} onClick={() => del(u.id)} />
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
