"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CollyPreview, { type PreviewReport, type LogoEntry } from "@/components/submit/CollyPreview";
import type { LogoMapEntry } from "@/lib/logoMapPayload";

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
// `current` is the colly's live database map (newest `colly_logo_edits`
// snapshot, or a pre-feature admin map derived from `colly_logos`), or null
// when nobody has tagged the colly in the database yet.
interface LogosGetBody { current: LogoMapEntry[] | null; history: EditRow[] }

// A skipped save is neither success nor failure, so it gets the neutral tone
// rather than a green "saved" or a red error.
const MSG_CLASS: Record<"ok" | "info" | "error", string> = {
  ok: "green",
  info: "lightgrey",
  error: "red",
};

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
  // True once the reader actually changes the map, as opposed to it merely
  // being seeded (saved entries plus auto-detected bands). Only a dirty map is
  // sent, mirroring the admin editor's `logosDirty` guard: without it, opening
  // the panel on a hand-curated colly and clicking Save would freeze the
  // auto-detected suggestions into that colly's map and overwrite the
  // curation. See app/admin/collys/CollysClient.tsx.
  const logosDirty = useRef(false);
  const editLogoMap = useCallback((next: LogoEntry[]) => {
    logosDirty.current = true;
    setLogoMap(next);
  }, []);
  const [history, setHistory] = useState<EditRow[]>([]);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "info" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  // Which fetch failed, so the error state can tell the truth: a failed
  // preview load just can't show anything, but a failed logos load means
  // the colly's existing tags are unknown -- saving now would overwrite
  // them, so this must fail closed rather than fall back to the file
  // trailer (see the seeding effect's comment).
  const [failed, setFailed] = useState<"preview" | "logos" | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Monotonic sequence guard: whichever loadHistory() call was issued LAST
  // wins, no matter which order the responses come back in. Without this a
  // save-then-revert race could let a stale (save-triggered) response
  // overwrite the fresher (revert-triggered) one.
  const historySeq = useRef(0);
  const loadHistory = useCallback(() => {
    const seq = ++historySeq.current;
    fetch(`/api/collys/${collyId}/logos`)
      .then(r => r.json())
      .then((body: LogosGetBody) => {
        if (historySeq.current !== seq) return;
        setHistory(Array.isArray(body.history) ? body.history : []);
      })
      .catch(() => { if (historySeq.current === seq) setHistory([]); });
  }, [collyId]);

  // Seed the editor from the colly's CURRENT database map -- the newest
  // `colly_logo_edits` snapshot is the source of truth for a tagged colly;
  // `report.meta.logos` (the trailer embedded in the file on disk) is only
  // a fallback for a colly nobody has tagged in the database yet, since
  // public tagging never writes to the file. Both requests must resolve
  // before the editor seeds, so a slow logos fetch can never leave it
  // seeded from the wrong source. Auto-detected regions fill in only where
  // they do not overlap a seeded entry (canvas collys have no text lines to
  // detect against).
  //
  // If the logos fetch fails, we do NOT fall back to treating it as
  // `current: null` (which would mean "nobody has tagged this yet" and
  // seed from the file trailer) -- that would silently reopen the exact
  // data-loss bug this component exists to prevent, just gated behind a
  // network error instead of "always". We fail closed: no editor, an
  // explicit message, and a Retry button. Deliberate; do not "fix" this by
  // defaulting to the trailer on fetch failure.
  useEffect(() => {
    let live = true;
    setFailed(null);
    const previewFetch = fetch(`/api/collys/preview?filename=${encodeURIComponent(filename)}`)
      .then(r => r.ok ? (r.json() as Promise<PreviewReport>) : Promise.reject(new Error(String(r.status))));
    const logosFetch = fetch(`/api/collys/${collyId}/logos`)
      .then(r => r.ok ? (r.json() as Promise<LogosGetBody>) : Promise.reject(new Error(String(r.status))));

    Promise.allSettled([previewFetch, logosFetch]).then(([repResult, logosResult]) => {
      if (!live) return;
      if (repResult.status === "rejected") { setFailed("preview"); return; }
      if (logosResult.status === "rejected") { setFailed("logos"); return; }
      const rep = repResult.value;
      const logosBody = logosResult.value;
      setReport(rep);
      setHistory(Array.isArray(logosBody.history) ? logosBody.history : []);
      const saved: LogoEntry[] = (logosBody.current ?? rep.meta.logos ?? []).map(m => ({ line: m.line, end: m.end, caption: m.caption, auto: false }));
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
      logosDirty.current = false; // seeding is not an edit
    });
    return () => { live = false; };
  }, [filename, collyId, retryTick]);

  const save = async () => {
    // An untouched map is not the reader's work -- sending it would rewrite
    // the colly with whatever this panel happened to seed and merge.
    if (!logosDirty.current) {
      setMsg({ text: "Nothing changed - the logo map was not saved.", tone: "info" });
      return;
    }
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
      setMsg({ text: "Save failed - network error", tone: "error" });
      return;
    }
    setSaving(false);
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      setMsg({ text: detail?.error ?? `Save failed (${res.status})`, tone: "error" });
      return;
    }
    // The saved map is now the colly's map, so a second click has nothing to
    // send until the reader edits again.
    logosDirty.current = false;
    const body = await res.json().catch(() => null);
    // rowCount < logoCount means captions were dropped as unsearchable.
    const dropped = body ? body.logoCount - body.rowCount : 0;
    setMsg({
      text: dropped > 0
        ? `Saved. ${dropped} caption${dropped === 1 ? "" : "s"} are not searchable.`
        : "Saved!",
      tone: "ok",
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
    if (!res?.ok) {
      const detail = res ? await res.json().catch(() => null) : null;
      setMsg({ text: detail?.error ?? "Revert failed", tone: "error" });
      return;
    }
    setMsg({ text: "Reverted. Reload to see the restored map.", tone: "ok" });
    loadHistory();
  };

  if (failed) {
    const message = failed === "logos"
      ? "This colly's existing tags could not be loaded. Saving now could overwrite them, so saving is disabled until the load succeeds."
      : "Could not load the logo editor.";
    return (
      <div className="bg-secondary ap-1 amb-1">
        <div className="red amb-1">{message}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="button" className="btn-big" value="Retry" onClick={() => setRetryTick(t => t + 1)} />
          <input type="button" className="btn-big" value="Done" onClick={onDone} />
        </div>
      </div>
    );
  }

  if (!report) return <div className="lightgrey ap-1">Loading logo editor...</div>;

  return (
    <div className="bg-secondary ap-1 amb-1">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <input type="button" className="btn-big" value={saving ? "Saving..." : "Save Logo Map"} disabled={saving} onClick={save} />
        <input type="button" className="btn-big" value="Done" onClick={onDone} />
        {msg && <span className={MSG_CLASS[msg.tone]}>{msg.text}</span>}
      </div>

      <CollyPreview
        report={report}
        type={type}
        font={font}
        fg={fg}
        bg={bg}
        logoMap={logoMap}
        setLogoMap={editLogoMap}
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
