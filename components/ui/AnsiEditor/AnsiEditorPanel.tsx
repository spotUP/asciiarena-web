"use client";

import type React from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
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
 * Height of the row/column button strip below the editor. It is reserved on top
 * of CHROME_HEIGHT because it lives OUTSIDE the engine's box: #bodyContainer
 * positions header, viewport and tool row absolutely with no gap between them
 * (the viewport's bottom edge is exactly the tool row's top edge), so there is
 * nowhere inside to put another row without moving --content-top and every
 * absolutely positioned region with it.
 */
const ROW_COLUMN_BAR_HEIGHT = 40;

/**
 * Row and column editing, which the engine only ever exposed inside the Edit
 * menu. That menu is now a shortcut dialog, so without these the actions would
 * be keyboard-only.
 *
 * Each button clicks the engine's own menu entry by id rather than
 * reimplementing anything: the engine already wires those elements, so there is
 * exactly one implementation of each action and no second code path to drift.
 * The entries stay in the dialog too, which is what those clicks land on.
 */
const ROW_COLUMN_ACTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "insertRow", label: "Insert Row" },
  { id: "deleteRow", label: "Delete Row" },
  { id: "eraseRow", label: "Erase Row" },
  { id: "insertColumn", label: "Insert Column" },
  { id: "deleteColumn", label: "Delete Column" },
  { id: "eraseColumn", label: "Erase Column" },
];

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
/**
 * The engine's own box. It fills this exactly -- .ansi-editor-root is taken out
 * of normal flow -- so anything rendered as a child of the same div lands on top
 * of the editor instead of below it. The row/column bar is a sibling of this
 * box, not a child.
 */
function editorBoxHeight(rows: number): number {
  return CHROME_HEIGHT + rows * ROW_HEIGHT;
}

export function panelHeight(rows: number): number {
  return editorBoxHeight(rows) + ROW_COLUMN_BAR_HEIGHT;
}

interface AnsiEditorPanelProps {
  onReady?: () => void;
  /** Canvas width in character columns. Default: 80. */
  columns?: number;
  /** Canvas height in character rows. Default: the logo form's 10. */
  rows?: number;
  /**
   * Show the File menu's save and export items. Default: true.
   * The forum composer passes false -- a post is delivered by posting it.
   */
  fileExport?: boolean;
}

const AnsiEditorPanel = forwardRef<AnsiEditorPanelRef, AnsiEditorPanelProps>(
  function AnsiEditorPanel(
    { onReady, columns = LOGO_CANVAS.columns, rows = LOGO_CANVAS.rows, fileExport },
    ref,
  ) {
    const editorRef = useRef<AnsiEditorRef>(null);
    const hostRef = useRef<HTMLDivElement>(null);

    /**
     * The canvas's live row count. Seeded from the prop, then followed.
     *
     * Insert Row and Delete Row rebuild the canvas a row taller or shorter. The
     * box reserved here has to move with it, or the canvas overflows its
     * viewport and the scrollbars reappear until the canvas is cleared.
     */
    const [liveRows, setLiveRows] = useState(rows);
    const handleRowsChange = useCallback((next: number) => {
      // The engine reports 0 before its canvas exists; ignore that rather than
      // collapsing the box to nothing.
      if (next > 0) setLiveRows(next);
    }, []);

    /**
     * Trigger an engine action by clicking the element the engine wired.
     *
     * Scoped to this panel's own DOM rather than document-wide, so two editors
     * on one page cannot drive each other. A missing element means the engine
     * changed its markup, which is worth a console error rather than silence.
     */
    const runEngineAction = useCallback((id: string) => {
      const el = hostRef.current?.querySelector<HTMLElement>(`#${id}`);
      if (!el) {
        console.error(`[AnsiEditorPanel] no engine element #${id} to click`);
        return;
      }
      el.click();
    }, []);

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
        ref={hostRef}
        style={
          {
            width: "100%",
            marginBottom: 16,
            "--ansi-viewport-size": viewportSize(liveRows),
          } as React.CSSProperties
        }
      >
        <div style={{ width: "100%", height: editorBoxHeight(liveRows) }}>
          <AnsiEditor
            ref={editorRef}
            onReady={onReady}
            columns={columns}
            rows={rows}
            fileExport={fileExport}
            onCanvasRowsChange={handleRowsChange}
          />
        </div>
        <div
          role="group"
          aria-label="Rows and columns"
          style={{
            height: ROW_COLUMN_BAR_HEIGHT,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {ROW_COLUMN_ACTIONS.map(action => (
            <button
              key={action.id}
              type="button"
              onClick={() => runEngineAction(action.id)}
              style={{
                height: 32,
                minHeight: 0,
                padding: "0 8px",
                whiteSpace: "nowrap",
                border: 0,
                cursor: "pointer",
              }}
              className="bg-secondary lightgrey"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

export default AnsiEditorPanel;
