import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { getMember, setThreadArchived } from "@/lib/chatThreadDb";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ archived: z.boolean() });

// POST { archived } — hide a thread from the caller's default inbox, or bring
// it back. Per-member and reversible: unlike leaving, the caller stays in the
// conversation and keeps receiving messages, and the thread resurfaces by
// itself once someone posts (see isArchived in lib/chatThread.ts).
export async function POST(req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { threadId } = await ctx.params;
  const thread = parseInt(threadId);
  if (!Number.isFinite(thread)) return apiError("Bad thread id", 400);
  const me = parseInt(session.user.id);

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  // Archiving a thread you are not in would write nothing but still report
  // success, so the membership check is the honest answer.
  const member = await getMember(thread, me);
  if (!member) return apiError("Not a participant", 403);

  await setThreadArchived(thread, me, parsed.data.archived);

  // Only the caller's own inbox changes — this is a per-member view setting.
  broadcast(`user:${me}:messages`, { type: "archived", threadId: thread, archived: parsed.data.archived });

  return apiOk({ ok: true, archived: parsed.data.archived });
}
