"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DosSelect from "@/components/ui/DosSelect";
import { RANKS } from "@/lib/accountRules";

export interface BoardInitial {
  id: number;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  minReadRank: string | null;
  minPostRank: string;
  locked: boolean;
  hidden: boolean;
}

const LABEL = {
  display: "block",
  marginBottom: "8px",
  fontFamily: "TopazPlus_a1200, monospace",
  fontSize: "16px",
  lineHeight: "16px",
} as const;

// Ranks that make sense as a gate. "" is the no-requirement case and is only
// offered for reading; a board nobody has to be logged in to post in is not a
// thing anyone wants.
const READ_OPTIONS = RANKS.map(r => ({ value: r, label: r === "" ? "Everyone" : `${r} and above` }));
const POST_OPTIONS = RANKS.filter(r => r !== "").map(r => ({ value: r, label: `${r} and above` }));

export default function BoardFormClient({ initial }: { initial?: BoardInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [minReadRank, setMinReadRank] = useState(initial?.minReadRank ?? "");
  const [minPostRank, setMinPostRank] = useState(initial?.minPostRank ?? "Member");
  const [locked, setLocked] = useState(initial?.locked ?? false);
  const [hidden, setHidden] = useState(initial?.hidden ?? false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const payload = () => ({
    name,
    slug: slug.trim() || undefined,
    description,
    sortOrder: Number(sortOrder) || 0,
    minReadRank: minReadRank || null,
    minPostRank,
    locked,
    hidden,
  });

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setMsg("");
    const res = await fetch(initial ? `/api/admin/forum/boards/${initial.id}` : "/api/admin/forum/boards", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin/forum");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(`[!] ${d?.error ?? "Could not save the board."}`);
    }
  };

  const remove = async () => {
    if (!initial || busy) return;
    if (!confirm(`Delete board "${initial.name}"? This removes every topic and post in it.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/forum/boards/${initial.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/admin/forum");
      router.refresh();
    } else {
      setMsg("[!] Could not delete the board.");
    }
  };

  const resync = async () => {
    if (!initial || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/forum/boards/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resync: true }),
    });
    setBusy(false);
    setMsg(res.ok ? "[OK] Counters recomputed from the live topics." : "[!] Could not recompute the counters.");
    router.refresh();
  };

  return (
    <div className="container-fluid bg-secondary ap-1">
      <label className="lightgrey" style={LABEL} htmlFor="board-name">Name</label>
      <input id="board-name" className="form-control" value={name} onChange={e => setName(e.target.value)} maxLength={120} autoComplete="off" />

      <label className="lightgrey" style={{ ...LABEL, marginTop: "16px" }} htmlFor="board-slug">
        URL (leave empty to build it from the name)
      </label>
      <input id="board-slug" className="form-control" value={slug} onChange={e => setSlug(e.target.value)} maxLength={96} autoComplete="off" />

      <label className="lightgrey" style={{ ...LABEL, marginTop: "16px" }} htmlFor="board-desc">Description</label>
      <input id="board-desc" className="form-control" value={description} onChange={e => setDescription(e.target.value)} maxLength={255} autoComplete="off" />

      <label className="lightgrey" style={{ ...LABEL, marginTop: "16px" }} htmlFor="board-order">Sort order</label>
      <input id="board-order" className="form-control" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />

      <div style={{ marginTop: "16px" }}>
        <span className="lightgrey" style={LABEL}>Who can read this board</span>
        <DosSelect value={minReadRank} options={READ_OPTIONS} onChange={setMinReadRank} />
      </div>

      <div style={{ marginTop: "16px" }}>
        <span className="lightgrey" style={LABEL}>Who can post in this board</span>
        <DosSelect value={minPostRank} options={POST_OPTIONS} onChange={setMinPostRank} />
      </div>

      <div className="lightgrey" style={{ marginTop: "16px", height: "16px", lineHeight: "16px" }}>
        <label>
          <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} /> Closed to new topics
        </label>
      </div>
      <div className="lightgrey" style={{ marginTop: "16px", height: "16px", lineHeight: "16px" }}>
        <label>
          <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hidden from the board list
        </label>
      </div>

      {msg && (
        <div className={msg.startsWith("[OK]") ? "lightgreen" : "lightred"} style={{ marginTop: "16px", height: "16px", lineHeight: "16px" }}>
          {msg}
        </div>
      )}

      <div className="d-flex" style={{ gap: "16px", marginTop: "16px", alignItems: "center" }}>
        <input type="button" className="btn-big" value={initial ? "SAVE BOARD" : "CREATE BOARD"} onClick={save} disabled={busy} />
        {initial && (
          <>
            <button className="btn-secondary apr-1" onClick={resync} disabled={busy}>RECOUNT</button>
            <button className="btn-secondary apr-1" onClick={remove} disabled={busy}>DELETE</button>
          </>
        )}
      </div>
    </div>
  );
}
