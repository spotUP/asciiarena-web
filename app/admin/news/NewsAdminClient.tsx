"use client";

import { useCallback, useEffect, useState } from "react";

interface NewsRow {
  id: number;
  title: string;
  body: string;
  published: boolean;
  banner: boolean;
  created_at: number;
  updated_at: number;
  author: string | null;
  reads: number;
}

interface Draft {
  title: string;
  body: string;
  published: boolean;
  banner: boolean;
}

const EMPTY: Draft = { title: "", body: "", published: true, banner: true };

function fmt(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 16).replace("T", " ");
}

export default function NewsAdminClient() {
  const [rows, setRows] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/news");
      if (res.ok) setRows((await res.json()) as NewsRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startNew() {
    setEditingId(null);
    setDraft(EMPTY);
    setStatus("");
  }

  function startEdit(row: NewsRow) {
    setEditingId(row.id);
    setDraft({ title: row.title, body: row.body, published: row.published, banner: row.banner });
    setStatus("");
  }

  async function save() {
    if (!draft.title.trim() || !draft.body.trim()) { setStatus("Title and body are both required."); return; }
    setSaving(true);
    try {
      const res = editingId == null
        ? await fetch("/api/admin/news", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
          })
        : await fetch("/api/admin/news", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...draft }),
          });
      // Never report success without checking — a failed save that says
      // "Saved!" is how a broken write path stays invisible.
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        setStatus(`Save failed (${res.status}): ${(detail as { error?: string } | null)?.error ?? "unknown error"}`);
        return;
      }
      setStatus(editingId == null ? "Posted." : "Saved.");
      setDraft(EMPTY);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(row: NewsRow) {
    const res = await fetch("/api/admin/news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, published: !row.published }),
    });
    if (!res.ok) { setStatus(`Could not change published state (${res.status}).`); return; }
    await load();
  }

  async function remove(row: NewsRow) {
    const res = await fetch("/api/admin/news", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    if (!res.ok) { setStatus(`Could not delete (${res.status}).`); return; }
    if (editingId === row.id) { setEditingId(null); setDraft(EMPTY); }
    await load();
  }

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">{editingId == null ? "POST NEWS" : `EDIT NEWS #${editingId}`}</h2>
      </div>

      <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
        <div className="row amb-1">
          <div className="col-12 lightgrey amb-1">TITLE</div>
          <div className="col-12">
            <input
              type="text"
              className="form-control w-100"
              maxLength={200}
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Shown in the announcement bar"
            />
          </div>
        </div>
        <div className="row amb-1">
          <div className="col-12 lightgrey amb-1">BODY</div>
          <div className="col-12">
            <textarea
              className="w-100 bg-secondary"
              rows={8}
              style={{ color: "#aaa", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}
              value={draft.body}
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              placeholder="Full text, shown on /news"
            />
          </div>
        </div>
        <div className="row amb-1">
          <div className="col-12 d-flex" style={{ gap: "16px", flexWrap: "wrap" }}>
            <label className="lightgrey" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={e => setDraft(d => ({ ...d, published: e.target.checked }))}
                style={{ marginRight: "8px" }}
              />
              Published
            </label>
            <label className="lightgrey" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={draft.banner}
                onChange={e => setDraft(d => ({ ...d, banner: e.target.checked }))}
                style={{ marginRight: "8px" }}
              />
              Show in the announcement bar
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col-12 d-flex" style={{ gap: "8px" }}>
            <input type="button" className="btn-big" value={saving ? "Saving..." : editingId == null ? "Post" : "Save"} disabled={saving} onClick={save} />
            {editingId != null && <input type="button" className="btn-big" value="Cancel" onClick={startNew} />}
          </div>
        </div>
        {status && <div className="row apt-1"><div className="col-12 lightgrey">{status}</div></div>}
      </div>

      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">ALL NEWS</h2>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1">
        {loading && <div className="lightgrey">Loading...</div>}
        {!loading && rows.length === 0 && <div className="lightgrey">No news posted yet.</div>}
        {rows.map(row => (
          <div key={row.id} style={{ borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "8px" }}>
            <div className="d-flex" style={{ gap: "16px", flexWrap: "wrap", alignItems: "baseline" }}>
              <span style={{ minWidth: "64px", color: row.published ? "#B6D1AA" : "#F4D799" }}>
                [{row.published ? "live" : "draft"}]
              </span>
              <span className="white" style={{ minWidth: "320px" }}>{row.title}</span>
              <span className="lightgrey" style={{ minWidth: "144px" }}>{fmt(row.created_at)}</span>
              <span className="lightgrey" style={{ minWidth: "112px" }}>{row.banner ? "banner" : "no banner"}</span>
              <span className="lightgrey" style={{ minWidth: "96px" }}>{row.reads} read</span>
            </div>
            <div className="apt-1 d-flex" style={{ gap: "8px", flexWrap: "wrap" }}>
              <input type="button" className="btn-big" value="Edit" onClick={() => startEdit(row)} />
              <input type="button" className="btn-big" value={row.published ? "Unpublish" : "Publish"} onClick={() => togglePublished(row)} />
              <input type="button" className="btn-big" value="Delete" onClick={() => remove(row)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
