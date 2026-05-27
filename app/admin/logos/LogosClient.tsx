"use client";

import { useState, useEffect } from "react";

interface Logo {
  id: number;
  ascii: string;
}

export default function LogosClient() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [ascii, setAscii] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = () => fetch("/api/admin/logos").then(r => r.json()).then(setLogos).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!ascii.trim()) return;
    await fetch("/api/admin/logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ascii }),
    });
    setAscii("");
    flash("Added!", true);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this logo?")) return;
    await fetch("/api/admin/logos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">LOGOS</h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div className="amb-1">
          <textarea
            className="form-control w-100"
            rows={8}
            value={ascii}
            onChange={e => setAscii(e.target.value)}
            style={{ fontFamily: "TopazPlus_a1200, monospace", whiteSpace: "pre" }}
            placeholder="Paste ASCII logo here..."
          />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }} className="amb-1">
          <input type="button" className="btn-big" value="Add Logo" onClick={add} />
          {msg && (
            <span className={msg.ok ? "green" : "red"}>{msg.text}</span>
          )}
        </div>
      </div>

      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">EXiSTiNG LOGOS</h2>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        {logos.length === 0 && <div className="lightgrey">No logos yet.</div>}
        {logos.map(l => (
          <div key={l.id} className="row amb-1 align-items-center">
            <div className="col-10">
              <pre
                className="magenta"
                style={{
                  fontFamily: "TopazPlus_a1200, monospace",
                  fontSize: "16px",
                  lineHeight: "16px",
                  whiteSpace: "pre",
                  overflow: "hidden",
                  maxHeight: "128px",
                  margin: 0,
                }}
              >
                {l.ascii}
              </pre>
            </div>
            <div className="col-2">
              <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(l.id)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
