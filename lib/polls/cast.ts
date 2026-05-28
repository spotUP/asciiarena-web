// Validation + normalisation of incoming vote payloads. Pure (no Prisma) so
// the same checks run in tests. The server action calls validateVote() then
// applyVote() — apply does the actual DB writes.

import type { PollType, PollOptionView, VotePayload, PollConfig } from "./types";
import { resolveConfig } from "./types";

export interface ValidationError {
  ok: false;
  error: string;
}
export interface ValidationOk {
  ok: true;
  // Normalised rows to write: each row = one (option_id, vote_value) pair.
  // The caller wraps these in a transaction and writes them under user_id.
  rows: Array<{ option_id: number; vote_value: number | null }>;
}
export type ValidationResult = ValidationOk | ValidationError;

export function validateVote(
  poll: { type: PollType; config: PollConfig | null },
  options: PollOptionView[],
  payload: VotePayload,
): ValidationResult {
  if (payload.type !== poll.type) {
    return { ok: false, error: `payload type "${payload.type}" does not match poll type "${poll.type}"` };
  }

  const validIds = new Set(options.map(o => o.id));
  const isValid = (id: number) => validIds.has(id);
  const cfg = resolveConfig({ type: poll.type, config: poll.config });

  switch (payload.type) {
    case "single":
    case "yesno": {
      if (!isValid(payload.option_id)) return { ok: false, error: "Unknown option" };
      return { ok: true, rows: [{ option_id: payload.option_id, vote_value: null }] };
    }

    case "multi": {
      const ids = Array.from(new Set(payload.option_ids));
      if (ids.length === 0) return { ok: false, error: "Pick at least one option" };
      if (ids.some(id => !isValid(id))) return { ok: false, error: "Unknown option" };
      if (cfg.max_choices > 0 && ids.length > cfg.max_choices) {
        return { ok: false, error: `Pick at most ${cfg.max_choices} options` };
      }
      return { ok: true, rows: ids.map(option_id => ({ option_id, vote_value: null })) };
    }

    case "rating": {
      const max = cfg.rating_scale;
      const seen = new Set<number>();
      const rows: ValidationOk["rows"] = [];
      for (const r of payload.ratings) {
        if (!isValid(r.option_id)) return { ok: false, error: "Unknown option" };
        if (seen.has(r.option_id)) return { ok: false, error: "Duplicate rating for the same option" };
        seen.add(r.option_id);
        if (!Number.isInteger(r.value) || r.value < 1 || r.value > max) {
          return { ok: false, error: `Rating must be 1..${max}` };
        }
        rows.push({ option_id: r.option_id, vote_value: r.value });
      }
      if (rows.length === 0) return { ok: false, error: "Rate at least one option" };
      return { ok: true, rows };
    }

    case "ranked": {
      const order = payload.order;
      if (order.length !== options.length) {
        return { ok: false, error: "Rank every option" };
      }
      const seen = new Set<number>();
      const rows: ValidationOk["rows"] = [];
      for (let pos = 0; pos < order.length; pos++) {
        const id = order[pos];
        if (!isValid(id)) return { ok: false, error: "Unknown option" };
        if (seen.has(id)) return { ok: false, error: "Same option ranked twice" };
        seen.add(id);
        rows.push({ option_id: id, vote_value: pos });
      }
      return { ok: true, rows };
    }

    case "approval": {
      const stanceCount = cfg.approval_stances.length;
      const seen = new Set<number>();
      const rows: ValidationOk["rows"] = [];
      for (const c of payload.choices) {
        if (!isValid(c.option_id)) return { ok: false, error: "Unknown option" };
        if (seen.has(c.option_id)) return { ok: false, error: "Duplicate stance for the same option" };
        seen.add(c.option_id);
        if (!Number.isInteger(c.stance) || c.stance < 0 || c.stance >= stanceCount) {
          return { ok: false, error: `Stance must be 0..${stanceCount - 1}` };
        }
        rows.push({ option_id: c.option_id, vote_value: c.stance });
      }
      if (rows.length === 0) return { ok: false, error: "Pick a stance on at least one option" };
      return { ok: true, rows };
    }

    case "text_suggest": {
      const ids = Array.from(new Set(payload.upvote_ids));
      if (ids.some(id => !isValid(id))) return { ok: false, error: "Unknown suggestion" };
      // No minimum — voter may submit a new suggestion without upvoting any
      // existing ones. The new_label, if present, is handled by the server
      // action (it creates a new poll_option and the upvote row in one tx).
      return { ok: true, rows: ids.map(option_id => ({ option_id, vote_value: null })) };
    }
  }
}

// For single/yesno only: the caller must replace any prior votes by this user
// for this poll before writing new ones. Returns true if this is one of those
// types so the action layer can branch.
export function isSingleVoteType(type: PollType): boolean {
  return type === "single" || type === "yesno";
}
