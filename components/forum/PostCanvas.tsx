"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
 *   - A canvas sized to the page, not to the site header. The logo editor's
 *     80x10 is the header's limit; a forum post is bound by neither its width
 *     nor its height, so the canvas takes the composer's full width.
 *   - Deferred load. The composer sits on every topic page and the engine is
 *     ~200KB plus a canvas, so it is not fetched until the composer comes into
 *     view. That is a loading detail, not a UI gate: the editor is the default
 *     surface and arrives on its own, with the placeholder holding its exact
 *     height so nothing jumps. Nobody has to click to get an editor.
 */

const ROWS = 25;

/**
 * Character cell width in the editor's 8xN bitmap fonts.
 */
const CELL_WIDTH = 8;

/**
 * A forum post is not a site logo, so the canvas is not pinned to 80 columns.
 * It takes whatever the composer column gives it, within reason: narrower than
 * 80 stops being usable for art, and past ~240 the export gets silly.
 */
const MIN_COLUMNS = 80;
const MAX_COLUMNS = 240;

function columnsFor(pixelWidth: number): number {
  const fits = Math.floor(pixelWidth / CELL_WIDTH);
  return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, fits));
}

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
  const [columns, setColumns] = useState(MIN_COLUMNS);
  const panelRef = useRef<AnsiEditorPanelRef>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  // Mount as soon as the composer is anywhere near the viewport. rootMargin is
  // generous so the editor is ready before it is scrolled to, and any browser
  // without IntersectionObserver just gets it immediately -- the editor being
  // present is the requirement; deferring is only an optimisation.
  useEffect(() => {
    if (mounted) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const el = slotRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        // Measured off the placeholder, which already occupies the exact box
        // the editor will take, so the canvas is sized before it is created.
        // The engine locks the canvas at mount, so this cannot be revised
        // later without discarding the drawing.
        setColumns(columnsFor(el.getBoundingClientRect().width));
        setMounted(true);
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  useImperativeHandle(ref, () => ({
    collect: async () => {
      // The editor never loaded, so there is nothing drawn: a text post.
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
        {label ?? "Write or draw your post."}
      </div>

      {mounted ? (
        <AnsiEditorPanel ref={panelRef} columns={columns} rows={ROWS} />
      ) : (
        <div
          ref={slotRef}
          className="bg-secondary lightgrey"
          style={{
            // Reserves the editor's exact footprint so its arrival does not
            // shove the rest of the form down the page.
            height: panelHeight(ROWS),
            marginBottom: 16,
            border: "1px solid #555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "TopazPlus_a1200, monospace",
            fontSize: "16px",
            lineHeight: "16px",
          }}
        >
          {"[ loading the editor... ]"}
        </div>
      )}
    </div>
  );
});

export default PostCanvas;
