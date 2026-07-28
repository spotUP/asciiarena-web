import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clearListening, listListening, setListening } from "@/lib/site-now-playing";

export const dynamic = "force-dynamic";

/**
 * Who is listening to what on the site's own music player.
 *
 * GET  -> the current listeners, for the sidebar widget.
 * POST -> "I am playing this" / "I stopped", from the player itself.
 *
 * The track is taken from the session's user, never from the body, so a caller
 * cannot report on someone else's behalf.
 */

const bodySchema = z.object({
  /** Formatted track label, or null when playback stopped. */
  track: z.string().trim().min(1).max(200).nullable(),
});

/**
 * Listening is an activity like any other, so it honours the same per-type
 * opt-out as the activity feed: a reader who has hidden "listening" is not
 * listed. Checked on write, so opting out also drops what is already stored.
 */
async function optedOut(userId: number): Promise<boolean> {
  try {
    const u = await prisma.users.findUnique({
      where: { id: userId },
      select: { activity_hidden_types: true },
    });
    const hidden = (u?.activity_hidden_types ?? "").split(",").map(s => s.trim());
    return hidden.includes("listening");
  } catch {
    // A lookup failure must not silently start broadcasting somebody who opted
    // out, so treat it as opted out.
    return true;
  }
}

export async function GET() {
  return NextResponse.json(listListening());
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const nick = session?.user?.name ?? "";
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  if (parsed.track === null || (await optedOut(userId))) {
    clearListening(userId);
    return NextResponse.json({ ok: true });
  }

  setListening(userId, nick, parsed.track);
  return NextResponse.json({ ok: true });
}
