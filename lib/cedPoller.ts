// Server-side singleton poller for the external CED sessions feed at
// hippoplayer.se/cygnus/sessions. Replaces per-browser polling: every
// connected viewer gets the same broadcast, so fan-out is 1 outbound HTTP
// request per interval regardless of viewer count.
//
// We can't trigger updates from a write hook because the data source is
// external. This is the next-best thing — central polling with diff
// detection so SSE only fires when the document set actually changes.

import { broadcast, subscriberCount } from "@/lib/live";

interface CedUser { nick: string; color: string }
interface CedDocument { id: string; name: string; users: CedUser[] }
interface CedSessionsData { documents: CedDocument[] }

const CHANNEL = "site:ced-sessions";
const URL = "https://hippoplayer.se/cygnus/sessions";
const INTERVAL_MS = 10_000;

let timer: ReturnType<typeof setInterval> | null = null;
let lastSnapshot: string = "";

async function pollOnce(): Promise<void> {
  // Skip the fetch entirely when no browser is subscribed — saves the
  // outbound request on quiet sites without breaking idempotency.
  if (subscriberCount(CHANNEL) === 0) return;
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as CedSessionsData;
    const snapshot = JSON.stringify(data.documents ?? []);
    if (snapshot === lastSnapshot) return;
    lastSnapshot = snapshot;
    broadcast(CHANNEL, { type: "update", documents: data.documents ?? [] });
  } catch {
    /* network blip — try again next tick */
  }
}

export function ensureCedPoller(): void {
  if (timer) return;
  // Fire one immediate poll so the first subscriber doesn't have to wait
  // INTERVAL_MS for initial data.
  void pollOnce();
  timer = setInterval(() => { void pollOnce(); }, INTERVAL_MS);
  // Unref so the timer doesn't keep the Node process alive on shutdown.
  if (typeof (timer as unknown as { unref?: () => void }).unref === "function") {
    (timer as unknown as { unref: () => void }).unref();
  }
}
