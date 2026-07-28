"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteTopic, setTopicState } from "@/app/actions/forum";

interface Props {
  topicId: number;
  boardSlug: string;
  pinned: boolean;
  locked: boolean;
}

// Inline moderation on the public topic page, the way requests already work --
// no second listing surface in /admin for individual threads.
export default function TopicModeration({ topicId, boardSlug, pinned, locked }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) => {
    if (busy) return;
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.success) {
      toast(`[OK] ${ok}`);
      router.refresh();
    } else {
      toast(`[!] ${r.error ?? "That did not work. Try again."}`, "danger");
    }
  };

  return (
    <div className="d-flex justify-content-end" style={{ gap: "8px", marginBottom: "16px" }}>
      <button
        className="btn-secondary apr-1"
        disabled={busy}
        onClick={() => run(() => setTopicState(topicId, { pinned: !pinned }), pinned ? "Topic unpinned." : "Topic pinned.")}
      >
        {pinned ? "UNPIN" : "PIN"}
      </button>
      <button
        className="btn-secondary apr-1"
        disabled={busy}
        onClick={() => run(() => setTopicState(topicId, { locked: !locked }), locked ? "Topic unlocked." : "Topic locked.")}
      >
        {locked ? "UNLOCK" : "LOCK"}
      </button>
      <button
        className="btn-secondary apr-1"
        disabled={busy}
        onClick={() => {
          if (!confirm("Delete this topic and every reply in it? An administrator can undo this.")) return;
          run(async () => {
            const r = await deleteTopic(topicId);
            if (r.success) router.push(`/forum/${boardSlug}`);
            return r;
          }, "Topic deleted.");
        }}
      >
        DELETE
      </button>
    </div>
  );
}
