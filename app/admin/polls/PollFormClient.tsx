"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { POLL_TYPES, POLL_TYPE_LABELS, type PollType, type PollStatus, type PollShowResults, type PollResultLayout, type PollConfig, DEFAULT_APPROVAL_STANCES, DEFAULT_RATING_SCALE, DEFAULT_YESNO_LABELS } from "@/lib/polls/types";
import { ANSI_PALETTE, ANSI_PALETTE_LABELS } from "@/lib/polls/palette";
import { DateTimePicker } from "@/components/ui/DatePicker";

interface OptionDraft { id?: number; label: string; color_idx: number }
interface InitialPoll {
  id: number;
  title: string;
  slug: string;
  body: string;
  type: PollType;
  status: PollStatus;
  featured: boolean;
  opens_at: number | null;
  closes_at: number | null;
  config: PollConfig;
  show_results: PollShowResults;
  result_layout: PollResultLayout;
  options: OptionDraft[];
}

// Uses the site's existing .form-control / .form-select / btn-big classes so
// inputs and dropdowns match the rest of the admin theme.
const LABEL_CLASS = "lightgrey";
const LABEL_STYLE: React.CSSProperties = { display: "block", marginBottom: "4px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" };
const INPUT_CLASS = "form-control";
const SELECT_CLASS = "form-select";
const BTN_CLASS = "btn-big bg-header yellow";
const BTN_STYLE: React.CSSProperties = {
  height: "32px", lineHeight: "32px", padding: "0 16px", border: "none",
  fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", cursor: "pointer",
};
const FIELD: React.CSSProperties = { marginBottom: "16px" };

export default function PollFormClient({ initial }: { initial?: InitialPoll }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [type, setType] = useState<PollType>(initial?.type ?? "single");
  const [status, setStatus] = useState<PollStatus>(initial?.status ?? "draft");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [showResults, setShowResults] = useState<PollShowResults>(initial?.show_results ?? "always");
  const [resultLayout, setResultLayout] = useState<PollResultLayout>(initial?.result_layout ?? "tail");
  const [maxChoices, setMaxChoices] = useState<number>(initial?.config?.max_choices ?? 0);
  const [ratingScale, setRatingScale] = useState<number>(initial?.config?.rating_scale ?? DEFAULT_RATING_SCALE);
  const [approvalStances, setApprovalStances] = useState<string>(
    (initial?.config?.approval_stances ?? DEFAULT_APPROVAL_STANCES).join(", "),
  );
  const [allowUserOptions, setAllowUserOptions] = useState(initial?.config?.allow_user_options ?? false);
  const [opensAt, setOpensAt] = useState<string>(initial?.opens_at ? new Date(initial.opens_at * 1000).toISOString().slice(0, 16) : "");
  const [closesAt, setClosesAt] = useState<string>(initial?.closes_at ? new Date(initial.closes_at * 1000).toISOString().slice(0, 16) : "");
  const [options, setOptions] = useState<OptionDraft[]>(
    initial?.options.length ? initial.options : defaultOptionsFor("single"),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTypeChange = (t: PollType) => {
    setType(t);
    if (!isEdit) setOptions(defaultOptionsFor(t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const config: PollConfig = {};
    if (type === "multi" && maxChoices > 0) config.max_choices = maxChoices;
    if (type === "rating") config.rating_scale = ratingScale;
    if (type === "approval") {
      config.approval_stances = approvalStances.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (type === "text_suggest") config.allow_user_options = allowUserOptions;

    const payload = {
      title, slug, body, type, status, featured,
      opens_at: opensAt ? Math.floor(new Date(opensAt).getTime() / 1000) : null,
      closes_at: closesAt ? Math.floor(new Date(closesAt).getTime() / 1000) : null,
      config, show_results: showResults, result_layout: resultLayout,
      options: options.filter(o => o.label.trim().length > 0),
    };

    const url = isEdit ? `/api/admin/polls/${initial!.id}` : "/api/admin/polls";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as { ok?: boolean; error?: string; slug?: string };
    setSubmitting(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.push("/admin/polls");
    router.refresh();
  };

  const deletePoll = async () => {
    if (!initial) return;
    if (!confirm(`Delete poll "${initial.title}"? This removes all votes.`)) return;
    const res = await fetch(`/api/admin/polls/${initial.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/admin/polls"); router.refresh(); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "768px" }}>
      <div style={FIELD}>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Title</label>
        <input className={INPUT_CLASS} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} />
      </div>

      <div style={FIELD}>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Slug (auto from title if blank)</label>
        <input className={INPUT_CLASS} value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={96} />
      </div>

      <div style={FIELD}>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Body (markdown or ANSI; shown above options)</label>
        <textarea className={INPUT_CLASS} rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Type</label>
          <select className={SELECT_CLASS} value={type} onChange={(e) => onTypeChange(e.target.value as PollType)}>
            {POLL_TYPES.map(t => <option key={t} value={t}>{POLL_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Status</label>
          <select className={SELECT_CLASS} value={status} onChange={(e) => setStatus(e.target.value as PollStatus)}>
            <option value="draft">Draft</option>
            <option value="open">Open (accepting votes)</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Show results</label>
          <select className={SELECT_CLASS} value={showResults} onChange={(e) => setShowResults(e.target.value as PollShowResults)}>
            <option value="always">Always</option>
            <option value="after_vote">After I vote</option>
            <option value="after_close">After poll closes</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Bar layout</label>
          <select className={SELECT_CLASS} value={resultLayout} onChange={(e) => setResultLayout(e.target.value as PollResultLayout)}>
            <option value="solid">Solid (cell precision)</option>
            <option value="tail">Tail (sub-cell hints)</option>
            <option value="dual_row">Dual row (hero)</option>
          </select>
        </div>
      </div>

      <div
        className="form-check form-switch"
        style={{
          marginBottom: "16px",
          padding: "8px 16px 8px 48px",
          background: "#212121",
          border: `1px solid ${featured ? "#ffff55" : "#555"}`,
        }}
      >
        <input
          type="checkbox"
          className="form-check-input"
          id="poll-featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        <label className={`form-check-label ${featured ? "yellow" : "magenta"}`} htmlFor="poll-featured" style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}>
          {featured ? "FEATURED ON HOMEPAGE HERO" : "Feature on homepage hero"}
        </label>
      </div>

      {type === "multi" && (
        <div style={FIELD}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Max choices (0 = unlimited)</label>
          <input type="number" className={INPUT_CLASS} value={maxChoices} min={0} onChange={(e) => setMaxChoices(Number(e.target.value))} />
        </div>
      )}
      {type === "rating" && (
        <div style={FIELD}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Rating scale (1..N)</label>
          <input type="number" className={INPUT_CLASS} value={ratingScale} min={2} max={10} onChange={(e) => setRatingScale(Number(e.target.value))} />
        </div>
      )}
      {type === "approval" && (
        <div style={FIELD}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Stances (comma-separated, best to worst)</label>
          <input className={INPUT_CLASS} value={approvalStances} onChange={(e) => setApprovalStances(e.target.value)} />
        </div>
      )}
      {type === "text_suggest" && (
        <div className="form-check form-switch" style={{ marginBottom: "16px" }}>
          <input
            type="checkbox"
            className="form-check-input"
            id="poll-allow-user-options"
            checked={allowUserOptions}
            onChange={(e) => setAllowUserOptions(e.target.checked)}
          />
          <label className="form-check-label lightgrey" htmlFor="poll-allow-user-options">
            Let voters submit new suggestions
          </label>
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Opens at (optional)</label>
          <DateTimePicker value={opensAt} onChange={setOpensAt} />
        </div>
        <div style={{ flex: 1 }}>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>Closes at (optional)</label>
          <DateTimePicker value={closesAt} onChange={setClosesAt} />
        </div>
      </div>

      <div style={FIELD}>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Options</label>
        {options.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
            <input
              className={INPUT_CLASS}
              style={{ flex: 1 }}
              value={o.label}
              onChange={(e) => setOptions(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
              placeholder="Option label"
            />
            <select
              className={SELECT_CLASS}
              style={{ width: "192px" }}
              value={o.color_idx}
              onChange={(e) => setOptions(prev => prev.map((x, j) => j === i ? { ...x, color_idx: Number(e.target.value) } : x))}
            >
              {ANSI_PALETTE.map((_hex, idx) => (
                <option key={idx} value={idx}>{ANSI_PALETTE_LABELS[idx]}</option>
              ))}
            </select>
            <span style={{ display: "inline-block", width: "32px", height: "16px", backgroundColor: ANSI_PALETTE[o.color_idx], border: "1px solid #555" }} />
            <button type="button" className={BTN_CLASS} style={{ ...BTN_STYLE, height: "21px", lineHeight: "21px", padding: "0 8px" }} onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className={BTN_CLASS} style={BTN_STYLE} onClick={() => setOptions(prev => [...prev, { label: "", color_idx: 7 }])}>
          + Add option
        </button>
      </div>

      {error && <div className="lightred" style={{ marginBottom: "16px", fontFamily: "TopazPlus_a1200, monospace" }}>[!] {error}</div>}

      <div style={{ display: "flex", gap: "16px" }}>
        <button type="submit" className={BTN_CLASS} style={BTN_STYLE} disabled={submitting}>{submitting ? "Saving..." : isEdit ? "Save changes" : "Create poll"}</button>
        {isEdit && (
          <button type="button" className="btn-big bg-header lightred" style={BTN_STYLE} onClick={deletePoll}>Delete</button>
        )}
      </div>
    </form>
  );
}

function defaultOptionsFor(type: PollType): OptionDraft[] {
  switch (type) {
    case "yesno":
      return DEFAULT_YESNO_LABELS.map((l, i) => ({ label: l, color_idx: [10, 1, 11][i] ?? 7 }));
    case "rating":
    case "approval":
      return [{ label: "Option A", color_idx: 4 }, { label: "Option B", color_idx: 11 }];
    case "ranked":
      return [
        { label: "Option A", color_idx: 4 },
        { label: "Option B", color_idx: 11 },
        { label: "Option C", color_idx: 10 },
      ];
    case "text_suggest":
      return [];
    default:
      return [
        { label: "Option A", color_idx: 4 },
        { label: "Option B", color_idx: 11 },
      ];
  }
}
