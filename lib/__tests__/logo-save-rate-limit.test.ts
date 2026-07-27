import { describe, it, expect } from "vitest";
import { LOGO_SAVE_MIN_INTERVAL_SECONDS, secondsUntilNextLogoSave } from "../logoSaveRateLimit";

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
