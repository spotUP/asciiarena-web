"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import AnsiEditorPanel, {
  panelHeight,
  type AnsiEditorPanelRef,
} from "@/components/ui/AnsiEditor/AnsiEditorPanel";

/**
 * The forum's composing surface: the same full ANSI editor the site-logo
 * submit form embeds. On an ASCII art site the canvas is the post, so it takes
 * the textarea's place rather than hiding behind an "attach" toggle.
 *
 * Two differences from the logo form:
 *
 *   - A taller canvas. The logo editor's 80x10 is the site header's limit, and
 *     a forum post is not bound by it.
 *   - Deferred mount. The composer sits on every topic page, and the engine is
 *     ~200KB plus a canvas; loading that for every reader who never draws is
 *     wasteful. The editor mounts on first click, and the placeholder reserves
 *     the exact height it will take so nothing jumps.
 */

const CANVAS = { columns: 80, rows: 25 } as const;

export interface PostCanvasRef {
  /**
   * The art to post, or null when the author never drew anything (a text-only
   * post is perfectly valid). Errors only when the editor failed to load or
   * its export could not be read, so a drawing is never silently dropped.
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

const PostCanvas = forwardRef<PostCanvasRef, { label?: string }>(function PostCanvas({ label }, ref) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<AnsiEditorPanelRef>(null);

  useImperativeHandle(ref, () => ({
    collect: async () => {
      // Never opened: this is a text post, not a failure.
      if (!mounted) return { attachment: null };

      const panel = panelRef.current;
      if (!panel) return { error: "The editor is still loading. Try again." };
      if (panel.isEmpty()) return { attachment: null };

      const got = await panel.collect();
      if (!got) return { error: "The editor is still loading. Try again." };
      if ("error" in got) return { error: got.error };
      return { attachment: { b64: toBase64(got.bytes), font: got.font } };
    },
  }));

  return (
    <div>
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
        {label ?? "Draw your post, or leave the canvas closed and just write below."}
      </div>

      {mounted ? (
        <AnsiEditorPanel ref={panelRef} columns={CANVAS.columns} rows={CANVAS.rows} />
      ) : (
        <button
          type="button"
          onClick={() => setMounted(true)}
          title="Open the ANSI editor"
          className="bg-secondary w-100"
          style={{
            // Reserves the editor's exact footprint, so opening it does not
            // shove the rest of the form down the page.
            // All three: site.css pins every <button> to min/max-height 48px,
            // and only an inline min-height overrides the min.
            height: panelHeight(CANVAS.rows),
            minHeight: panelHeight(CANVAS.rows),
            maxHeight: panelHeight(CANVAS.rows),
            marginBottom: 16,
            border: "1px solid #555",
            cursor: "pointer",
            fontFamily: "TopazPlus_a1200, monospace",
            fontSize: "16px",
            lineHeight: "16px",
          }}
        >
          {`[ CLICK TO DRAW - ${CANVAS.columns} x ${CANVAS.rows} ANSI CANVAS ]`}
        </button>
      )}
    </div>
  );
});

export default PostCanvas;
