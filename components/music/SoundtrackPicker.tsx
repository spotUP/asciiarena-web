"use client";

import { useState } from "react";
import { useMusic } from "./MusicProvider";
import type { ModlandFile } from "@/lib/modland";

// Search Modland and pick a tune as a colly soundtrack. Value is the Modland
// full_path (e.g. "Protracker/4-Mat/madness.mod"). Lives inside MusicProvider.
export default function SoundtrackPicker({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const { search } = useMusic();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ModlandFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const doSearch = async () => {
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    try {
      const r = await search(query);
      setResults(r.results.slice(0, 25));
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (value) {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span className="cyan" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "320px" }} title={value}>
          {value.split("/").slice(1).join(" / ") || value}
        </span>
        <input type="button" className="btn-big" value="Clear" onClick={() => { onChange(""); setResults([]); setQ(""); }} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="search modland (artist / tune)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
          style={{ width: "260px" }}
        />
        <input type="button" className="btn-big" value={loading ? "..." : "Search"} onClick={doSearch} />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 200, top: "100%", left: 0, marginTop: "4px",
          background: "#111111", border: "1px solid #333333", maxHeight: "240px",
          overflowY: "auto", minWidth: "320px",
        }}>
          {results.map((r) => (
            <div
              key={`${r.full_path}`}
              onClick={() => { onChange(r.full_path); setOpen(false); }}
              className="datepicker-day"
              style={{ padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap", fontSize: "13px", color: "#aaaaaa" }}
              title={r.full_path}
            >
              <span className="yellow">{r.author}</span> &middot; {r.filename}
              <span className="lightgrey"> [{r.format}]</span>
            </div>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && (
        <div className="lightgrey" style={{ fontSize: "13px", marginTop: "4px" }}>no matches</div>
      )}
    </div>
  );
}
