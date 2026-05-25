import { NextRequest } from "next/server";
import { subscribe, broadcast } from "@/lib/live";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel") ?? "";
  if (!channel) return new Response("channel required", { status: 400 });

  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      ctrl.enqueue(encoder.encode(": keepalive\n\n"));
      unsubscribe = subscribe(channel, ctrl);
    },
    cancel() {
      unsubscribe?.();
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
    broadcast(channel, { type: "typing", nick, draft: (draft ?? "").slice(0, 120) });
  } else if (type === "clear") {
    broadcast(channel, { type: "clear", nick });
  }

  return new Response(null, { status: 204 });
}
