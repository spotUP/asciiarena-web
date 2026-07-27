"use client";

import { useCallback, useEffect, useState } from "react";
import CollyPreview, { type PreviewReport, type LogoEntry } from "@/components/submit/CollyPreview";

export interface LogoTagPanelProps {
  collyId: number;
  filename: string;
  type: string;
  font: string;
  fg: string;
  bg: string;
  isAdmin: boolean;
  onDone: () => void;
}

interface EditRow { id: number; nick: string; timestamp: number; logoCount: number }

function ago(unix: number): string {
  const secs = Math.max(0, Math.floor(Date.now() / 1000) - unix);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function LogoTagPanel({ collyId, filename, type, font, fg, bg, isAdmin, onDone }: LogoTagPanelProps) {
  const [report, setReport] = useState<PreviewReport | null>(null);
  const [logoMap, setLogoMap] = useState<LogoEntry[]>([]);
  const [history, setHistory] = useState<EditRow[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadHistory = useCallback(() => {
    fetch(`/api/collys/${collyId}/logos`)
      .then(r => r.json())
      .then((rows: EditRow[]) => setHistory(Array.isArray(rows) ? rows : []))
      .catch(() => setHistory([]));
  }, [collyId]);

  // Seed the editor from the colly's current map, exactly as the admin editor
  // does: saved entries verbatim, auto-detected regions only where they do not
  // overlap one (canvas collys have no text lines to detect against).
  useEffect(() => {
    let live = true;
    fetch(`/api/collys/preview?filename=${encodeURIComponent(filename)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((rep: PreviewReport) => {
        if (!live) return;
        setReport(rep);
        const saved: LogoEntry[] = (rep.meta.logos ?? []).map(m => ({ line: m.line, end: m.end, caption: m.caption, auto: false }));
        const isCanvas = rep.type === "ANSI" || rep.type === "CP437";
        const overlapsSaved = (a: { line: number; end?: number }) =>
          saved.some(m => a.line <= (m.end ?? m.line) && (a.end ?? a.line) >= m.line);
        const auto: LogoEntry[] = isCanvas ? [] : (rep.logos ?? [])
          .map(l => ({
            line: l.line,
            end: l.end,
            caption: l.searchable ? (l.author ? `${l.name} -${l.author}` : l.name) : "",
            auto: true,
          }))
          .filter(a => !overlapsSaved(a));
        setLogoMap([...saved, ...auto].sort((x, y) => x.line - y.line));
      })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [filename]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const save = async () => {
    setSaving(true);
    let res: Response;
    try {
      res = await fetch(`/api/collys/${collyId}/logos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logos: logoMap.map(l => ({ line: l.line, end: l.end, caption: l.caption })) }),
      });
    } catch {
      setSaving(false);
      setMsg({ text: "Save failed - network error", ok: false });
      return;
    }
    setSaving(false);
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      setMsg({ text: detail?.error ?? `Save failed (${res.status})`, ok: false });
      return;
    }
    const body = await res.json().catch(() => null);
    // rowCount < logoCount means captions were dropped as unsearchable.
    const dropped = body ? body.logoCount - body.rowCount : 0;
    setMsg({
      text: dropped > 0
        ? `Saved. ${dropped} caption${dropped === 1 ? "" : "s"} are not searchable.`
        : "Saved!",
      ok: true,
    });
    loadHistory();
  };

  const revert = async (editId: number) => {
    if (!confirm("Restore this version of the logo map?")) return;
    const res = await fetch(`/api/collys/${collyId}/logos/revert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editId }),
    }).catch(() => null);
    if (!res?.ok) { setMsg({ text: "Revert failed", ok: false }); return; }
    setMsg({ text: "Reverted. Reload to see the restored map.", ok: true });
    loadHistory();
  };

  if (failed) {
    return (
      <div className="bg-secondary ap-1 amb-1">
        <div className="red amb-1">Could not load the logo editor.</div>
        <input type="button" className="btn-big" value="Done" onClick={onDone} />
      </div>
    );
  }

  if (!report) return <div className="lightgrey ap-1">Loading logo editor...</div>;

  return (
    <div className="bg-secondary ap-1 amb-1">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <input type="button" className="btn-big" value={saving ? "Saving..." : "Save Logo Map"} disabled={saving} onClick={save} />
        <input type="button" className="btn-big" value="Done" onClick={onDone} />
        {msg && <span className={msg.ok ? "green" : "red"}>{msg.text}</span>}
      </div>

      <CollyPreview
        report={report}
        type={type}
        font={font}
        fg={fg}
        bg={bg}
        logoMap={logoMap}
        setLogoMap={setLogoMap}
      />

      {history.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div className="lightgrey" style={{ marginBottom: "8px" }}>EDIT HISTORY</div>
          {history.map(h => (
            <div key={h.id} style={{ display: "flex", gap: "8px", alignItems: "center", height: "16px", lineHeight: "16px" }}>
              <span className="lightgrey">mapped by</span>
              <span className="magenta">{h.nick}</span>
              <span className="lightgrey">{ago(h.timestamp)}, {h.logoCount} logo{h.logoCount === 1 ? "" : "s"}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => revert(h.id)}
                  style={{ background: "transparent", border: "none", color: "#aaaaaa", padding: 0, fontFamily: "inherit", lineHeight: "16px", cursor: "pointer" }}
                >
                  [restore]
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
