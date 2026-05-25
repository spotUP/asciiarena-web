type SSEController = ReadableStreamDefaultController<Uint8Array>;

export interface LiveEvent {
  type: string;
  [key: string]: unknown;
}

const channels = new Map<string, Set<SSEController>>();
const encoder = new TextEncoder();

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
