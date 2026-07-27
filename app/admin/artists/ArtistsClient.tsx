"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import { ACTIVE_STATUSES, normalizeActiveStatus } from "@/lib/activeStatus";

interface Artist {
  id: number;
  nick: string;
  artisturl: string;
  acronym: string | null;
  active: string | null;
  country: string | null;
  www: string | null;
  /** Comma-joined crew names from member_of, as returned by the API. */
  crews: string | null;
}

const splitCrews = (value: string | null | undefined): string[] =>
  (value ?? "").split(",").map(part => part.trim()).filter(Boolean);

/**
 * Crew affiliations for one artist: the current memberships as removable
 * rows, plus a picker that adds an existing crew or a newly typed one.
 */
function CrewAffiliations({ crews, options, onChange }: {
  crews: string[];
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const [pick, setPick] = useState("");
  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (crews.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...crews, trimmed]);
  };
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      {crews.map(c => (
        <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#212121", padding: "0 8px", height: "16px", lineHeight: "16px" }}>
          {c}
          <button
            type="button"
            title={`Remove ${c}`}
            onClick={() => onChange(crews.filter(x => x !== c))}
            style={{ background: "transparent", border: "none", color: "#ff5555", padding: 0, fontFamily: "inherit", lineHeight: "16px", cursor: "pointer" }}
          >
            x
          </button>
        </span>
      ))}
      <select className="form-select" value="" style={{ width: "240px" }} onChange={ev => { add(ev.target.value); setPick(""); }}>
        <option value="">Add crew...</option>
        {options.filter(o => !crews.some(c => c.toLowerCase() === o.toLowerCase())).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {/* A crew that does not exist yet can be typed straight in — the API
          creates the row, same as the colly submit form does. */}
      <input
        type="text"
        className="form-control"
        placeholder="or type a new crew"
        value={pick}
        style={{ width: "240px" }}
        onChange={ev => setPick(ev.target.value)}
        onKeyDown={ev => { if (ev.key === "Enter") { ev.preventDefault(); add(pick); setPick(""); } }}
      />
      <input type="button" className="btn-big" value="Add" onClick={() => { add(pick); setPick(""); }} />
    </div>
  );
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <span className={msg.ok ? "green" : "red"} style={{ marginLeft: "8px" }}>
      {msg.text}
    </span>
  );
}

export default function ArtistsClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [edits, setEdits] = useState<Record<number, Partial<Artist>>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  // All crew names, for the affiliation picker (same endpoint the crew admin
  // uses for its dropdowns).
  const [crewOptions, setCrewOptions] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/admin/crews?q=*")
      .then(r => r.json())
      .then((rows: { name: string }[]) => setCrewOptions(rows.map(r => r.name).filter(Boolean)))
      .catch(() => setCrewOptions([]));
  }, []);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const search = useCallback(async (nextQuery: string) => {
    if (!nextQuery.trim()) return;
    const rows = await fetch(`/api/admin/artists?q=${encodeURIComponent(nextQuery)}`)
      .then(r => r.json())
      .catch(() => []);
    setResults(rows);
    setEdits({});
  }, []);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    if (!initialQuery.trim()) return;
    setQuery(initialQuery);
    void search(initialQuery);
  }, [search]);

  const edit = (id: number, field: string, value: string) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (a: Artist) => {
    const e = edits[a.id] ?? {};
    const nick = (e.nick ?? a.nick).trim();
    if (!nick) { flash("Nick cannot be empty", false); return; }
    let res: Response;
    try {
      res = await fetch("/api/admin/artists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: a.id,
          nick,
          acronym: e.acronym ?? a.acronym ?? "",
          active: e.active ?? a.active ?? "",
          country: e.country ?? a.country ?? "",
          www: e.www ?? a.www ?? "",
          crewNames: splitCrews(e.crews ?? a.crews),
        }),
      });
    } catch {
      flash("Save failed — network error", false);
      return;
    }
    if (!res.ok) {
      // Surface the API's own message (duplicate nick, validation) instead of
      // a bare status — a silent failure is what made the colly editor
      // look like the Save button did nothing at all.
      const detail = await res.json().catch(() => null);
      flash(detail?.error ?? `Save failed (${res.status})`, false);
      return;
    }
    const saved = await res.json().catch(() => null);
    // Reflect the rename locally: the artist link has to follow the new slug.
    setResults(prev => prev.map(row => row.id === a.id ? {
      ...row,
      nick: saved?.nick ?? nick,
      artisturl: saved?.artisturl ?? row.artisturl,
      acronym: e.acronym ?? row.acronym,
      active: e.active ?? row.active,
      country: e.country ?? row.country,
      www: e.www ?? row.www,
      crews: e.crews ?? row.crews,
    } : row));
    setEdits(prev => ({ ...prev, [a.id]: {} }));
    flash("Saved!", true);
  };

  const del = async (id: number) => {
    if (!confirm("Delete artist and all crew memberships?")) return;
    await fetch("/api/admin/artists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setResults(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">ARTiSTS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(query)}
            placeholder="Search by nick..."
            style={{ width: "320px" }}
          />
          <input type="button" className="btn-big" value="Search" onClick={() => search(query)} />
          <Msg msg={msg} />
        </div>

        {results.length > 0 && (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-2">NICK</div>
              <div className="col-1">ACRONYM</div>
              <div className="col-2">STATUS</div>
              <div className="col-2">COUNTRY</div>
              <div className="col-2">WEBSITE</div>
              <div className="col-3">ACTIONS</div>
            </div>
            {results.map(a => {
              const e = edits[a.id] ?? {};
              return (
                <div key={a.id} className="row amb-2 align-items-center">
                  <div className="col-2">
                    {/* Editable, so typos like "Malcom-X" can be corrected. The
                        API regenerates artisturl and carries the old handle
                        across member_of + comments. */}
                    <input
                      type="text"
                      className="form-control w-100"
                      value={e.nick ?? a.nick}
                      onChange={ev => edit(a.id, "nick", ev.target.value)}
                    />
                  </div>
                  <div className="col-1">
                    <input type="text" className="form-control w-100" value={e.acronym ?? a.acronym ?? ""} onChange={ev => edit(a.id, "acronym", ev.target.value)} />
                  </div>
                  <div className="col-2">
                    {/* Legacy rows hold "yes"/"Yes"/"Active" — normalize so the
                        stored value actually matches an option, and so saving
                        migrates the row to the canonical vocabulary. */}
                    <select className="form-select w-100" value={normalizeActiveStatus(e.active ?? a.active) ?? ""} onChange={ev => edit(a.id, "active", ev.target.value)}>
                      <option value="">-</option>
                      {ACTIVE_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="col-2">
                    <select className="form-select w-100" value={e.country ?? a.country ?? ""} onChange={ev => edit(a.id, "country", ev.target.value)}>
                      <option value="">-</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-2">
                    <input type="text" className="form-control w-100" value={e.www ?? a.www ?? ""} onChange={ev => edit(a.id, "www", ev.target.value)} placeholder="Website" />
                  </div>
                  <div className="col-3" style={{ display: "flex", gap: "8px" }}>
                    <input type="button" className="btn-big" value="Save" onClick={() => save(a)} />
                    <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(a.id)} />
                    <Link className="magenta" href={`/artist/${a.artisturl}`} style={{ lineHeight: "16px" }}>Profile</Link>
                  </div>
                  <div className="col-12 amt-1" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="lightgrey">CREWS</span>
                    <CrewAffiliations
                      crews={splitCrews(e.crews ?? a.crews)}
                      options={crewOptions}
                      onChange={next => edit(a.id, "crews", next.join(", "))}
                    />
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
