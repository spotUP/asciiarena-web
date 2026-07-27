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
