"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { postReply } from "@/app/actions/forum";
import ForumSectionTitle from "@/components/forum/ForumSectionTitle";
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
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const r = await postReply(topicId, body);
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
      <textarea
        className="form-control"
        rows={6}
        maxLength={MAX_BODY_LEN}
        placeholder="Write your reply..."
        style={{ resize: "vertical" }}
        value={text}
        onChange={e => {
          setText(e.target.value);
          broadcastTyping(e.target.value);
        }}
      />
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginTop: "8px" }}>
        Plain text only. Line breaks are kept exactly as you type them.
      </div>
      <div style={{ marginTop: "16px" }}>
        <input type="button" className="btn-big" value="POST REPLY" onClick={submit} disabled={busy} />
      </div>
    </div>
  );
}
