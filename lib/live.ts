type SSEController = ReadableStreamDefaultController<Uint8Array>;

export interface LiveEvent {
  type: string;
  [key: string]: unknown;
}

const channels = new Map<string, Set<SSEController>>();
const encoder = new TextEncoder();

// On SIGTERM (deploys), close every active SSE controller so the Node
// event loop can drain and the process exits in ~1s instead of waiting
// for systemd's 10s force-kill. Without this, every deploy left a window
// where Apache returned 503s and visitors' tabs froze on broken chunks.
// Guarded with a module-level flag so the listener installs once even if
// the file is HMR-evaluated multiple times during dev.
declare global {
  // eslint-disable-next-line no-var
  var __sseShutdownInstalled: boolean | undefined;
}
if (typeof process !== "undefined" && !globalThis.__sseShutdownInstalled) {
  globalThis.__sseShutdownInstalled = true;
  const closeAll = (): void => {
    for (const subs of channels.values()) {
      for (const ctrl of [...subs]) {
        try { ctrl.close(); } catch { /* already closed */ }
      }
      subs.clear();
    }
    channels.clear();
  };
  process.on("SIGTERM", closeAll);
  process.on("SIGINT", closeAll);
}

export function subscribe(channel: string, ctrl: SSEController): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel)!.add(ctrl);
  return () => {
    const subs = channels.get(channel);
    if (!subs) return;
    subs.delete(ctrl);
    if (subs.size === 0) channels.delete(channel);
  };
}

export function subscriberCount(channel: string): number {
  return channels.get(channel)?.size ?? 0;
}

export function broadcast(channel: string, event: LiveEvent): void {
  const subs = channels.get(channel);
  if (!subs || subs.size === 0) return;
  const payload = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  for (const ctrl of [...subs]) {
    try {
      ctrl.enqueue(payload);
    } catch {
      subs.delete(ctrl);
    }
  }
}
