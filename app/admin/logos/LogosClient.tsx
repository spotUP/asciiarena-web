"use client";

import { useState, useEffect, useRef } from "react";
import DosSelect from "@/components/ui/DosSelect";
import AnsiLogo from "@/components/ui/AnsiLogo";
import { FONTS } from "@/lib/ansilove";

interface Logo {
  id: number;
  author: string | null;
  ascii: string;
  kind: string;
  ansi_b64: string | null;
  font: string | null;
}

export default function LogosClient() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [ascii, setAscii] = useState("");
  const [ansiFont, setAnsiFont] = useState("");
  const ansiInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 5000);
  };

  const load = () => fetch("/api/admin/logos").then(r => r.json()).then(setLogos).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!ascii.trim()) return;
    const res = await fetch("/api/admin/logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ascii }),
    });
    if (res.ok) { setAscii(""); flash("Added!", true); load(); }
    else { const e = await res.json().catch(() => ({})); flash(e.error ?? "Failed.", false); }
  };

  const addAnsi = async () => {
    const file = ansiInputRef.current?.files?.[0];
    if (!file) { flash("Choose a .ans file first.", false); return; }
    const fd = new FormData();
    fd.append("ans", file);
    if (ansiFont) fd.append("font", ansiFont);
    const res = await fetch("/api/admin/logos", { method: "POST", body: fd });
    if (res.ok) {
      if (ansiInputRef.current) ansiInputRef.current.value = "";
      flash("ANSI logo added!", true);
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      flash(e.error ?? "Upload failed.", false);
    }
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
          <input type="button" className="btn-big" value="Add ASCII Logo" onClick={add} />
        </div>

        <hr style={{ borderColor: "#444" }} />

        <div className="lightgrey amb-1">Or upload an ANSI logo (.ans):</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }} className="amb-1">
          <input ref={ansiInputRef} type="file" accept=".ans" className="lightgrey" />
          <DosSelect
            padded
            width={200}
            value={ansiFont}
            options={[{ value: "", label: "Auto (SAUCE)" }, ...FONTS]}
            onChange={setAnsiFont}
          />
          <input type="button" className="btn-big" value="Upload ANSI Logo" onClick={addAnsi} />
        </div>

        {msg && <span className={msg.ok ? "green" : "red"}>{msg.text}</span>}
      </div>

      {logos.length === 0 && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">EXiSTiNG LOGOS</h2>
          </div>
          <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <div className="lightgrey">No logos yet.</div>
          </div>
        </>
      )}

      {/* One section per logo (header bar + bg-secondary panel), like the
          stacked sections in the main page's middle column. */}
      {logos.map(l => (
        <div key={l.id}>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">
              LOGO #{l.id} &middot; {l.kind === "ansi" ? "ANSI" : "ASCII"}
              {l.author ? ` · ${l.author}` : ""}
            </h2>
          </div>
          <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <div className="row align-items-center">
              <div className="col-10" style={{ overflow: "hidden" }}>
                {l.kind === "ansi" ? (
                  l.ansi_b64 ? (
                    <AnsiLogo ansiB64={l.ansi_b64} font={l.font} maxHeight={160} />
                  ) : (
                    <span className="red" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
                      [ANSI logo #{l.id} — missing data]
                    </span>
                  )
                ) : (
                  <pre
                    className="magenta"
                    style={{
                      fontFamily: "TopazPlus_a1200, monospace",
                      fontSize: "16px",
                      lineHeight: "16px",
                      whiteSpace: "pre",
                      overflow: "auto",
                      maxHeight: "160px",
                      margin: 0,
                    }}
                  >
                    {l.ascii}
                  </pre>
                )}
              </div>
              <div className="col-2">
                <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(l.id)} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
