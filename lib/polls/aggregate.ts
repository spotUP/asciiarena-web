// Pure aggregation helpers. Given a list of raw vote rows, produce the per-
// option result rows the UI renders. Kept pure (no Prisma) so it's trivially
// unit-testable and reusable from both server actions and load-time queries.

import type {
  OptionResult,
  PollResults,
  PollType,
  PollOptionView,
  PollConfig,
} from "./types";
import { resolveConfig } from "./types";

export interface RawVote {
  user_id: number;
  option_id: number;
  vote_value: number | null;
}

export interface AggregateInput {
  type: PollType;
  config: PollConfig | null;
  options: PollOptionView[];
  votes: RawVote[];
}

export function aggregate(input: AggregateInput): PollResults {
  const { type, options, votes } = input;
  const cfg = resolveConfig({ type, config: input.config });

  // Distinct voters in this poll. For single/multi/yesno/text_suggest, total
  // voters = distinct user_ids across all options. For rating/ranked/approval
  // every voter contributes one row per option, so this is still correct.
  const totalVoters = new Set(votes.map(v => v.user_id)).size;

  // Pre-bucket votes by option_id for O(N) aggregation.
  const byOption = new Map<number, RawVote[]>();
  for (const v of votes) {
    const arr = byOption.get(v.option_id);
    if (arr) arr.push(v);
    else byOption.set(v.option_id, [v]);
  }

  let rows: OptionResult[];

  switch (type) {
    case "single":
    case "multi":
    case "yesno": {
      rows = options.map(opt => {
        const count = byOption.get(opt.id)?.length ?? 0;
        return {
          option_id: opt.id,
          label: opt.label,
          color_idx: opt.color_idx,
          value: count,
          display: `${count} ${count === 1 ? "vote" : "votes"}`,
          pct: totalVoters === 0 ? 0 : count / totalVoters,
        } satisfies OptionResult;
      });
      break;
    }

    case "rating": {
      const max = cfg.rating_scale;
      rows = options.map(opt => {
        const bucket = byOption.get(opt.id) ?? [];
        const values = bucket.map(v => v.vote_value ?? 0).filter(n => n > 0);
        const avg = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
        return {
          option_id: opt.id,
          label: opt.label,
          color_idx: opt.color_idx,
          value: avg,
          display: values.length === 0 ? "no votes" : `${avg.toFixed(2)} / ${max} (${values.length})`,
          pct: max === 0 ? 0 : avg / max,
        } satisfies OptionResult;
      });
      break;
    }

    case "ranked": {
      // Borda: for each vote, score = (N - position). Position 0 (best) gets
      // N points. Sum across voters → option score. Normalise pct against
      // the theoretical max (N * voters).
      const n = options.length;
      const maxScore = n * totalVoters;
      rows = options.map(opt => {
        const bucket = byOption.get(opt.id) ?? [];
        const score = bucket.reduce((acc, v) => acc + (n - (v.vote_value ?? n)), 0);
        return {
          option_id: opt.id,
          label: opt.label,
          color_idx: opt.color_idx,
          value: score,
          display: `Borda ${score}`,
          pct: maxScore === 0 ? 0 : score / maxScore,
        } satisfies OptionResult;
      });
      // Sort by score descending so the ranked layout reads naturally.
      rows.sort((a, b) => b.value - a.value);
      break;
    }

    case "approval": {
      const stanceCount = cfg.approval_stances.length;
      rows = options.map(opt => {
        const bucket = byOption.get(opt.id) ?? [];
        const stances = new Array<number>(stanceCount).fill(0);
        for (const v of bucket) {
          const s = v.vote_value ?? 0;
          if (s >= 0 && s < stanceCount) stances[s]++;
        }
        const total = bucket.length;
        return {
          option_id: opt.id,
          label: opt.label,
          color_idx: opt.color_idx,
          value: total,
          display: `${total} ${total === 1 ? "voter" : "voters"}`,
          pct: totalVoters === 0 ? 0 : total / totalVoters,
          stances,
        } satisfies OptionResult;
      });
      break;
    }

    case "text_suggest": {
      rows = options
        .filter(o => o.approved)
        .map(opt => {
          const count = byOption.get(opt.id)?.length ?? 0;
          return {
            option_id: opt.id,
            label: opt.label,
            color_idx: opt.color_idx,
            value: count,
            display: `${count} ${count === 1 ? "upvote" : "upvotes"}`,
            pct: totalVoters === 0 ? 0 : count / totalVoters,
          } satisfies OptionResult;
        });
      rows.sort((a, b) => b.value - a.value);
      break;
    }
  }

  return { type, total_voters: totalVoters, rows };
}
