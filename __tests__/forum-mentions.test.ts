import { describe, it, expect } from "vitest";
import { extractMentionCandidates } from "@/lib/forum/mentions";
import { MAX_MENTIONS_PER_POST } from "@/lib/forum/types";

const has = (body: string, nick: string) =>
  extractMentionCandidates(body).some(c => c.toLowerCase() === nick.toLowerCase());

describe("picking mentions out of a post", () => {
  it("finds a plain mention", () => {
    expect(has("thanks @spot for the pack", "spot")).toBe(true);
  });

  it("still resolves a nick written at the end of a sentence", () => {
    expect(has("nice work @spot.", "spot")).toBe(true);
    expect(has("ask @mo9, he knows", "mo9")).toBe(true);
    expect(has("really @dipswitch!", "dipswitch")).toBe(true);
  });

  it("does not mention anyone because a post contains an email address", () => {
    expect(extractMentionCandidates("mail me at user@example.com")).toEqual([]);
  });

  it("finds a mention at the very start of a post", () => {
    expect(has("@spot did you see this", "spot")).toBe(true);
  });

  it("handles the punctuation real scene nicks are made of", () => {
    expect(has("hey @z!o nice one", "z!o")).toBe(true);
    expect(has("hey @^pQ^ nice one", "^pQ^")).toBe(true);
    expect(has("hey @bR41n nice one", "bR41n")).toBe(true);
  });

  it("counts @SPOT and @spot as the same person once", () => {
    const c = extractMentionCandidates("@SPOT and @spot");
    expect(c.filter(x => x.toLowerCase() === "spot")).toHaveLength(1);
  });

  it("does not turn a post full of at-signs into a huge lookup", () => {
    const body = Array.from({ length: 500 }, (_, i) => `@nick${i}`).join(" ");
    expect(extractMentionCandidates(body).length).toBeLessThanOrEqual(MAX_MENTIONS_PER_POST * 3);
  });

  it("ignores a bare at-sign with nothing after it", () => {
    expect(extractMentionCandidates("what @ even is this")).toEqual([]);
  });

  it("does not read a nick out of the middle of a word", () => {
    expect(extractMentionCandidates("filename@version")).toEqual([]);
  });

  it("finds several different people in one post", () => {
    const c = extractMentionCandidates("@spot @mo9 and @rotox");
    expect(c).toContain("spot");
    expect(c).toContain("mo9");
    expect(c).toContain("rotox");
  });

  it("finds a mention on its own line", () => {
    expect(has("look at this\n@spot\nwhat do you think", "spot")).toBe(true);
  });
});
