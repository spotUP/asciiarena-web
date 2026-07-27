// Throttle for the public logo-map save. Pure (no clock, no database) so the
// window is testable without either.
//
// The endpoint is open to every logged-in user and each save appends a
// MEDIUMTEXT snapshot that is never pruned. This box has already taken MySQL
// down once by filling its disk, so the write volume one account can create
// has to be bounded. Ten seconds is far longer than any human tagging rhythm
// (you map a colly, then save) and turns a hammering script into a trickle.

/** Shortest gap allowed between two saves by the same user on the same colly. */
export const LOGO_SAVE_MIN_INTERVAL_SECONDS = 10;

/** Rolling window for the per-user cap that spans every colly. */
export const LOGO_SAVE_USER_WINDOW_SECONDS = 300;

/** Saves one user may make across ALL collys inside that window. */
export const LOGO_SAVE_USER_WINDOW_MAX = 20;

/**
 * Seconds the user must still wait before saving this colly again, or 0 when
 * the save may proceed. `lastSavedAt` is the unix-seconds timestamp of that
 * user's newest snapshot on this colly (null when they have never saved it).
 */
export function secondsUntilNextLogoSave(lastSavedAt: number | null | undefined, now: number): number {
  if (lastSavedAt == null) return 0;
  const elapsed = now - lastSavedAt;
  // A timestamp in the future (clock skew, or a doctored row) must not read as
  // "plenty of time has passed" -- it costs a full window instead.
  if (elapsed < 0) return LOGO_SAVE_MIN_INTERVAL_SECONDS;
  return Math.max(0, LOGO_SAVE_MIN_INTERVAL_SECONDS - elapsed);
}

/**
 * Seconds the user must wait before their next save on ANY colly, or 0 when the
 * save may proceed.
 *
 * The per-colly gap above throttles one colly at a time, which a script walking
 * a list of colly ids never hits: one large snapshot per colly, looping as fast
 * as the list allows, is unthrottled by it. This cap spans every colly, so the
 * total volume one account can append is bounded no matter how the ids are
 * spread. Twenty saves per five minutes is far above any human tagging rhythm
 * and far below a useful write-amplification rate.
 *
 * `savedAt` are the unix-seconds timestamps of that user's recent snapshots
 * across all collys. Timestamps outside the window are ignored here too, so a
 * caller that over-fetches still gets the right answer.
 */
export function secondsUntilUserQuotaFrees(savedAt: number[], now: number): number {
  // A future timestamp stays in the window rather than being discarded, so a
  // doctored row costs the account a slot instead of buying it one.
  const inWindow = savedAt
    .filter((t) => t > now - LOGO_SAVE_USER_WINDOW_SECONDS)
    .sort((a, b) => a - b);
  if (inWindow.length < LOGO_SAVE_USER_WINDOW_MAX) return 0;
  // The window frees a slot when its oldest save ages out of it. Never report
  // 0 while at the cap -- that would read as "allowed".
  return Math.max(1, inWindow[0] + LOGO_SAVE_USER_WINDOW_SECONDS - now);
}
