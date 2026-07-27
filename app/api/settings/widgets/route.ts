import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets-types";
import { broadcast } from "@/lib/live";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  hidden: z.array(z.enum(WIDGET_KEYS as unknown as [WidgetKey, ...WidgetKey[]])).max(WIDGET_KEYS.length),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { hidden_widgets: true },
  });
  const hidden = (u?.hidden_widgets ?? "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
  return apiOk({ hidden });
}

const patchSchema = z.object({
  hide: z.enum(WIDGET_KEYS as unknown as [WidgetKey, ...WidgetKey[]]),
});

// PATCH — hide ONE widget, from its own [X] button.
//
// Separate from POST (which replaces the whole set) on purpose: the button
// knows the key it sits on but not what else the user has hidden, and a
// read-then-write from the client would drop any change made meanwhile in
// another tab or on the settings page. The append happens here, on one row.
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request", 400);

  const userId = parseInt(session.user.id);
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { hidden_widgets: true },
  });
  const current = (u?.hidden_widgets ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const next = Array.from(new Set([...current, parsed.data.hide]));

  await prisma.users.update({
    where: { id: userId },
    data: { hidden_widgets: next.join(",") },
  });

  broadcast(`user:${userId}:widgets`, { type: "updated", hidden: next });

  return apiOk({ ok: true, hidden: next });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const userId = parseInt(session.user.id);
  const dedup = Array.from(new Set(parsed.data.hidden));
  // NULL when nothing is hidden — the common case takes no row space.
  const value = dedup.length ? dedup.join(",") : null;

  await prisma.users.update({
    where: { id: userId },
    data: { hidden_widgets: value },
  });

  broadcast(`user:${userId}:widgets`, { type: "updated", hidden: dedup });

  return apiOk({ ok: true, hidden: dedup });
}
