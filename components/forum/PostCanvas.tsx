"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import AnsiEditorPanel, { type AnsiEditorPanelRef } from "@/components/ui/AnsiEditor/AnsiEditorPanel";

/**
 * The forum's composing surface: the same full ANSI editor the site-logo
 * submit form uses, mounted directly in the composer rather than hidden behind
 * an "attach" toggle. On an ASCII art site the canvas is the post.
 *
 * Text is not gone -- the composer keeps a caption field underneath -- but the
 * editor is the primary surface, and you can also just type into the canvas.
 */

export interface PostCanvasRef {
  /**
   * The art to post, or null when the author left the canvas blank (a
   * text-only post is still perfectly valid). Errors only when the editor
   * failed to load or the export could not be read, so a drawing is never
   * silently dropped.
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
  const panelRef = useRef<AnsiEditorPanelRef>(null);

  useImperativeHandle(ref, () => ({
    collect: async () => {
      const panel = panelRef.current;
      if (!panel) return { error: "The editor is still loading. Try again." };
      // A blank canvas is not a failure here, unlike the logo form: it just
      // means this is a text post.
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
        {label ?? "Draw your post. Type straight into the canvas, or leave it blank for a text-only post."}
      </div>
      <AnsiEditorPanel ref={panelRef} />
    </div>
  );
});

export default PostCanvas;
