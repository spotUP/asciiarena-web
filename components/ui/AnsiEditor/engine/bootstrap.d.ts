export interface BootstrapOpts {
  columns?: number;
  rows?: number;
  font?: string;
  iceColors?: boolean;
  onReady?: () => void;
}

export interface EditorBootHandle {
  /** Detach all listeners/timers and reset the shared engine singletons. */
  teardown: () => void;
  /** Replace the canvas contents from raw .ans bytes (file-open code path). */
  load: (bytes: Uint8Array) => void;
}

/**
 * Boot the embedded ANSI editor against markup already injected into the
 * document (inside `rootEl`).
 */
export function bootstrapEditor(
  rootEl: HTMLElement,
  opts?: BootstrapOpts
): EditorBootHandle;
