"use client";

import { useState, useEffect } from "react";

interface Logo { id: number; ascii: string }

export default function LogosClient() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [ascii, setAscii] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const load = () => fetch("/api/admin/logos").then(r => r.json()).then(setLogos).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!ascii.trim()) return;
    await fetch("/api/admin/logos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ascii }) });
    setAscii("");
    flash("Added!", true);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this logo?")) return;
    await fetch("/api/admin/logos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <div className="row apt-1 apb-1">
        <div className="header col-lg-12 p-0">
          <h2 className="ap-1 bg-header">LOGOS</h2>
        </div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <textarea className="form-control" rows={8} value={ascii} onChange={e => setAscii(e.target.value)}
          style={{ fontFamily: "TopazPlus_a1200, monospace", whiteSpace: "pre", marginBottom: "6px" }}
          placeholder="Paste ASCII logo here..." />
        <input type="button" className="btn-big" value="Add Logo" onClick={add} />
        {msg && <span style={{ marginLeft: "8px", color: msg.ok ? "#55ff55" : "#ff5555" }}>{msg.text}</span>}
      </div>
      {logos.map(l => (
        <div key={l.id} className="row" style={{ marginBottom: "8px" }}>
          <div className="col-10">
            <pre style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "11px", color: "#ff55ff", whiteSpace: "pre", overflow: "hidden", maxHeight: "80px", margin: 0 }}>
              {l.ascii}
            </pre>
          </div>
          <div className="col-2">
            <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(l.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
