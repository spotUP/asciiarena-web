"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Board management, inline on the forum index, for moderators.
 *
 * These actions all existed already -- behind /admin/forum. Topic moderation
 * (pin, lock, delete) is inline on a topic, so having to leave the forum to
 * touch a board was the odd one out.
 *
 * It drives the same PATCH endpoint the admin form uses rather than adding
 * server actions of its own, so there is one place that writes a board and one
 * set of permission checks. Editing still opens the admin form: a board has
 * rank rules and a slug, which is more than a row of buttons should own.
 */
interface Props {
  boardId: number;
  locked: boolean;
  hidden: boolean;
  /** Position in the displayed list, and the neighbours to swap with. */
  index: number;
  prevBoard: { id: number; index: number } | null;
  nextBoard: { id: number; index: number } | null;
}

export default function BoardModeration({ boardId, locked, hidden, index, prevBoard, nextBoard }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const patch = async (id: number, body: Record<string, unknown>): Promise<boolean> => {
    const res = await fetch(`/api/admin/forum/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const run = async (label: string, work: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    const ok = await work();
    setBusy(false);
    if (ok) {
      router.refresh();
    } else {
      toast(`[!] Could not ${label}.`, "danger");
    }
  };

  // Swapping writes BOTH positions from their index in the displayed list, not
  // from the stored sort_order. Boards created without an explicit order all
  // share sort_order 0, and swapping equal values would do nothing at all --
  // this normalises them the first time anyone moves one.
  const swapWith = (other: { id: number; index: number }) => async () => {
    const a = await patch(boardId, { sortOrder: other.index });
    const b = await patch(other.id, { sortOrder: index });
    return a && b;
  };

  return (
    <span style={{ display: "inline-flex", gap: "8px" }}>
      <Link prefetch={false} href={`/admin/forum/${boardId}`} className="lightcyan">
        [edit]
      </Link>
      <button
        type="button"
        className="lightcyan"
        style={BARE}
        disabled={busy}
        onClick={() => run("lock this board", () => patch(boardId, { locked: !locked }))}
      >
        {locked ? "[unlock]" : "[lock]"}
      </button>
      <button
        type="button"
        className="lightcyan"
        style={BARE}
        disabled={busy}
        onClick={() => run("hide this board", () => patch(boardId, { hidden: !hidden }))}
      >
        {hidden ? "[show]" : "[hide]"}
      </button>
      {prevBoard && (
        <button
          type="button"
          className="lightcyan"
          style={BARE}
          disabled={busy}
          onClick={() => run("move this board", swapWith(prevBoard))}
          aria-label="Move board up"
        >
          [up]
        </button>
      )}
      {nextBoard && (
        <button
          type="button"
          className="lightcyan"
          style={BARE}
          disabled={busy}
          onClick={() => run("move this board", swapWith(nextBoard))}
          aria-label="Move board down"
        >
          [down]
        </button>
      )}
    </span>
  );
}

/** Buttons that read as the site's bracket links, not as chrome. */
const BARE: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  font: "inherit",
  lineHeight: "16px",
  cursor: "pointer",
};
