import { describe, it, expect } from "vitest";
import { parseTopicId, topicSlug } from "@/lib/forum/slug";

describe("topic URLs", () => {
  it("gives two topics with the same title distinct URLs", () => {
    expect(topicSlug("New colly pack out now", 412)).not.toBe(topicSlug("New colly pack out now", 413));
  });

  it("still produces a reachable URL for a title made only of punctuation", () => {
    const slug = topicSlug("!!! ??? ...", 7);
    expect(slug).toBe("topic-7");
    expect(parseTopicId(slug)).toBe(7);
  });

  it("recovers the topic id from its own slug", () => {
    const slug = topicSlug("Amiga font metrics", 1934);
    expect(parseTopicId(slug)).toBe(1934);
  });

  it("keeps the id on the end when a very long title is truncated", () => {
    const slug = topicSlug("x".repeat(400), 88);
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(parseTopicId(slug)).toBe(88);
  });

  it("does not leave a dangling dash when truncation lands on a word break", () => {
    const slug = topicSlug(`${"a".repeat(99)} bbbb`, 5);
    expect(slug).not.toContain("--");
    expect(slug.endsWith("-5")).toBe(true);
    expect(parseTopicId(slug)).toBe(5);
  });

  it("refuses a hand-typed URL with no id rather than loading topic NaN", () => {
    expect(parseTopicId("new-colly-pack-out-now")).toBeNull();
    expect(parseTopicId("")).toBeNull();
    expect(parseTopicId("topic-")).toBeNull();
  });

  it("refuses an id of zero", () => {
    expect(parseTopicId("thing-0")).toBeNull();
  });

  it("still finds the topic when someone edits the title half of the URL", () => {
    // The id suffix is the identity; the words in front of it are decoration,
    // so an old or mistyped title must not 404 a topic that exists.
    expect(parseTopicId("some-old-title-412")).toBe(412);
    expect(parseTopicId("412")).toBeNull();
  });

  it("reads the id from a title that itself ends in digits", () => {
    expect(parseTopicId(topicSlug("Best of 2026", 91))).toBe(91);
  });
});
