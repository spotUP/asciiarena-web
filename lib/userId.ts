// Comparing "is this the same user" across the three shapes an id arrives in.
//
// `prisma.$queryRaw` hands back MySQL's INT UNSIGNED columns -- users.id,
// font_groups.owner_id, every *_id in this schema -- as **BigInt**, while a
// session id is a string and a parsed param is a number. `2 === 2n` is false,
// so a raw `===` between a column and a session id is always false and every
// ownership check written that way silently denies.
//
// It fails quietly, which is what makes it worth a shared helper: the member
// page's "don't offer a chat with yourself" guard read
// `Number(session.user.id) === member.id` and had never once been true, and
// lib/db.ts's BigInt.prototype.toJSON patch means the ids still look like plain
// numbers in any response you inspect.

export type UserIdLike = number | bigint | string | null | undefined;

/**
 * Normalise any id shape to a number, or null when there isn't a usable one.
 *
 * An empty or blank string is null rather than 0 -- `Number("")` is 0, and a
 * missing session id must not compare equal to a row whose id is 0. Ids are
 * autoincrement and start at 1, so anything at or below zero is "no user":
 * legacy rows carrying from_id 0 identify nobody and must not match a viewer.
 */
export function toUserId(value: UserIdLike): number | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Whether two ids identify the same user. Missing ids never match. */
export function sameUserId(a: UserIdLike, b: UserIdLike): boolean {
  const left = toUserId(a);
  const right = toUserId(b);
  return left != null && right != null && left === right;
}
