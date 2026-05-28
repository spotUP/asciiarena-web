import { describe, it, expect } from "vitest";
import { validateVote, isSingleVoteType } from "@/lib/polls/cast";
import type { PollOptionView } from "@/lib/polls/types";

const opts: PollOptionView[] = [
  { id: 1, label: "a", color_idx: 7, sort_order: 0, approved: true, created_by_id: null },
  { id: 2, label: "b", color_idx: 7, sort_order: 1, approved: true, created_by_id: null },
  { id: 3, label: "c", color_idx: 7, sort_order: 2, approved: true, created_by_id: null },
];

describe("validateVote — single", () => {
  it("accepts a known option", () => {
    const r = validateVote({ type: "single", config: null }, opts, { type: "single", option_id: 2 });
    expect(r).toEqual({ ok: true, rows: [{ option_id: 2, vote_value: null }] });
  });
  it("rejects an unknown option", () => {
    const r = validateVote({ type: "single", config: null }, opts, { type: "single", option_id: 99 });
    expect(r.ok).toBe(false);
  });
  it("rejects payload type mismatch", () => {
    const r = validateVote({ type: "single", config: null }, opts, { type: "multi", option_ids: [1] });
    expect(r.ok).toBe(false);
  });
});

describe("validateVote — multi", () => {
  it("dedupes option_ids", () => {
    const r = validateVote({ type: "multi", config: null }, opts, { type: "multi", option_ids: [1, 1, 2] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rows.map(x => x.option_id).sort()).toEqual([1, 2]);
  });
  it("enforces max_choices when configured", () => {
    const r = validateVote(
      { type: "multi", config: { max_choices: 2 } }, opts,
      { type: "multi", option_ids: [1, 2, 3] },
    );
    expect(r.ok).toBe(false);
  });
  it("requires at least one pick", () => {
    const r = validateVote({ type: "multi", config: null }, opts, { type: "multi", option_ids: [] });
    expect(r.ok).toBe(false);
  });
});

describe("validateVote — rating", () => {
  it("accepts ratings within scale", () => {
    const r = validateVote(
      { type: "rating", config: { rating_scale: 5 } }, opts,
      { type: "rating", ratings: [{ option_id: 1, value: 3 }, { option_id: 2, value: 5 }] },
    );
    expect(r.ok).toBe(true);
  });
  it("rejects out-of-range values", () => {
    const r = validateVote(
      { type: "rating", config: { rating_scale: 5 } }, opts,
      { type: "rating", ratings: [{ option_id: 1, value: 6 }] },
    );
    expect(r.ok).toBe(false);
  });
  it("rejects duplicate option ratings", () => {
    const r = validateVote(
      { type: "rating", config: { rating_scale: 5 } }, opts,
      { type: "rating", ratings: [{ option_id: 1, value: 3 }, { option_id: 1, value: 4 }] },
    );
    expect(r.ok).toBe(false);
  });
});

describe("validateVote — ranked", () => {
  it("accepts a full permutation", () => {
    const r = validateVote({ type: "ranked", config: null }, opts, { type: "ranked", order: [2, 1, 3] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rows.find(x => x.option_id === 2)?.vote_value).toBe(0);
      expect(r.rows.find(x => x.option_id === 1)?.vote_value).toBe(1);
      expect(r.rows.find(x => x.option_id === 3)?.vote_value).toBe(2);
    }
  });
  it("rejects partial ranking", () => {
    const r = validateVote({ type: "ranked", config: null }, opts, { type: "ranked", order: [2, 1] });
    expect(r.ok).toBe(false);
  });
  it("rejects duplicate positions (same option listed twice)", () => {
    const r = validateVote({ type: "ranked", config: null }, opts, { type: "ranked", order: [1, 1, 2] });
    expect(r.ok).toBe(false);
  });
});

describe("validateVote — approval", () => {
  it("accepts valid stance indices", () => {
    const r = validateVote(
      { type: "approval", config: { approval_stances: ["love", "use", "meh", "hate"] } }, opts,
      { type: "approval", choices: [{ option_id: 1, stance: 0 }, { option_id: 2, stance: 3 }] },
    );
    expect(r.ok).toBe(true);
  });
  it("rejects out-of-range stance", () => {
    const r = validateVote(
      { type: "approval", config: { approval_stances: ["love", "hate"] } }, opts,
      { type: "approval", choices: [{ option_id: 1, stance: 5 }] },
    );
    expect(r.ok).toBe(false);
  });
});

describe("validateVote — text_suggest", () => {
  it("accepts empty upvotes (voter only added new suggestion)", () => {
    const r = validateVote({ type: "text_suggest", config: null }, opts, { type: "text_suggest", upvote_ids: [] });
    expect(r.ok).toBe(true);
  });
  it("rejects upvote of unknown option", () => {
    const r = validateVote({ type: "text_suggest", config: null }, opts, { type: "text_suggest", upvote_ids: [99] });
    expect(r.ok).toBe(false);
  });
});

describe("isSingleVoteType", () => {
  it("returns true only for single and yesno", () => {
    expect(isSingleVoteType("single")).toBe(true);
    expect(isSingleVoteType("yesno")).toBe(true);
    expect(isSingleVoteType("multi")).toBe(false);
    expect(isSingleVoteType("rating")).toBe(false);
    expect(isSingleVoteType("ranked")).toBe(false);
    expect(isSingleVoteType("approval")).toBe(false);
    expect(isSingleVoteType("text_suggest")).toBe(false);
  });
});
