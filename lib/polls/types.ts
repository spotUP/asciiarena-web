// Shared types for the polls system. Kept Prisma-free so client components
// can import without bundling the DB client.

export const POLL_TYPES = [
  "single",
  "multi",
  "yesno",
  "rating",
  "ranked",
  "approval",
  "text_suggest",
] as const;
export type PollType = (typeof POLL_TYPES)[number];

export const POLL_TYPE_LABELS: Record<PollType, string> = {
  single: "Single choice",
  multi: "Multi choice",
  yesno: "Yes / No / Maybe",
  rating: "Rating per option",
  ranked: "Ranked priority",
  approval: "Approval matrix",
  text_suggest: "Open suggestions",
};

export type PollStatus = "draft" | "open" | "closed";
export type PollShowResults = "always" | "after_vote" | "after_close";
export type PollResultLayout = "solid" | "tail" | "dual_row";

// Type-specific configuration stored as JSON on the poll row. Every field
// optional so older polls keep working when we extend the schema.
export interface PollConfig {
  max_choices?: number;          // multi: max options a voter may pick
  rating_scale?: number;          // rating: 1..N (default 5)
  approval_stances?: string[];   // approval: ordered labels, e.g. ["love","use","meh","hate"]
  allow_user_options?: boolean;  // text_suggest: whether users may add new options
  yesno_labels?: [string, string, string]; // yesno: override defaults ["Yes","No","Maybe"]
}

export interface PollOptionView {
  id: number;
  label: string;
  color_idx: number;
  sort_order: number;
  approved: boolean;
  created_by_id: number | null;
}

export interface PollView {
  id: number;
  slug: string;
  title: string;
  body: string;
  type: PollType;
  status: PollStatus;
  featured: boolean;
  created_by_id: number;
  opens_at: number | null;
  closes_at: number | null;
  config: PollConfig;
  show_results: PollShowResults;
  result_layout: PollResultLayout;
  created_at: number;
  updated_at: number;
  options: PollOptionView[];
}

// Vote payload sent from the client to the server action. Shape varies per
// poll type; the server validates against the poll's declared type.
export type VotePayload =
  | { type: "single"; option_id: number }
  | { type: "multi"; option_ids: number[] }
  | { type: "yesno"; option_id: number }
  | { type: "rating"; ratings: Array<{ option_id: number; value: number }> }
  | { type: "ranked"; order: number[] /* option_ids, best first */ }
  | { type: "approval"; choices: Array<{ option_id: number; stance: number }> }
  | { type: "text_suggest"; upvote_ids: number[]; new_label?: string };

// Aggregated, per-option result row. `value` is the per-type metric used to
// drive the bar fill. `pct` is normalised 0..1 against the largest value in
// the result set so bars share a visual scale.
export interface OptionResult {
  option_id: number;
  label: string;
  color_idx: number;
  value: number;
  display: string;       // formatted metric (e.g. "23 votes", "4.2 / 5", "Borda 12")
  pct: number;           // 0..1, used by AnsiBar
  // approval-only: per-stance histogram (sums to value)
  stances?: number[];
}

export interface PollResults {
  type: PollType;
  total_voters: number;
  rows: OptionResult[];
  // Each voter's own picks, if requested (lets the form pre-fill).
  my_votes?: Array<{ option_id: number; vote_value: number | null }>;
}

export const DEFAULT_APPROVAL_STANCES = ["Love", "Would use", "Meh", "Hate"];
export const DEFAULT_RATING_SCALE = 5;
export const DEFAULT_YESNO_LABELS: [string, string, string] = ["Yes", "No", "Maybe"];

export function resolveConfig(poll: { type: PollType; config: PollConfig | null | undefined }): Required<Pick<PollConfig, "rating_scale" | "approval_stances" | "yesno_labels" | "allow_user_options" | "max_choices">> {
  const c = poll.config ?? {};
  return {
    rating_scale: c.rating_scale ?? DEFAULT_RATING_SCALE,
    approval_stances: c.approval_stances?.length ? c.approval_stances : DEFAULT_APPROVAL_STANCES,
    yesno_labels: c.yesno_labels ?? DEFAULT_YESNO_LABELS,
    allow_user_options: c.allow_user_options ?? false,
    max_choices: c.max_choices ?? 0, // 0 = unlimited
  };
}
