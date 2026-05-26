"use client";

import { useState } from "react";
import Link from "next/link";

interface Item { id: number; filename: string; name: string | null; author: string | null; year: number | null }

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>;
}

function Section({ label, listApi, adminApi, detailPath }: { label: string; listApi: string; adminApi: string; detailPath: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Item>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const search = async () => {
    if (!query.trim()) return;
    const rows = await fetch(`${listApi}?filter=${encodeURIComponent(query)}&pagesize=30`).then(r => r.json()).catch(() => []);
    setResults(rows);
    setEdits({});
  };

  const edit = (id: number, field: string, value: string | number | null) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (item: Item) => {
    const e = edits[item.id] ?? {};
    await fetch(adminApi, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, name: e.name ?? item.name, author: e.author ?? item.author, year: e.year ?? item.year }) });
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(adminApi, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setResults(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">{label}</h2>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input type="text" className="form-control" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()} placeholder="Search by name or filename..." style={{ maxWidth: "320px" }} />
        <input type="button" className="btn-big" value="Search" onClick={search} />
        <Msg msg={msg} />
      </div>
      {results.length > 0 && (
        <div>
          <div className="row" style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
            <div className="col-2">FILENAME</div><div className="col-3">NAME</div>
            <div className="col-2">AUTHOR</div><div className="col-1">YEAR</div><div className="col-4">ACTIONS</div>
          </div>
          {results.map(item => {
            const e = edits[item.id] ?? {};
            return (
              <div key={item.id} className="row" style={{ marginBottom: "4px", fontSize: "13px" }}>
                <div className="col-2 text-truncate"><Link className="magenta" href={`${detailPath}/${item.filename}`}>{item.filename}</Link></div>
                <div className="col-3"><input type="text" className="form-control" value={e.name ?? item.name ?? ""} onChange={ev => edit(item.id, "name", ev.target.value)} /></div>
                <div className="col-2"><input type="text" className="form-control" value={e.author ?? item.author ?? ""} onChange={ev => edit(item.id, "author", ev.target.value)} /></div>
                <div className="col-1"><input type="number" className="form-control" value={e.year ?? item.year ?? ""} onChange={ev => edit(item.id, "year", parseInt(ev.target.value) || null)} style={{ width: "70px" }} /></div>
                <div className="col-4" style={{ display: "flex", gap: "4px" }}>
                  <input type="button" className="btn-big" value="Save" onClick={() => save(item)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(item.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ContentClient() {
  return (
    <div>
      <Section label="APPLICATIONS" listApi="/api/apps" adminApi="/api/admin/apps" detailPath="/application" />
      <Section label="MAGAZINES" listApi="/api/mags" adminApi="/api/admin/mags" detailPath="/magazine" />
    </div>
  );
}
