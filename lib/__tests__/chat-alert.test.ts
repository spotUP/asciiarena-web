import { describe, it, expect } from "vitest";
import { alertRateLimitKey, buildAlertEvent } from "@/lib/chatAlert";

describe("alertRateLimitKey", () => {
  it("is unique per (user, thread) and namespaced", () => {
    expect(alertRateLimitKey(5, 99)).toBe("alert:5:99");
    expect(alertRateLimitKey(5, 99)).not.toBe(alertRateLimitKey(5, 100));
    expect(alertRateLimitKey(5, 99)).not.toBe(alertRateLimitKey(6, 99));
  });
});

describe("buildAlertEvent", () => {
  it("carries type 'alert' and the sender id so receivers can ignore their own echo", () => {
    const ev = buildAlertEvent(7, "spot");
    expect(ev).toEqual({ type: "alert", fromId: 7, fromNick: "spot" });
  });
});
