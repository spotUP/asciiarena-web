import { sameUserId, type UserIdLike } from "@/lib/userId";

/**
 * Who may change a comment.
 *
 * One definition for both sides of the release page: the server authorises the
 * edit with it, and the list marks each row `mine` with it so the Edit button
 * appears exactly when the edit will be allowed. They used to disagree -- the
 * button showed on a nick match while the UPDATE required a user_id match --
 * so on any row whose nick matched but whose user_id did not (legacy comments
 * imported without one), Edit opened a form whose Save silently changed
 * nothing: the action reported success on an UPDATE that hit no row, and the
 * reload put the old text straight back.
 *
 * Ids arrive as BigInt from $queryRaw, as a string from the session and as a
 * number from a param, so the comparison goes through sameUserId. See
 * lib/userId.ts.
 */
export function canEditComment(
  commentUserId: UserIdLike,
  viewerId: UserIdLike,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  return sameUserId(commentUserId, viewerId);
}
