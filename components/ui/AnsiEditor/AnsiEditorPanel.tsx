"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import AnsiEditor, { type AnsiEditorRef } from "@/components/ui/AnsiEditor/AnsiEditor";

/**
 * The ANSI editor as the site actually embeds it: a correctly-sized host box
 * plus the blank-canvas guard every caller needs.
 *
 * Extracted from app/submit/SubmitClient.tsx (the site-logo submit form) so the
 * forum composer embeds the identical thing rather than a second, drifting
 * copy. Both get the same 80x10 canvas, the same box height, and the same
 * "you drew nothing" rule.
 */

export interface AnsiEditorPanelRef {
  /**
   * Read the canvas. Returns the exported .ans bytes plus the engine font name,
   * or a message explaining why there is nothing to submit.
   *
   * Uint8Array<ArrayBuffer>, not the default Uint8Array<ArrayBufferLike>: the
   * wider type does not satisfy BlobPart, so callers could not build a File
   * from it without copying all over again.
   */
  collect: () => Promise<{ bytes: Uint8Array<ArrayBuffer>; font: string } | { error: string }>;
  /** True when the canvas is blank. Cheap; no export. */
  isEmpty: () => boolean;
}

/**
 * The editor's sections stack vertically and editor.css clips overflow, so the
 * host needs a definite height or the `height:100%` chain collapses to zero.
 *
 * 348 = DosSelect font row (24) + header (43) + palette strip (64) + viewport
 * (10 rows x 16px canvas + 16px margins = 176) + horizontal tool bar (40),
 * rounded up by one. Kept as an expression so the arithmetic is checkable
 * rather than a magic number.
 */
const CANVAS_ROWS = 10;
const PANEL_HEIGHT = 24 + 43 + 64 + (CANVAS_ROWS * 16 + 16) + 40 + 1;

const AnsiEditorPanel = forwardRef<AnsiEditorPanelRef, { onReady?: () => void }>(
  function AnsiEditorPanel({ onReady }, ref) {
    const editorRef = useRef<AnsiEditorRef>(null);

    useImperativeHandle(ref, () => ({
      isEmpty: () => editorRef.current?.isEmpty() ?? true,

      collect: async () => {
        const editor = editorRef.current;
        if (!editor) return { error: "The editor is still loading. Try again." };
        // A blank 80x10 export is still ~960 bytes of spaces plus a SAUCE
        // record, so byte length cannot tell you the canvas is empty.
        if (editor.isEmpty()) return { error: "Draw something before you post." };

        const bytes = await editor.getAnsiBytes();
        if (!bytes || bytes.length === 0) return { error: "Could not read the canvas. Try again." };

        // Copy into a fresh ArrayBuffer-backed view: getAnsiBytes returns a
        // generic Uint8Array, which does not satisfy BlobPart for callers that
        // build a File out of it.
        const copy = new Uint8Array(bytes.length);
        copy.set(bytes);
        return { bytes: copy, font: editor.getCurrentFont() };
      },
    }));

    return (
      <div style={{ width: "100%", height: PANEL_HEIGHT, marginBottom: 16 }}>
        <AnsiEditor ref={editorRef} onReady={onReady} />
      </div>
    );
  },
);

export default AnsiEditorPanel;
