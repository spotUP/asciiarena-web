import { NextRequest } from "next/server";
import { subscribe, broadcast, subscriberCount, getHistory, frame } from "@/lib/live";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import { ensureCedPoller } from "@/lib/cedPoller";

// Start the singleton CED poller when the SSE route first loads. It self-
// gates on subscriberCount("site:ced-sessions") so it doesn't hammer the
// external API when nobody's watching the widget.
ensureCedPoller();

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

// A tab subscribes to as many channels as the widgets on the page ask for --
// around twenty on a logged-in release page. One connection each put every
// request the tab makes behind a shared limit: the browser's per-host cap on
// HTTP/1.1, and on HTTP/2 a single TCP connection whose death takes navigation
// and data fetches down with the streams. So `channels=` carries the whole set
// on one stream and each event names its channel; see lib/sse-pool.ts.
//
// `channel=` (one channel, bare events) stays supported: a tab loaded before a
// deploy keeps its old bundle until it is reloaded.
const MAX_CHANNELS = 64;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const muxed = params.has("channels");
  const requested = muxed ? params.get("channels")! : params.get("channel") ?? "";
  const list = [...new Set(requested.split(",").map(c => c.trim()).filter(Boolean))];
  if (list.length === 0) return new Response("channel required", { status: 400 });
  if (list.length > MAX_CHANNELS) return new Response("too many channels", { status: 400 });

  let unsubscribes: (() => void)[] = [];
  let pingInterval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      ctrl.enqueue(encoder.encode(": keepalive\n\n"));
      unsubscribes = list.map(channel => subscribe(channel, ctrl, muxed));
      for (const channel of list) {
        // Backfill recent events so a feed that connects (or reconnects after a
        // navigation gap) immediately shows what it missed. The id travels with
        // each event so a client that already showed it can skip it.
        for (const { id, event } of getHistory(channel)) {
          const payload = muxed ? frame(channel, event, id) : event;
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
        broadcast(channel, { type: "watching", count: subscriberCount(channel) });
      }
      pingInterval = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);
    },
    cancel() {
      clearInterval(pingInterval);
      for (const unsubscribe of unsubscribes) unsubscribe();
      for (const channel of list) {
        broadcast(channel, { type: "watching", count: subscriberCount(channel) });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json() as { channel?: string; type?: string; draft?: string };
  const { channel, type, draft } = body;
  if (!channel || !type) return apiError("channel and type required", 400);

  const nick = session.user.name ?? "unknown";

  if (type === "typing") {
    // 120 was sized for a chat line. The forum composer is an 80x25 canvas,
    // so a draft is up to a couple of thousand characters; still bounded, so a
    // client cannot pump arbitrary payloads through the channel.
    broadcast(channel, { type: "typing", nick, draft: (draft ?? "").slice(0, 4000) });
  } else if (type === "clear") {
    broadcast(channel, { type: "clear", nick });
  }

  return new Response(null, { status: 204 });
}
