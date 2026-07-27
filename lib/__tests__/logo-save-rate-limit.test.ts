import { describe, it, expect } from "vitest";
import {
  LOGO_SAVE_MIN_INTERVAL_SECONDS,
  LOGO_SAVE_USER_WINDOW_MAX,
  LOGO_SAVE_USER_WINDOW_SECONDS,
  secondsUntilNextLogoSave,
  secondsUntilUserQuotaFrees,
} from "../logoSaveRateLimit";

// Public logo saves carry a MEDIUMTEXT map on an open endpoint, and this
// server has already lost MySQL once to a full disk. One save per ten seconds
// per user per colly is ample for genuine tagging and bounds the damage a
// script can do.

describe("secondsUntilNextLogoSave", () => {
  it("lets a first-ever save through", () => {
    expect(secondsUntilNextLogoSave(null, 1_753_600_000)).toBe(0);
    expect(secondsUntilNextLogoSave(undefined, 1_753_600_000)).toBe(0);
  });

  it("holds back a save made moments after the last one", () => {
    const now = 1_753_600_000;
    expect(secondsUntilNextLogoSave(now, now)).toBe(LOGO_SAVE_MIN_INTERVAL_SECONDS);
    expect(secondsUntilNextLogoSave(now - 1, now)).toBe(LOGO_SAVE_MIN_INTERVAL_SECONDS - 1);
    expect(secondsUntilNextLogoSave(now - 9, now)).toBe(1);
  });

  it("lets the save through once the window has elapsed", () => {
    const now = 1_753_600_000;
    expect(secondsUntilNextLogoSave(now - LOGO_SAVE_MIN_INTERVAL_SECONDS, now)).toBe(0);
    expect(secondsUntilNextLogoSave(now - 600, now)).toBe(0);
  });

  it("does not let a future timestamp unlock the endpoint", () => {
    // A row from the future (clock skew, or a doctored timestamp) must not
    // produce a negative wait that reads as "allowed".
    const now = 1_753_600_000;
    expect(secondsUntilNextLogoSave(now + 3600, now)).toBe(LOGO_SAVE_MIN_INTERVAL_SECONDS);
  });

  it("keeps the window short enough for real tagging", () => {
    expect(LOGO_SAVE_MIN_INTERVAL_SECONDS).toBeLessThanOrEqual(10);
  });
});

// The gap above is per (user, colly), which a script iterating colly ids never
// trips: every request targets a colly it has not saved before, so it can
// append one large snapshot per colly on a loop. The cap below spans all
// collys, so total write volume per account is bounded either way.
const NOW = 1_753_600_000;
const saves = (count: number, oldestAgo = 60) =>
  Array.from({ length: count }, (_, i) => NOW - oldestAgo + i);

describe("secondsUntilUserQuotaFrees", () => {
  it("lets a user with no recent saves through", () => {
    expect(secondsUntilUserQuotaFrees([], NOW)).toBe(0);
  });

  it("lets a user under the cap through", () => {
    expect(secondsUntilUserQuotaFrees(saves(LOGO_SAVE_USER_WINDOW_MAX - 1), NOW)).toBe(0);
  });

  it("holds back a user who has hit the cap across different collys", () => {
    expect(secondsUntilUserQuotaFrees(saves(LOGO_SAVE_USER_WINDOW_MAX), NOW)).toBeGreaterThan(0);
  });

  it("frees a slot exactly when the oldest save ages out of the window", () => {
    const oldestAgo = 100;
    const wait = secondsUntilUserQuotaFrees(saves(LOGO_SAVE_USER_WINDOW_MAX, oldestAgo), NOW);
    expect(wait).toBe(LOGO_SAVE_USER_WINDOW_SECONDS - oldestAgo);
  });

  it("ignores saves that have already left the window", () => {
    const stale = Array.from({ length: 50 }, (_, i) => NOW - LOGO_SAVE_USER_WINDOW_SECONDS - 1 - i);
    expect(secondsUntilUserQuotaFrees(stale, NOW)).toBe(0);
  });

  it("does not let future timestamps buy extra saves", () => {
    const future = Array.from({ length: LOGO_SAVE_USER_WINDOW_MAX }, () => NOW + 3600);
    expect(secondsUntilUserQuotaFrees(future, NOW)).toBeGreaterThan(0);
  });

  it("never reports zero wait while the user is at the cap", () => {
    // Timestamps right at the window edge must still read as "blocked".
    const edge = Array.from({ length: LOGO_SAVE_USER_WINDOW_MAX }, () => NOW - LOGO_SAVE_USER_WINDOW_SECONDS + 1);
    expect(secondsUntilUserQuotaFrees(edge, NOW)).toBeGreaterThanOrEqual(1);
  });

  it("stays far above genuine tagging and far below a useful attack rate", () => {
    expect(LOGO_SAVE_USER_WINDOW_MAX).toBeGreaterThanOrEqual(10);
    expect(LOGO_SAVE_USER_WINDOW_MAX).toBeLessThanOrEqual(30);
    expect(LOGO_SAVE_USER_WINDOW_SECONDS).toBeGreaterThanOrEqual(60);
  });
});
