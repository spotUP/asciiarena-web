import { describe, it, expect } from "vitest";
import {
  pickBannerItem,
  rememberSeen,
  parseSeen,
  MAX_REMEMBERED_SEEN,
  type NewsItem,
} from "@/lib/newsBanner";

const item = (id: number, created_at: number, banner = true): NewsItem => ({
  id, created_at, banner, title: `news ${id}`, body: "body",
});

describe("pickBannerItem — newest unread only", () => {
  it("picks the newest announcement", () => {
    const picked = pickBannerItem([item(1, 100), item(2, 300), item(3, 200)], []);
    expect(picked?.id).toBe(2);
  });

  it("skips announcements already seen", () => {
    const picked = pickBannerItem([item(1, 100), item(2, 300)], [2]);
    expect(picked?.id).toBe(1);
  });

  it("returns null once everything has been seen", () => {
    expect(pickBannerItem([item(1, 100), item(2, 300)], [1, 2])).toBeNull();
  });

  it("ignores items published without the banner flag", () => {
    // Published to /news, but not important enough to interrupt anyone.
    expect(pickBannerItem([item(1, 500, false)], [])).toBeNull();
    expect(pickBannerItem([item(1, 500, false), item(2, 100)], [])?.id).toBe(2);
  });

  it("breaks a timestamp tie by id so the choice is stable", () => {
    expect(pickBannerItem([item(1, 100), item(2, 100)], [])?.id).toBe(2);
  });

  it("returns null for an empty list", () => {
    expect(pickBannerItem([], [])).toBeNull();
  });
});

describe("rememberSeen", () => {
  it("adds a newly seen id to the front", () => {
    expect(rememberSeen([2, 1], 3)).toEqual([3, 2, 1]);
  });

  it("does not duplicate an id it already holds", () => {
    expect(rememberSeen([3, 2, 1], 2)).toEqual([3, 2, 1]);
  });

  it("caps the list so a long-lived browser cannot grow it forever", () => {
    const many = Array.from({ length: MAX_REMEMBERED_SEEN }, (_, i) => i + 1);
    const next = rememberSeen(many, 9999);
    expect(next.length).toBe(MAX_REMEMBERED_SEEN);
    expect(next[0]).toBe(9999);
  });
});

describe("parseSeen — corrupt storage must not break the page", () => {
  it("reads a stored list", () => {
    expect(parseSeen("[3,2,1]")).toEqual([3, 2, 1]);
  });

  it("returns empty for null, junk, or the wrong shape", () => {
    expect(parseSeen(null)).toEqual([]);
    expect(parseSeen("not json")).toEqual([]);
    expect(parseSeen('{"a":1}')).toEqual([]);
  });

  it("drops non-numeric entries", () => {
    expect(parseSeen('[1,"x",null,2]')).toEqual([1, 2]);
  });
});
