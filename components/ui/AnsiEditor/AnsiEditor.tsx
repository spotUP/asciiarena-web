"use client";

/**
 * AnsiEditor — React wrapper for the text0wnz ANSI editor engine.
 *
 * SSR safety: the engine (mount.ts → engine/*.js) uses browser APIs
 * (document, HTMLCanvasElement) that do not exist in Node.  The value
 * `initAnsiEditor` is imported ONLY inside a useEffect so it is never
 * evaluated during Next.js prerender.  The type imports (`EditorHandle`,
 * `EditorOpts`) are erased at compile time and are safe at module level.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import DosSelect from "@/components/ui/DosSelect";
import type { EditorHandle } from "./mount";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AnsiEditorRef {
  getAnsiBytes: () => Promise<Uint8Array>;
  /**
   * True when the canvas is blank (every cell is a space). Lets callers
   * reject an empty logo, since a blank export is still ~782 bytes.
   */
  isEmpty: () => boolean;
  /** The curated list of font names the editor offers. */
  getFonts: () => string[];
  /** The font the canvas is currently rendering in. */
  getCurrentFont: () => string;
  /** Switch the canvas font (re-renders in the new font). */
  setFont: (name: string) => void;
}

/**
 * Build a DosSelect option from a font `data-value`. The engine's font names
 * already double as human labels (e.g. "Topaz+ 1200 8x16"), so value === label.
 */
function fontOption(name: string): { value: string; label: string } {
  return { value: name, label: name };
}

interface AnsiEditorProps {
  onReady?: () => void;
  /** Canvas width in character columns. Default: the engine's 80. */
  columns?: number;
  /** Canvas height in character rows. Default: the engine's 10. */
  rows?: number;
  /** Starting font, as an engine font name. Default: "Topaz+ 1200 8x16". */
  font?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AnsiEditor = forwardRef<AnsiEditorRef, AnsiEditorProps>(
  function AnsiEditor({ onReady, columns, rows, font }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<EditorHandle | null>(null);
    const [failed, setFailed] = useState(false);
    // Font-picker state, hydrated once the engine is ready. Empty until then
    // so the (SSR-safe) initial render has nothing engine-specific in it.
    const [fonts, setFonts] = useState<string[]>([]);
    const [currentFont, setCurrentFont] = useState("");

    // Stable wrapper so the mount effect (which intentionally has an empty dep
    // array) can call the caller's onReady AND hydrate the picker without
    // re-running and tearing down the canvas.
    const handleReady = useCallback(() => {
      const handle = handleRef.current;
      if (handle) {
        setFonts(handle.getFonts());
        setCurrentFont(handle.getCurrentFont());
      }
      onReady?.();
    }, [onReady]);

    useEffect(() => {
      // Cancelled flag guards the async-import race: if the component unmounts
      // before the dynamic import resolves we must not init (or must destroy
      // immediately if it snuck through).
      let cancelled = false;

      async function mount() {
        if (!hostRef.current) return;

        let mod: { initAnsiEditor: (typeof import("./mount"))["initAnsiEditor"] };
        try {
          // Dynamic import — evaluated only in the browser, never during SSR.
          mod = await import("./mount");
        } catch (err) {
          if (cancelled) return;
          console.error("[AnsiEditor] failed to load engine module", err);
          setFailed(true);
          return;
        }

        // Component may have unmounted while the import was in flight.
        if (cancelled || !hostRef.current) return;

        let handle: EditorHandle;
        try {
          handle = mod.initAnsiEditor(hostRef.current, {
            onReady: handleReady,
            ...(columns ? { columns } : {}),
            ...(rows ? { rows } : {}),
            ...(font ? { font } : {}),
          });
        } catch (err) {
          if (cancelled) return;
          console.error("[AnsiEditor] initAnsiEditor threw", err);
          setFailed(true);
          return;
        }

        // One final cancellation check before we persist the handle.
        if (cancelled) {
          handle.destroy();
          return;
        }

        handleRef.current = handle;
      }

      void mount();

      return () => {
        // React 18/19 StrictMode calls mount→cleanup→mount in dev.
        // Setting cancelled=true prevents the first async mount from
        // initiating after cleanup, and we destroy any handle that did
        // complete before the cleanup ran.
        cancelled = true;
        if (handleRef.current) {
          handleRef.current.destroy();
          handleRef.current = null;
        }
      };
      // columns/rows/font are read once at mount, for the same reason: resizing
      // the canvas mid-edit would throw away the drawing.
      // handleReady (and the onReady it wraps) is intentionally excluded:
      // re-running the effect when a caller changes the callback would destroy
      // and re-create the canvas, which is almost never what's wanted. Callers
      // should stabilise their onReady with useCallback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getAnsiBytes: async () => {
          if (!handleRef.current) {
            throw new Error("AnsiEditor: editor not ready");
          }
          return handleRef.current.getAnsiBytes();
        },
        isEmpty: () => {
          // No handle yet → nothing drawn → empty.
          if (!handleRef.current) return true;
          return handleRef.current.isEmpty();
        },
        getFonts: () => handleRef.current?.getFonts() ?? [],
        getCurrentFont: () => handleRef.current?.getCurrentFont() ?? "",
        setFont: (name: string) => {
          handleRef.current?.setFont(name);
          setCurrentFont(name);
        },
      }),
      []
    );

    // DosSelect onChange: switch the engine font and reflect it in the picker.
    const handleFontChange = useCallback((name: string) => {
      handleRef.current?.setFont(name);
      setCurrentFont(name);
    }, []);

    if (failed) {
      return (
        <div className="red">
          Editor failed to load — use the .ans upload below.
        </div>
      );
    }

    // A tidy font-picker row above the editor host: a "Font:" label plus the
    // site's DosSelect, populated from the engine's curated font list. The
    // weird text0wnz font modal is suppressed (see mount/editor.css), so this
    // is the only font UI. Hidden until the engine is ready and the list is
    // populated.
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        {fonts.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "16px",
              marginBottom: "8px",
              flexShrink: 0,
            }}
          >
            <span className="lightgrey">Font:</span>
            <DosSelect
              value={currentFont}
              options={fonts.map(fontOption)}
              onChange={handleFontChange}
              width={304}
            />
          </div>
        )}
        {/* Fill the host box so the editor's `height:100%` chain has a definite
            height to resolve against (otherwise #bodyContainer collapses to 0). */}
        <div ref={hostRef} style={{ width: "100%", flex: 1, minHeight: 0 }} />
      </div>
    );
  }
);

AnsiEditor.displayName = "AnsiEditor";

export default AnsiEditor;
