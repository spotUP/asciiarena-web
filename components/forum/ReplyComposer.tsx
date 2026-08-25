"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { actionErrorMessage } from "@/lib/staleDeployment";
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
  /**
   * The editor is mounted only while the composer is open.
   *
   * That is also what clears it: the engine locks its canvas at mount and has
   * no reset short of the Clear canvas dialog, so a posted reply used to sit
   * there afterwards, ready to be posted a second time. Closing on success
   * unmounts the editor, and the next REPLY mounts a fresh, empty one.
   */
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<PostCanvasRef>(null);

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
      const art = await canvasRef.current?.collect();
      if (art && "error" in art) {
        toast(`[!] ${art.error}`, "danger");
        return;
      }
      const attachment = art?.attachment ?? null;
      // The server enforces this too; checking here saves a round trip.
      if (!attachment) {
        toast("[!] Write or draw something before you post.", "danger");
        return;
      }
      const r = await postReply(topicId, art?.text ?? "", attachment);
      if (r.success) {
        canvasRef.current?.clearDraft();
        // Closing unmounts the editor, so the reply cannot be posted twice and
        // the next one starts blank. On failure the composer stays open with
        // the work still in it.
        setOpen(false);
        toast("[OK] Reply posted.");
        router.refresh();
      } else {
        toast(`[!] ${r.error ?? "Could not post your reply. Try again."}`, "danger");
      }
    } catch (err) {
      console.error("[ReplyComposer] posting threw", err);
      toast(`[!] ${actionErrorMessage(err, "Could not post your reply. Try again.")}`, "danger");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="apt-1">
        <input
          type="button"
          className="btn-big"
          value="REPLY"
          onClick={() => setOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="apt-1">
      <ForumSectionTitle>REPLY</ForumSectionTitle>
      <PostCanvas ref={canvasRef} channel={channel} label="Write or draw your reply." />

      <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
        <input type="button" className="btn-big" value="POST REPLY" onClick={submit} disabled={busy} />
        {/* Without this, opening the composer is one-way: the editor covers the
            thread until you post something or reload the page. */}
        <input
          type="button"
          className="btn-big"
          value="CANCEL"
          onClick={() => setOpen(false)}
          disabled={busy}
        />
      </div>
    </div>
  );
}
