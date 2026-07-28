import { Prisma } from "@/lib/generated/prisma/client";

/**
 * The unread-message count for one row of `chat_participants` (aliased `cp`).
 *
 * Defined once because two endpoints report it -- the inbox list and the
 * navbar badge -- and a badge that disagrees with the list it links to is worse
 * than either number being wrong.
 *
 * "Not mine" needs two clauses. 28 chat rows predate the group-chat rewrite and
 * carry from_id NULL, identified only by the sender's nick in `postername`;
 * matching on from_id alone counted a viewer's own old messages as new to
 * themselves. The NULL branch is written out rather than folded into a NOT(...)
 * because `from_id = me` is NULL for those rows, and NOT NULL is not TRUE --
 * the tidier-looking form silently drops everybody ELSE's legacy messages too.
 */
export function unreadCountExpr(viewerId: number, viewerNick: string): Prisma.Sql {
  return Prisma.sql`(SELECT COUNT(*) FROM messages um
     WHERE um.thread = cp.thread_id AND um.timestamp >= cp.joined_at
       AND um.timestamp > cp.last_read_at
       AND ((um.from_id IS NOT NULL AND um.from_id <> ${viewerId})
            OR (um.from_id IS NULL AND (um.postername IS NULL OR um.postername <> ${viewerNick}))))`;
}
