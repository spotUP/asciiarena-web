import { describe, it, expect } from "vitest";
import { parseNowPlaying } from "../nowPlaying";

describe("parseNowPlaying", () => {
  it("returns [] for non-array input (network error / HTML error page / null)", () => {
    expect(parseNowPlaying(null)).toEqual([]);
    expect(parseNowPlaying(undefined)).toEqual([]);
    expect(parseNowPlaying("<html>error</html>")).toEqual([]);
    expect(parseNowPlaying({ error: "nope" })).toEqual([]);
  });

  it("returns [] for the empty feed (nobody playing)", () => {
    expect(parseNowPlaying([])).toEqual([]);
  });

  it("keeps a well-formed entry intact", () => {
    const input = [
      { title: "Sanxion Loader", author: "Rob Hubbard", url: "https://hippoplayer.se/WB.html?x=1", listeners: 3 },
    ];
    expect(parseNowPlaying(input)).toEqual([
      { title: "Sanxion Loader", author: "Rob Hubbard", url: "https://hippoplayer.se/WB.html?x=1", listeners: 3 },
    ]);
  });

  it("drops entries without a usable url (a row must be clickable)", () => {
    const input = [
      { title: "No Link", author: "X", listeners: 2 },
      { title: "Empty Url", author: "Y", url: "", listeners: 1 },
      { title: "Good", author: "Z", url: "https://hippoplayer.se/a", listeners: 1 },
    ];
    expect(parseNowPlaying(input).map(e => e.title)).toEqual(["Good"]);
  });

  it("defaults missing title/author to empty strings", () => {
    const input = [{ url: "https://hippoplayer.se/a", listeners: 1 }];
    expect(parseNowPlaying(input)).toEqual([
      { title: "", author: "", url: "https://hippoplayer.se/a", listeners: 1 },
    ]);
  });

  it("floors listeners at 1 and defaults a missing/garbage count to 1", () => {
    const input = [
      { url: "https://hippoplayer.se/a" },
      { url: "https://hippoplayer.se/b", listeners: 0 },
      { url: "https://hippoplayer.se/c", listeners: -5 },
      { url: "https://hippoplayer.se/d", listeners: 2.9 },
      { url: "https://hippoplayer.se/e", listeners: "lots" },
    ];
    expect(parseNowPlaying(input).map(e => e.listeners)).toEqual([1, 1, 1, 2, 1]);
  });

  it("skips null / non-object array members without throwing", () => {
    const input = [null, 42, "str", { url: "https://hippoplayer.se/a", listeners: 1 }];
    expect(parseNowPlaying(input).map(e => e.url)).toEqual(["https://hippoplayer.se/a"]);
  });

  it("preserves non-ASCII (UTF-8) metadata as-is", () => {
    const input = [{ title: "Trÿstéro", author: "Mön", url: "https://hippoplayer.se/a", listeners: 1 }];
    expect(parseNowPlaying(input)[0]).toMatchObject({ title: "Trÿstéro", author: "Mön" });
  });
});
