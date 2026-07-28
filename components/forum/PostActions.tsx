"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { deletePost, editPost } from "@/app/actions/forum";
import { MAX_BODY_LEN } from "@/lib/forum/types";

interface Props {
  postId: number;
  body: string;
  canEdit: boolean;
  canDelete: boolean;
}

// Inline edit + delete for a post. Split out of PostItem so the post itself
// stays a server component.
export default function PostActions({ postId, body, canEdit, canDelete }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [busy, setBusy] = useState(false);

  if (!canEdit && !canDelete) return null;

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
        <div className="apt-1">
          <button className="btn-secondary apr-1" style={{ marginRight: "8px" }} onClick={save} disabled={busy}>
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

  return (
    <div className="apt-1 d-flex justify-content-end" style={{ gap: "8px", height: "16px", lineHeight: "16px" }}>
      {canEdit && (
        <button className="btn-secondary apr-1" onClick={() => setEditing(true)}>
          EDIT
        </button>
      )}
      {canDelete && (
        <button className="btn-secondary apr-1" onClick={remove} disabled={busy}>
          DELETE
        </button>
      )}
    </div>
  );
}
