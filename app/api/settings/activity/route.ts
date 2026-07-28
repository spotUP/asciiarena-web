import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/activity";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  // Bound by the list itself. A hardcoded number silently breaks "hide
  // everything" the moment the list outgrows it.
  hidden: z.array(z.enum(ACTIVITY_TYPES as unknown as [ActivityType, ...ActivityType[]])).max(ACTIVITY_TYPES.length),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { activity_hidden_types: true },
  });
  const hidden = (u?.activity_hidden_types ?? "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
  return apiOk({ hidden });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const userId = parseInt(session.user.id);
  // Dedupe; store as comma-separated. NULL when nothing is hidden so the
  // common case takes no row space and queries are easy to reason about.
  const dedup = Array.from(new Set(parsed.data.hidden));
  const value = dedup.length ? dedup.join(",") : null;

  await prisma.users.update({
    where: { id: userId },
    data: { activity_hidden_types: value },
  });

  return apiOk({ ok: true, hidden: dedup });
}
