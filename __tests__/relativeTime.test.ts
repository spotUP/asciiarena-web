import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/lib/utils";

const NOW = 1_700_000_000_000; // fixed "now" in ms
const ago = (s: number) => Math.floor(NOW / 1000) - s;

describe("formatRelativeTime", () => {
  it("uses 'now' for the most recent moment", () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe("now");
    expect(formatRelativeTime(ago(1), NOW)).toBe("now");
  });

  it("scales through s / m / h / d / w / mo / y", () => {
    expect(formatRelativeTime(ago(30), NOW)).toBe("30s");
    expect(formatRelativeTime(ago(5 * 60), NOW)).toBe("5m");
    expect(formatRelativeTime(ago(2 * 3600), NOW)).toBe("2h");
    expect(formatRelativeTime(ago(3 * 86400), NOW)).toBe("3d");
    expect(formatRelativeTime(ago(2 * 604800), NOW)).toBe("2w");
    expect(formatRelativeTime(ago(60 * 86400), NOW)).toBe("2mo");
    expect(formatRelativeTime(ago(400 * 86400), NOW)).toBe("1y");
  });

  it("stays monotonic for a newest-first list spanning multiple days (the bug)", () => {
    // Same scenario as the widget: clock times looked scrambled, relative time
    // is strictly increasing down the list.
    const stamps = [ago(20 * 60), ago(26 * 3600), ago(27 * 3600), ago(3 * 86400), ago(4 * 86400)];
    const labels = stamps.map((s) => formatRelativeTime(s, NOW));
    expect(labels).toEqual(["20m", "1d", "1d", "3d", "4d"]);
  });

  it("never goes negative for a timestamp slightly in the future (clock skew)", () => {
    expect(formatRelativeTime(ago(-5), NOW)).toBe("now");
  });
});
