import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/live";

export type NotificationType =
  | "notif-comment"
  | "notif-fav"
  | "notif-reply"
  | "notif-message"
  | "notif-status"
  | "notif-poll";

interface CreateArgs {
  actorNick?: string | null;
  target?: string | null;
  targetUrl?: string | null;
  payload?: unknown;
}

function parseHidden(s: string | null | undefined): Set<string> {
  if (!s) return new Set();
  return new Set(s.split(",").map(x => x.trim()).filter(Boolean));
}

/**
 * Insert a notification row for the recipient and broadcast it on
 * user:{userId}:notifications. The recipient's `activity_hidden_types`
 * gate applies — if they've opted out of this notification type, no
 * row is inserted and no broadcast happens.
 *
 * Callers are responsible for skipping self-notifications (actor === recipient).
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  args: CreateArgs = {}
): Promise<void> {
  try {
    const u = await prisma.users.findUnique({
      where: { id: userId },
      select: { activity_hidden_types: true },
    });
    if (!u) return;
    if (parseHidden(u.activity_hidden_types).has(type)) return;

    const now = Math.floor(Date.now() / 1000);
    const inserted = await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        actor_nick: args.actorNick ?? null,
        target: args.target ?? null,
        target_url: args.targetUrl ?? null,
        payload: args.payload == null ? undefined : (args.payload as object),
        created_at: now,
      },
      select: { id: true },
    });

    broadcast(`user:${userId}:notifications`, {
      type: "new",
      id: inserted.id,
      kind: type,
      actorNick: args.actorNick ?? null,
      target: args.target ?? null,
      targetUrl: args.targetUrl ?? null,
      createdAt: now,
    });
  } catch {
    /* swallow — notifications must never break the parent action */
  }
}

/**
 * Fan a single notification out to many users at once. Used for site-wide
 * announcements (poll opens, etc). Filters out anyone who's opted out of
 * the type *and* anyone inactive for 30+ days so we don't spam zombie
 * accounts. One bulk insert + N broadcasts.
 *
 * Self-exclusion: pass `actorId` to skip notifying that user (typically the
 * admin who triggered the action).
 */
export async function createBulkNotification(
  type: NotificationType,
  args: CreateArgs & { actorId?: number } = {}
): Promise<number> {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
    const candidates = await prisma.users.findMany({
      where: {
        lastactive: { gt: cutoff },
        ...(args.actorId ? { id: { not: args.actorId } } : {}),
      },
      select: { id: true, activity_hidden_types: true },
    });
    const recipients = candidates
      .filter(u => !parseHidden(u.activity_hidden_types).has(type))
      .map(u => u.id);
    if (recipients.length === 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    await prisma.notifications.createMany({
      data: recipients.map(uid => ({
        user_id: uid,
        type,
        actor_nick: args.actorNick ?? null,
        target: args.target ?? null,
        target_url: args.targetUrl ?? null,
        payload: args.payload == null ? undefined : (args.payload as object),
        created_at: now,
      })),
    });

    // Broadcast individually so each recipient's bell + dropdown light up.
    // The payload doesn't carry the notification id (createMany doesn't
    // return them per row); receivers re-fetch via /api/notifications.
    for (const uid of recipients) {
      broadcast(`user:${uid}:notifications`, {
        type: "new",
        id: 0,
        kind: type,
        actorNick: args.actorNick ?? null,
        target: args.target ?? null,
        targetUrl: args.targetUrl ?? null,
        createdAt: now,
      });
    }
    return recipients.length;
  } catch {
    return 0;
  }
}
