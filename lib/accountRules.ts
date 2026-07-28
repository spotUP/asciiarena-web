// Pure rules governing account state and artist-handle ownership. Kept
// dependency-free so both server actions and route handlers consume the SAME
// logic, and so the rules are unit-testable without a DB or a session.

// The rank a newly-registered, not-yet-activated user carries. Registration
// mints this; the emailed activation link clears it to ACTIVE_RANK.
export const INACTIVE_RANK = "Inactive";

// The rank an account holds once its email is confirmed via the activation
// link. Matches the admin-facing ranks ladder in app/admin/users.
export const ACTIVE_RANK = "Member";

/**
 * Every rank an account can hold, lowest first. This used to be a bare literal
 * inside app/admin/users/UsersClient.tsx, where it was only ever the order of a
 * select box. The forum needs it as an actual ladder (lib/forum/rules.ts gates
 * reading and posting on it), so it lives here now and the admin select
 * imports it.
 *
 * Note "Uploader" sitting above "Senior Member": that ordering is inherited
 * from the select box and was never a considered decision. It is treated as
 * the ladder because changing it would silently re-gate existing boards.
 *
 * The leading "" is the no-rank case that legacy imported accounts carry.
 */
export const RANKS = ["", "Inactive", "Member", "Senior Member", "Uploader", "Admin"] as const;
export type Rank = (typeof RANKS)[number];

// Whether an account with this rank is blocked from logging in. Only the
// explicit "Inactive" rank is gated — NULL / "" / any other rank (legacy
// imports, Member, Admin, ...) may log in, so we never lock out existing users.
export function isRankLoginBlocked(rank: string | null | undefined): boolean {
  return rank === INACTIVE_RANK;
}

// Whether `userNick` is allowed to claim the artist handle `artistNick`. A user
// may only claim a handle that IS their site nick (case-insensitive). This is
// the fix for the free-text claim hole that let one account grab an unrelated
// artist ("Goto80").
export function canClaimHandle(userNick: string | null | undefined, artistNick: string | null | undefined): boolean {
  const u = (userNick ?? "").trim().toLowerCase();
  const a = (artistNick ?? "").trim().toLowerCase();
  return u.length > 0 && u === a;
}
