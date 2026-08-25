"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { actionErrorMessage } from "@/lib/staleDeployment";
import { createTopic } from "@/app/actions/forum";
import PostCanvas, { type PostCanvasRef } from "@/components/forum/PostCanvas";
import { MAX_TITLE_LEN } from "@/lib/forum/types";

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
  const [busy, setBusy] = useState(false);
  const ansiRef = useRef<PostCanvasRef>(null);

  /**
   * Anything thrown in here used to vanish: the await rejected, the handler
   * stopped, no toast was shown and `busy` stayed true, which quietly disabled
   * the button. From the reader's side, posting simply did nothing. A failure
   * has to say what it was.
   */
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const art = await ansiRef.current?.collect();
      if (art && "error" in art) {
        toast(`[!] ${art.error}`, "danger");
        return;
      }
      const attachment = art?.attachment ?? null;
      if (!attachment) {
        toast("[!] Write or draw something before you post.", "danger");
        return;
      }
      const r = await createTopic(boardSlug, title, art?.text ?? "", attachment);
      if (r.success && r.topicSlug) {
        toast("[OK] Topic created.");
        router.push(`/forum/${boardSlug}/${r.topicSlug}`);
        router.refresh();
      } else {
        toast(`[!] ${r.error ?? "Could not create the topic. Try again."}`, "danger");
      }
    } catch (err) {
      console.error("[NewTopicForm] posting threw", err);
      toast(`[!] ${actionErrorMessage(err, "Could not create the topic. Try again.")}`, "danger");
    } finally {
      setBusy(false);
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

      <label className="lightgrey" style={{ ...LABEL, marginTop: "16px" }}>
        Message
      </label>
      <PostCanvas ref={ansiRef} label="Write or draw your post." />

      <div className="d-flex" style={{ gap: "16px", marginTop: "16px", alignItems: "center" }}>
        <input type="button" className="btn-big" value="CREATE TOPIC" onClick={submit} disabled={busy} />
        <Link prefetch={false} href={`/forum/${boardSlug}`} className="lightgrey">
          {`< back to ${boardName}`}
        </Link>
      </div>
    </div>
  );
}
