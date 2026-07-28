"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { createTopic } from "@/app/actions/forum";
import { MAX_BODY_LEN, MAX_TITLE_LEN } from "@/lib/forum/types";

const LABEL = {
  display: "block",
  marginBottom: "8px",
  fontFamily: "TopazPlus_a1200, monospace",
  fontSize: "16px",
  lineHeight: "16px",
} as const;

export default function NewTopicForm({ boardSlug, boardName }: { boardSlug: string; boardName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const r = await createTopic(boardSlug, title, body);
    setBusy(false);
    if (r.success && r.topicSlug) {
      toast("[OK] Topic created.");
      router.push(`/forum/${boardSlug}/${r.topicSlug}`);
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "Could not create the topic. Try again."}`, "danger");
    }
  };

  return (
    <div className="container-fluid bg-secondary ap-1" style={{ marginBottom: "16px" }}>
      <label className="lightgrey" style={LABEL} htmlFor="forum-title">
        Title
      </label>
      <input
        id="forum-title"
        className="form-control"
        type="text"
        maxLength={MAX_TITLE_LEN}
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoComplete="off"
      />

      <label className="lightgrey" style={{ ...LABEL, marginTop: "16px" }} htmlFor="forum-body">
        Message
      </label>
      <textarea
        id="forum-body"
        className="form-control"
        rows={12}
        maxLength={MAX_BODY_LEN}
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{ resize: "vertical" }}
      />
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginTop: "8px" }}>
        Plain text only. Line breaks are kept exactly as you type them.
      </div>

      <div className="d-flex" style={{ gap: "16px", marginTop: "16px", alignItems: "center" }}>
        <input type="button" className="btn-big" value="CREATE TOPIC" onClick={submit} disabled={busy} />
        <Link prefetch={false} href={`/forum/${boardSlug}`} className="lightgrey">
          {`< back to ${boardName}`}
        </Link>
      </div>
    </div>
  );
}
