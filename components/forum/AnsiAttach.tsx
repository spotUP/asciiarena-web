"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AnsiEditorPanel, { type AnsiEditorPanelRef } from "@/components/ui/AnsiEditor/AnsiEditorPanel";

/**
 * "Attach ANSI art" for a forum post: a toggle plus the shared editor panel
 * (the same one the site-logo submit form embeds).
 *
 * The editor is only mounted while the toggle is on, so a reader who just wants
 * to type a reply never pays for ~200KB of engine code or a canvas.
 */

export interface AnsiAttachRef {
  /**
   * The attachment to send, or null when the author did not open the editor.
   * Returns an error string when the editor is open but has nothing on it, so
   * the caller can refuse to post rather than silently dropping the art.
   */
  collect: () => Promise<{ attachment: { b64: string; font: string } | null } | { error: string }>;
}

/** Base64 in fixed chunks: String.fromCharCode(...bytes) blows the stack on a big canvas. */
function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const AnsiAttach = forwardRef<AnsiAttachRef, { disabled?: boolean }>(function AnsiAttach(
  { disabled },
  ref,
) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<AnsiEditorPanelRef>(null);

  useImperativeHandle(ref, () => ({
    collect: async () => {
      if (!open) return { attachment: null };
      const got = await panelRef.current?.collect();
      if (!got) return { error: "The editor is still loading. Try again." };
      if ("error" in got) return { error: got.error };
      return { attachment: { b64: toBase64(got.bytes), font: got.font } };
    },
  }));

  return (
    <div style={{ marginTop: "16px" }}>
      <button
        type="button"
        className="btn-secondary apr-1"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
      >
        {open ? "REMOVE ANSI ART" : "ATTACH ANSI ART"}
      </button>

      {open && (
        <div style={{ marginTop: "16px" }}>
          <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
            Draw an 80 x 10 ANSI panel. It posts alongside your text, or on its own.
          </div>
          <AnsiEditorPanel ref={panelRef} />
        </div>
      )}
    </div>
  );
});

export default AnsiAttach;
