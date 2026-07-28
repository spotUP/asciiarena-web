"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { postReply } from "@/app/actions/forum";
import ForumSectionTitle from "@/components/forum/ForumSectionTitle";
import PostCanvas, { type PostCanvasRef } from "@/components/forum/PostCanvas";

interface Props {
  topicId: number;
  /** The topic's live channel. Drafts ride on it -- no extra stream. */
  channel: string;
}

/**
 * The reply box is the editor: you write and draw in the same canvas, so there
 * is no separate text field. The characters typed into the canvas are read
 * back out as the post's `body`, which is what @mentions and the fulltext
 * index work from.
 */
export default function ReplyComposer({ topicId, channel }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<PostCanvasRef>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const art = await canvasRef.current?.collect();
    if (art && "error" in art) {
      setBusy(false);
      toast(`[!] ${art.error}`, "danger");
      return;
    }
    const attachment = art?.attachment ?? null;
    // The server enforces this too; checking here saves a round trip.
    if (!attachment) {
      setBusy(false);
      toast("[!] Write or draw something before you post.", "danger");
      return;
    }
    const r = await postReply(topicId, art?.text ?? "", attachment);
    setBusy(false);
    if (r.success) {
      canvasRef.current?.clearDraft();
      toast("[OK] Reply posted.");
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "Could not post your reply. Try again."}`, "danger");
    }
  };

  return (
    <div className="apt-1">
      <ForumSectionTitle>REPLY</ForumSectionTitle>
      <PostCanvas ref={canvasRef} channel={channel} label="Write or draw your reply." />

      <div style={{ marginTop: "16px" }}>
        <input type="button" className="btn-big" value="POST REPLY" onClick={submit} disabled={busy} />
      </div>
    </div>
  );
}
