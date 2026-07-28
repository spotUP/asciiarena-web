import { describe, expect, it } from "vitest";

import {
  ABANDONED_REGISTRATION_DAYS,
  ACTIVATION_FLOW_EPOCH,
  isAbandonedRegistration,
} from "@/lib/accountRules";

/**
 * Purging spam signups: an account that never activated within a week.
 *
 * The guard that matters is the epoch. Registration stamped "Inactive" from
 * 2026-05-20, but the activation flow only shipped on 2026-07-20 -- so for two
 * months accounts were marked unactivated with no mail ever sent and no link to
 * click. 147 of them existed, and several were real people who had been using
 * the site for months; one reported being locked out. Deleting on "unactivated
 * for a week" without the epoch check would have destroyed those accounts
 * permanently instead of merely locking them out.
 */
const DAY = 24 * 3600;
const AFTER_FLOW = ACTIVATION_FLOW_EPOCH + 30 * DAY;

describe("abandoned registration", () => {
  it("matches an account that ignored its activation mail for over a week", () => {
    const now = AFTER_FLOW + 8 * DAY;
    expect(isAbandonedRegistration({ rank: "Inactive", joined: AFTER_FLOW }, now)).toBe(true);
  });

  it("leaves a fresh registration alone", () => {
    const now = AFTER_FLOW + 2 * DAY;
    expect(isAbandonedRegistration({ rank: "Inactive", joined: AFTER_FLOW }, now)).toBe(false);
  });

  it("waits the full window, to the day", () => {
    const joined = AFTER_FLOW;
    const justInside = joined + ABANDONED_REGISTRATION_DAYS * DAY - 1;
    const justPast = joined + ABANDONED_REGISTRATION_DAYS * DAY + 1;
    expect(isAbandonedRegistration({ rank: "Inactive", joined }, justInside)).toBe(false);
    expect(isAbandonedRegistration({ rank: "Inactive", joined }, justPast)).toBe(true);
  });

  it("never touches accounts that predate the activation flow", () => {
    // The kube case: registered 2026-07-19, one day before the flow existed,
    // so no activation mail was ever sent. Years could pass and this must
    // still refuse to delete it.
    const joined = ACTIVATION_FLOW_EPOCH - DAY;
    const now = ACTIVATION_FLOW_EPOCH + 365 * DAY;
    expect(isAbandonedRegistration({ rank: "Inactive", joined }, now)).toBe(false);
  });

  it("only ever matches the Inactive rank", () => {
    const joined = AFTER_FLOW;
    const now = joined + 30 * DAY;
    for (const rank of ["Member", "Admin", "Senior Member", "Uploader", "", null, undefined]) {
      expect(isAbandonedRegistration({ rank, joined }, now)).toBe(false);
    }
  });

  it("treats a missing joined date as not purgeable", () => {
    // Legacy imported rows carry no joined date. Absent evidence of when they
    // registered, deleting them is a guess -- and an irreversible one.
    const now = AFTER_FLOW + 365 * DAY;
    expect(isAbandonedRegistration({ rank: "Inactive", joined: null }, now)).toBe(false);
    expect(isAbandonedRegistration({ rank: "Inactive", joined: 0 }, now)).toBe(false);
  });
});
