"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { postReply } from "@/app/actions/forum";
import ForumSectionTitle from "@/components/forum/ForumSectionTitle";
import PostCanvas, { type PostCanvasRef } from "@/components/forum/PostCanvas";
import { MAX_BODY_LEN } from "@/lib/forum/types";

interface Props {
  topicId: number;
  /** The topic's live channel. Typing drafts ride on it -- no extra stream. */
  channel: string;
}

export default function ReplyComposer({ topicId, channel }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ansiRef = useRef<PostCanvasRef>(null);

  // Same debounce-and-POST shape as the release and request pages: the draft
  // goes out on the channel the page already holds open.
  const broadcastTyping = (value: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type: value ? "typing" : "clear", draft: value }),
      }).catch(() => {});
    }, 50);
  };

  const submit = async () => {
    if (busy) return;
    const body = text.trim();
    setBusy(true);
    const art = await ansiRef.current?.collect();
    if (art && "error" in art) {
      setBusy(false);
      toast(`[!] ${art.error}`, "danger");
      return;
    }
    const attachment = art?.attachment ?? null;
    // The server enforces this too; checking here saves a round trip.
    if (!body && !attachment) {
      setBusy(false);
      toast("[!] Write something or draw something before you post.", "danger");
      return;
    }
    const r = await postReply(topicId, body, attachment);
    setBusy(false);
    if (r.success) {
      setText("");
      broadcastTyping("");
      toast("[OK] Reply posted.");
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "Could not post your reply. Try again."}`, "danger");
    }
  };

  return (
    <div className="apt-1">
      <ForumSectionTitle>REPLY</ForumSectionTitle>
      <PostCanvas
        ref={ansiRef}
        label="Draw your reply. Type straight into the canvas, or leave it blank and just write below."
      />

      <textarea
        className="form-control"
        rows={4}
        maxLength={MAX_BODY_LEN}
        placeholder="Add a note to go with it (optional)..."
        style={{ resize: "vertical" }}
        value={text}
        onChange={e => {
          setText(e.target.value);
          broadcastTyping(e.target.value);
        }}
      />
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginTop: "8px" }}>
        Text is kept exactly as you type it, line breaks and all.
      </div>

      <div style={{ marginTop: "16px" }}>
        <input type="button" className="btn-big" value="POST REPLY" onClick={submit} disabled={busy} />
      </div>
    </div>
  );
}
