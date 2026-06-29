import { prisma } from "@/lib/db";
import { broadcast, subscriberCount, type LiveEvent } from "@/lib/live";
import type { ActivityType } from "@/lib/activity-types";

export { ACTIVITY_TYPES, ACTIVITY_LABELS, type ActivityType } from "@/lib/activity-types";

function parseHidden(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(s.split(",").map(x => x.trim()).filter(Boolean));
}

/**
 * Broadcast a site-wide activity-feed event unless the user has hidden this
 * particular event type via their preferences. Replaces the previous direct
 * `broadcast("site:activity", { … })` calls so that each broadcast point
 * respects the user's per-type opt-out.
 *
 * The check is a single indexed lookup, ~sub-millisecond. If the user record
 * isn't found we err on the side of *not* broadcasting (safer for privacy).
 */
export async function broadcastActivityIfAllowed(
  userId: number,
  type: ActivityType,
  event: LiveEvent
): Promise<void> {
  try {
    const u = await prisma.users.findUnique({
      where: { id: userId },
      select: { activity_hidden_types: true },
    });
    if (!u) { console.log(`[activitydbg] user ${userId} not found`); return; }
    const hidden = parseHidden(u.activity_hidden_types);
    if (hidden.has(type)) { console.log(`[activitydbg] type ${type} hidden for ${userId} (hidden=${u.activity_hidden_types})`); return; }
    console.log(`[activitydbg] broadcasting ${type} for ${userId} -> site:activity subs=${subscriberCount("site:activity")} pid=${process.pid}`);
    broadcast("site:activity", event);
  } catch (e) {
    console.log(`[activitydbg] error: ${e instanceof Error ? e.message : String(e)}`);
    // Don't let a broadcast failure surface as a user-visible error.
  }
}
