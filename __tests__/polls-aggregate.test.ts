import { describe, it, expect } from "vitest";
import { aggregate, type RawVote } from "@/lib/polls/aggregate";
import type { PollOptionView, PollType } from "@/lib/polls/types";

function opt(id: number, label = `opt${id}`, color = 7): PollOptionView {
  return { id, label, color_idx: color, sort_order: id, approved: true, created_by_id: null };
}
function vote(user_id: number, option_id: number, vote_value: number | null = null): RawVote {
  return { user_id, option_id, vote_value };
}

describe("aggregate — single choice", () => {
  it("counts votes per option and computes pct against distinct voters", () => {
    const result = aggregate({
      type: "single",
      config: null,
      options: [opt(1), opt(2)],
      votes: [vote(10, 1), vote(11, 1), vote(12, 2)],
    });
    expect(result.total_voters).toBe(3);
    expect(result.rows[0]).toMatchObject({ option_id: 1, value: 2, pct: 2 / 3 });
    expect(result.rows[1]).toMatchObject({ option_id: 2, value: 1, pct: 1 / 3 });
  });

  it("handles zero votes without dividing by zero", () => {
    const result = aggregate({ type: "single", config: null, options: [opt(1)], votes: [] });
    expect(result.total_voters).toBe(0);
    expect(result.rows[0]).toMatchObject({ value: 0, pct: 0, display: "0 votes" });
  });
});

describe("aggregate — multi choice", () => {
  it("counts independently per option, voters can pick multiple", () => {
    const result = aggregate({
      type: "multi",
      config: null,
      options: [opt(1), opt(2), opt(3)],
      votes: [vote(10, 1), vote(10, 2), vote(11, 2), vote(11, 3)],
    });
    expect(result.total_voters).toBe(2); // distinct user_ids
    expect(result.rows.find(r => r.option_id === 2)?.value).toBe(2);
  });
});

describe("aggregate — yesno", () => {
  it("counts each stance option separately", () => {
    const result = aggregate({
      type: "yesno",
      config: null,
      options: [opt(1, "Yes"), opt(2, "No"), opt(3, "Maybe")],
      votes: [vote(1, 1), vote(2, 1), vote(3, 2), vote(4, 3)],
    });
    expect(result.rows.find(r => r.label === "Yes")?.value).toBe(2);
    expect(result.rows.find(r => r.label === "No")?.value).toBe(1);
    expect(result.rows.find(r => r.label === "Maybe")?.value).toBe(1);
  });
});

describe("aggregate — rating", () => {
  it("averages per-option scores and normalises against rating_scale", () => {
    const result = aggregate({
      type: "rating",
      config: { rating_scale: 5 },
      options: [opt(1)],
      votes: [vote(10, 1, 4), vote(11, 1, 2), vote(12, 1, 5)],
    });
    const avg = (4 + 2 + 5) / 3;
    expect(result.rows[0].value).toBeCloseTo(avg);
    expect(result.rows[0].pct).toBeCloseTo(avg / 5);
  });

  it("ignores null/zero vote_values defensively", () => {
    const result = aggregate({
      type: "rating",
      config: { rating_scale: 5 },
      options: [opt(1)],
      votes: [vote(10, 1, null), vote(11, 1, 0), vote(12, 1, 3)],
    });
    expect(result.rows[0].value).toBe(3);
  });

  it("returns 0 pct when no rated votes exist", () => {
    const result = aggregate({
      type: "rating",
      config: { rating_scale: 5 },
      options: [opt(1)],
      votes: [],
    });
    expect(result.rows[0]).toMatchObject({ value: 0, pct: 0, display: "no votes" });
  });
});

describe("aggregate — ranked (Borda)", () => {
  it("scores each option as (N - position) summed across voters", () => {
    // 3 options, 2 voters. Voter A ranks: opt1,opt2,opt3 (positions 0,1,2).
    // Voter B ranks: opt2,opt1,opt3.
    const result = aggregate({
      type: "ranked",
      config: null,
      options: [opt(1), opt(2), opt(3)],
      votes: [
        vote(10, 1, 0), vote(10, 2, 1), vote(10, 3, 2),
        vote(11, 2, 0), vote(11, 1, 1), vote(11, 3, 2),
      ],
    });
    // opt1: (3-0)+(3-1) = 5; opt2: (3-1)+(3-0) = 5; opt3: (3-2)+(3-2) = 2
    const score = (id: number) => result.rows.find(r => r.option_id === id)?.value;
    expect(score(1)).toBe(5);
    expect(score(2)).toBe(5);
    expect(score(3)).toBe(2);
    // Result rows sorted by score descending.
    expect(result.rows[result.rows.length - 1].option_id).toBe(3);
  });
});

describe("aggregate — approval matrix", () => {
  it("produces per-stance histogram per option", () => {
    const result = aggregate({
      type: "approval",
      config: { approval_stances: ["love", "use", "meh", "hate"] },
      options: [opt(1)],
      votes: [vote(10, 1, 0), vote(11, 1, 0), vote(12, 1, 2), vote(13, 1, 3)],
    });
    expect(result.rows[0].stances).toEqual([2, 0, 1, 1]);
    expect(result.rows[0].value).toBe(4);
  });
});

describe("aggregate — text_suggest", () => {
  it("filters unapproved options out of results", () => {
    const result = aggregate({
      type: "text_suggest",
      config: null,
      options: [
        { ...opt(1, "approved"), approved: true },
        { ...opt(2, "pending"), approved: false },
      ],
      votes: [vote(10, 1), vote(11, 1), vote(12, 2)],
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].label).toBe("approved");
  });

  it("sorts by upvote count descending", () => {
    const result = aggregate({
      type: "text_suggest",
      config: null,
      options: [opt(1, "a"), opt(2, "b")],
      votes: [vote(10, 2), vote(11, 2), vote(12, 1)],
    });
    expect(result.rows[0].option_id).toBe(2);
    expect(result.rows[1].option_id).toBe(1);
  });
});

describe("aggregate — type coverage", () => {
  it("returns a row per option for every poll type", () => {
    const types: PollType[] = ["single", "multi", "yesno", "rating", "ranked", "approval", "text_suggest"];
    for (const type of types) {
      const result = aggregate({ type, config: null, options: [opt(1), opt(2)], votes: [] });
      expect(result.rows.length).toBeGreaterThan(0);
    }
  });
});
