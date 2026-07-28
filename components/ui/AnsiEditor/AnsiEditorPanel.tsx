"use client";

import type React from "react";
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
  collect: () => Promise<{ bytes: Uint8Array<ArrayBuffer>; font: string; text: string } | { error: string }>;
  /** True when the canvas is blank. Cheap; no export. */
  isEmpty: () => boolean;
  /** The typed characters on the canvas, as plain text. Cheap; no export. */
  getText: () => string;
}

/**
 * The editor's sections stack vertically and editor.css clips overflow, so the
 * host needs a definite height or the `height:100%` chain collapses to zero.
 *
 * The chrome around the canvas is fixed: DosSelect font row (24) + header (43)
 * + palette strip (64) + horizontal tool bar (40) + the viewport's 16px
 * margins, plus one rounding pixel. Only the canvas itself scales with the row
 * count. Written as the sum it was derived from rather than the literal 348
 * the logo form used, so a different row count stays correct.
 */
const CHROME_HEIGHT = 24 + 43 + 64 + 40 + 16 + 1;
const ROW_HEIGHT = 16;

/**
 * editor.css sizes the canvas viewport from --viewport-size, which it hardcodes
 * to 176px: the 80x10 logo canvas plus its margins. Any taller canvas was
 * clipped inside that 176px (with a scrollbar) while the host box reserved the
 * full height, leaving a block of dead space underneath. The variable has to
 * track the row count, so the panel sets it.
 */
function viewportSize(rows: number): string {
  return `${rows * ROW_HEIGHT + 16}px`;
}

/** The site-logo header limit. Only the logo form is bound by it. */
export const LOGO_CANVAS = { columns: 80, rows: 10 } as const;

/**
 * The box the editor will occupy at a given row count. Exported so a caller
 * that defers mounting can reserve the space up front and avoid the page
 * jumping when the editor appears.
 */
export function panelHeight(rows: number): number {
  return CHROME_HEIGHT + rows * ROW_HEIGHT;
}

interface AnsiEditorPanelProps {
  onReady?: () => void;
  /** Canvas width in character columns. Default: 80. */
  columns?: number;
  /** Canvas height in character rows. Default: the logo form's 10. */
  rows?: number;
}

const AnsiEditorPanel = forwardRef<AnsiEditorPanelRef, AnsiEditorPanelProps>(
  function AnsiEditorPanel({ onReady, columns = LOGO_CANVAS.columns, rows = LOGO_CANVAS.rows }, ref) {
    const editorRef = useRef<AnsiEditorRef>(null);

    useImperativeHandle(ref, () => ({
      isEmpty: () => editorRef.current?.isEmpty() ?? true,
      getText: () => editorRef.current?.getText() ?? "",

      collect: async () => {
        const editor = editorRef.current;
        if (!editor) return { error: "The editor is still loading. Try again." };
        // A blank export is still hundreds of bytes of spaces plus a SAUCE
        // record, so byte length cannot tell you the canvas is empty.
        if (editor.isEmpty()) return { error: "Draw something before you post." };

        const bytes = await editor.getAnsiBytes();
        if (!bytes || bytes.length === 0) return { error: "Could not read the canvas. Try again." };

        // Copy into a fresh ArrayBuffer-backed view: getAnsiBytes returns a
        // generic Uint8Array, which does not satisfy BlobPart for callers that
        // build a File out of it.
        const copy = new Uint8Array(bytes.length);
        copy.set(bytes);
        return { bytes: copy, font: editor.getCurrentFont(), text: editor.getText() };
      },
    }));

    return (
      <div
        style={
          {
            width: "100%",
            height: panelHeight(rows),
            marginBottom: 16,
            "--ansi-viewport-size": viewportSize(rows),
          } as React.CSSProperties
        }
      >
        <AnsiEditor ref={editorRef} onReady={onReady} columns={columns} rows={rows} />
      </div>
    );
  },
);

export default AnsiEditorPanel;
