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
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { EditorHandle } from "./mount";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AnsiEditorRef {
  getAnsiBytes: () => Promise<Uint8Array>;
}

interface AnsiEditorProps {
  onReady?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AnsiEditor = forwardRef<AnsiEditorRef, AnsiEditorProps>(
  function AnsiEditor({ onReady }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<EditorHandle | null>(null);
    const [failed, setFailed] = useState(false);

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
          handle = mod.initAnsiEditor(hostRef.current, { onReady });
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
      // onReady is intentionally excluded: re-running the effect when a
      // caller changes the callback would destroy and re-create the canvas,
      // which is almost never what's wanted.  Callers should stabilise the
      // callback with useCallback.
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
      }),
      []
    );

    if (failed) {
      return (
        <div className="red">
          Editor failed to load — use the .ans upload below.
        </div>
      );
    }

    return <div ref={hostRef} />;
  }
);

AnsiEditor.displayName = "AnsiEditor";

export default AnsiEditor;
