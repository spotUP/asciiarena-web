import { describe, it, expect } from "vitest";
import { parseSearchQuery } from "@/lib/searchQuery";

describe("parseSearchQuery", () => {
  it("treats a bare query as free text searching everything", () => {
    const p = parseSearchQuery("spot");
    expect(p).toEqual({ free: "spot", isScoped: false });
  });

  it("routes a known field to its scope and marks the query scoped", () => {
    expect(parseSearchQuery("artist:spot")).toMatchObject({ artist: "spot", isScoped: true });
    expect(parseSearchQuery("crew:fairlight")).toMatchObject({ crew: "fairlight", isScoped: true });
    expect(parseSearchQuery("content:breakdance")).toMatchObject({ content: "breakdance", isScoped: true });
  });

  it("keeps a quoted field value as one phrase", () => {
    expect(parseSearchQuery('crew:"up rough"')).toMatchObject({ crew: "up rough", isScoped: true });
  });

  it("mixes a scoped field with leftover free text", () => {
    const p = parseSearchQuery("crew:fairlight old");
    expect(p.crew).toBe("fairlight");
    expect(p.free).toBe("old");
    expect(p.isScoped).toBe(true);
  });

  it("maps field aliases (by/group/text/title)", () => {
    expect(parseSearchQuery("by:spot").artist).toBe("spot");
    expect(parseSearchQuery("group:silents").crew).toBe("silents");
    expect(parseSearchQuery("text:hello").content).toBe("hello");
    expect(parseSearchQuery("title:intro").name).toBe("intro");
  });

  it("leaves an unknown field: prefix as plain free text", () => {
    const p = parseSearchQuery("color:red");
    expect(p.isScoped).toBe(false);
    expect(p.free).toBe("color:red");
  });

  it("merges repeated fields with a space", () => {
    expect(parseSearchQuery("artist:spot artist:nupe").artist).toBe("spot nupe");
  });
});
