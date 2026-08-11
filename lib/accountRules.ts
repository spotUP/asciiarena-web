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

/**
 * Password strength rule shared by registration, the settings password change,
 * the emailed reset flow, and the admin set-password action. These used to be
 * four private copies that had drifted: three checked character classes only,
 * while the reset flow also required 8+ characters. The reset rule is the
 * intended one, so everything now enforces the 8-character minimum too.
 */
export const PASSWORD_RULE_TEXT =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

export function isValidPassword(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
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

/**
 * A registration is abandoned once it has sat unactivated for this long. The
 * activation mail goes out immediately, so a week is a generous window for
 * someone who actually wants the account -- and a spam signup never comes back
 * at all.
 */
export const ABANDONED_REGISTRATION_DAYS = 7;

/**
 * When the email-activation flow went live (2026-07-20, commit 60016b9).
 *
 * Accounts registered BEFORE this were stamped "Inactive" by a registration
 * that had no activation flow behind it -- no mail was ever sent, so there was
 * never a link to click. They are unactivated through no fault of their own,
 * and several turned out to be real people who had been using the site for
 * months. Purging on "unactivated for a week" without this guard would delete
 * them permanently.
 *
 * That backlog was dealt with by hand. This constant makes sure the automatic
 * rule can never reach back into it.
 */
export const ACTIVATION_FLOW_EPOCH = 1784592000;

/**
 * Whether an account is an abandoned registration, safe to delete.
 *
 * Deliberately narrow: it only ever matches accounts that WERE sent an
 * activation link, never activated it, and have had a week to. Anything
 * outside that -- any other rank, anything older than the flow -- is left
 * alone. Callers must still refuse to delete an account that has content;
 * this predicate only knows about the account row.
 */
export function isAbandonedRegistration(
  account: { rank: string | null | undefined; joined: number | null | undefined },
  nowSec: number,
): boolean {
  if (account.rank !== INACTIVE_RANK) return false;
  const joined = account.joined ?? 0;
  if (joined < ACTIVATION_FLOW_EPOCH) return false;
  return joined < nowSec - ABANDONED_REGISTRATION_DAYS * 24 * 3600;
}
