"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { deletePost, editPost } from "@/app/actions/forum";
import { MAX_BODY_LEN } from "@/lib/forum/types";
import AnsiMenu from "@/components/ui/AnsiMenu";

interface Props {
  postId: number;
  body: string;
  canEdit: boolean;
  canDelete: boolean;
  /** Anyone logged in who is not the author may report it. */
  canReport: boolean;
}

// Inline edit + delete for a post. Split out of PostItem so the post itself
// stays a server component.
export default function PostActions({ postId, body, canEdit, canDelete, canReport }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [busy, setBusy] = useState(false);

  if (!canEdit && !canDelete && !canReport) return null;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    const r = await editPost(postId, draft);
    setBusy(false);
    if (r.success) {
      setEditing(false);
      toast("[OK] Post updated.");
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "Could not save your edit. Try again."}`, "danger");
    }
  };

  const report = async () => {
    if (busy) return;
    const reason = prompt("What is wrong with this post? (a sentence is enough)");
    if (reason == null) return;
    if (reason.trim().length < 3) {
      toast("[!] Say briefly what is wrong with the post.", "danger");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/forum/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, reason }),
    });
    setBusy(false);
    if (res.ok) {
      toast("[OK] Reported. A moderator will look at it.");
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      toast(`[!] ${d.error ?? "Could not send the report. Try again."}`, "danger");
    }
  };

  const remove = async () => {
    if (busy) return;
    if (!confirm("Delete this post? It stays recoverable by an administrator.")) return;
    setBusy(true);
    const r = await deletePost(postId);
    setBusy(false);
    if (r.success) {
      toast("[OK] Post deleted.");
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "Could not delete the post. Try again."}`, "danger");
    }
  };

  if (editing) {
    return (
      <div className="apt-1">
        <textarea
          className="form-control"
          rows={6}
          maxLength={MAX_BODY_LEN}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={{ resize: "vertical" }}
        />
        <div className="apt-1 d-flex" style={{ gap: "8px" }}>
          <button className="btn-secondary apr-1" onClick={save} disabled={busy}>
            SAVE
          </button>
          <button
            className="btn-secondary apr-1"
            onClick={() => {
              setDraft(body);
              setEditing(false);
            }}
            disabled={busy}
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  // One menu rather than three buttons. Three is not many on its own, but they
  // repeat under every post: a twenty-post thread carried sixty buttons, all
  // of them shouting as loudly as the posts.
  //
  // Right-aligned, so the menu hangs from the trigger's right edge and stays
  // inside the post card.
  return (
    <div className="apt-1 d-flex justify-content-end">
      <AnsiMenu
        label="Actions"
        width="144px"
        menuWidth="176px"
        align="right"
        items={[
          ...(canEdit ? [{ label: "Edit", onSelect: () => setEditing(true) }] : []),
          ...(canDelete ? [{ label: "Delete", onSelect: remove }] : []),
          ...(canReport ? [{ label: "Report", onSelect: report }] : []),
        ]}
      />
    </div>
  );
}
