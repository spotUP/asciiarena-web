"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ACTIVE_STATUSES, normalizeActiveStatus } from "@/lib/activeStatus";

interface Crew {
  id: number;
  name: string;
  crewurl: string;
  acronym: string | null;
  active: string | null;
  www: string | null;
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
  );
}

export default function CrewsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Crew[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Crew>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const searchFor = useCallback(async (term: string) => {
    if (!term.trim()) return;
    const rows = await fetch(`/api/admin/crews?q=${encodeURIComponent(term)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
  }, []);

  const search = () => searchFor(query);

  // "Edit Crew Profile" on /crew/[name] deep-links here with ?q=<crew name>.
  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    if (!initialQuery.trim()) return;
    setQuery(initialQuery);
    void searchFor(initialQuery);
  }, [searchFor]);

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (c: Crew) => {
    const e = edits[c.id] ?? {};
    const name = (e.name ?? c.name).trim();
    if (!name) { flash("Name cannot be empty", false); return; }
    let res: Response;
    try {
      res = await fetch("/api/admin/crews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: c.id,
          name,
          acronym: e.acronym ?? c.acronym ?? "",
          active: e.active ?? c.active ?? "",
          www: e.www ?? c.www ?? "",
        }),
      });
    } catch {
      flash("Save failed — network error", false);
      return;
    }
    if (!res.ok) {
      // Never swallow the failure: a Save button that flashes "Saved!" on a
      // 400 is indistinguishable from one that does nothing.
      const detail = await res.json().catch(() => null);
      flash(detail?.error ?? `Save failed (${res.status})`, false);
      return;
    }
    const saved = await res.json().catch(() => null);
    setResults(prev => prev.map(row => row.id === c.id ? {
      ...row,
      name: saved?.name ?? name,
      crewurl: saved?.crewurl ?? row.crewurl,
      acronym: e.acronym ?? row.acronym,
      active: e.active ?? row.active,
      www: e.www ?? row.www,
    } : row));
    setEdits(prev => ({ ...prev, [c.id]: {} }));
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete crew?")) return;
    await fetch("/api/admin/crews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResults(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">CREWS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by name..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={search} />
          <Msg msg={msg} />
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-2">NAME</div>
              <div className="col-2">EDIT NAME</div>
              <div className="col-1">TAG</div>
              <div className="col-2">STATUS</div>
              <div className="col-2">WEBSITE</div>
              <div className="col-3">ACTIONS</div>
            </div>
            {results.map(c => {
              const e = edits[c.id] ?? {};
              return (
                <div key={c.id} className="row amb-1 align-items-center">
                  <div className="col-2 text-truncate">
                    <Link className="magenta" href={`/crew/${c.crewurl}`}>{c.name}</Link>
                  </div>
                  <div className="col-2">
                    <input type="text" className="form-control w-100" value={e.name ?? c.name} onChange={ev => edit(c.id, "name", ev.target.value)} />
                  </div>
                  <div className="col-1">
                    <input type="text" className="form-control w-100" value={e.acronym ?? c.acronym ?? ""} onChange={ev => edit(c.id, "acronym", ev.target.value)} />
                  </div>
                  <div className="col-2">
                    {/* Legacy rows hold "yes"/"Yes"/"Active" — normalize so the
                        stored value actually matches an option, and so saving
                        migrates the row to the canonical vocabulary. */}
                    <select className="form-select w-100" value={normalizeActiveStatus(e.active ?? c.active) ?? ""} onChange={ev => edit(c.id, "active", ev.target.value)}>
                      <option value="">-</option>
                      {ACTIVE_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="col-2">
                    <input type="text" className="form-control w-100" value={e.www ?? c.www ?? ""} onChange={ev => edit(c.id, "www", ev.target.value)} placeholder="Website" />
                  </div>
                  <div className="col-3" style={{ display: "flex", gap: "8px" }}>
                    <input type="button" className="btn-big" value="Save" onClick={() => save(c)} />
                    <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id)} />
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
