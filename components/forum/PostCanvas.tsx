"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import AnsiEditorPanel, {
  panelHeight,
  type AnsiEditorPanelRef,
} from "@/components/ui/AnsiEditor/AnsiEditorPanel";
import { MIN_COLUMNS, columnsForPanel } from "@/lib/post-canvas-layout";

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

export interface PostCanvasRef {
  /**
   * The art to post plus the plain text typed into it, or nulls when the
   * author never drew anything. Errors only when the editor failed to load or
   * its export could not be read, so a drawing is never silently dropped.
   */
  collect: () => Promise<
    { attachment: { b64: string; font: string } | null; text: string } | { error: string }
  >;
  /** Tell other viewers the draft is finished. Called after a successful post. */
  clearDraft: () => void;
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

interface PostCanvasProps {
  label?: string;
  /**
   * Live channel to publish drafts on. The canvas broadcasts its text as it is
   * typed, the same way the wall and the release page do, so other people
   * watching the topic see it appear character by character.
   */
  channel?: string;
}

/** Debounce for draft broadcasts: fast enough to read as live, cheap enough not to flood. */
const DRAFT_DEBOUNCE_MS = 150;

const PostCanvas = forwardRef<PostCanvasRef, PostCanvasProps>(function PostCanvas({ label, channel }, ref) {
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
        // columnsForPanel takes the canvas gutter off the panel width; passing
        // the full width is what put scrollbars inside the canvas.
        setColumns(columnsForPanel(el.getBoundingClientRect().width));
        setMounted(true);
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const publish = useCallback(
    (type: "typing" | "clear", draft: string) => {
      if (!channel) return;
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type, draft }),
      }).catch(() => {});
    },
    [channel],
  );

  // The engine fires these on the document as the canvas changes: keypress for
  // typing, onTextCanvasUp when a draw stroke finishes. Same events
  // bootstrap.js already saves on, so this needs no engine change.
  useEffect(() => {
    if (!mounted || !channel) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        publish("typing", panelRef.current?.getText() ?? "");
      }, DRAFT_DEBOUNCE_MS);
    };
    document.addEventListener("keypress", onChange);
    document.addEventListener("onTextCanvasUp", onChange);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("keypress", onChange);
      document.removeEventListener("onTextCanvasUp", onChange);
      // Leaving the page should not strand a draft on other people's screens.
      publish("clear", "");
    };
  }, [mounted, channel, publish]);

  useImperativeHandle(ref, () => ({
    clearDraft: () => publish("clear", ""),

    collect: async () => {
      // The editor never loaded, so there is nothing drawn.
      if (!mounted) return { attachment: null, text: "" };

      const panel = panelRef.current;
      if (!panel) return { error: "The editor is still loading. Try again." };
      if (panel.isEmpty()) return { attachment: null, text: "" };

      const got = await panel.collect();
      if (!got) return { error: "The editor is still loading. Try again." };
      if ("error" in got) return { error: got.error };
      // The text goes in alongside the art: it is what @mentions are scanned
      // out of and what the fulltext index searches.
      return { attachment: { b64: toBase64(got.bytes), font: got.font }, text: got.text };
    },
  }));

  return (
    <div>
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
        {label ?? "Write or draw your post."}
      </div>

      {/* fileExport={false}: no save/export in the forum, because a post is
          delivered by posting it, so "Save as XBin" and "Export as PNG" are
          noise here. The logo form keeps them -- there the artwork is a file
          you are submitting. */}
      {mounted ? (
        <AnsiEditorPanel ref={panelRef} columns={columns} rows={ROWS} fileExport={false} />
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
