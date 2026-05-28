"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type {
  PollView,
  VotePayload,
} from "@/lib/polls/types";
import { resolveConfig } from "@/lib/polls/types";
import { castVoteAction } from "@/app/actions/polls";

interface FormProps {
  poll: PollView;
  myVotes: Array<{ option_id: number; vote_value: number | null }>;
  isLoggedIn: boolean;
}

export default function PollVoteForm({ poll, myVotes, isLoggedIn }: FormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return <div className="lightgrey" style={{ padding: "0", fontFamily: "TopazPlus_a1200, monospace" }}>
      <span className="yellow">[!]</span> Log in to vote in this poll.
    </div>;
  }
  if (poll.status !== "open") {
    return <div className="lightgrey" style={{ padding: "0", fontFamily: "TopazPlus_a1200, monospace" }}>
      <span className="lightred">[X]</span> Voting is closed.
    </div>;
  }

  // Live vote dispatch. Every state change in the input fires this. The server
  // action replaces the user's prior votes in a transaction, so racing two
  // updates is safe — the last one wins, matching the bars we then refresh.
  const send = (payload: VotePayload) => {
    setError(null);
    startTransition(async () => {
      const res = await castVoteAction(poll.id, payload);
      if (!res.ok) { setError(res.error ?? "Vote failed"); return; }
      router.refresh();
    });
  };

  const child = (() => {
    switch (poll.type) {
      case "single":   return <InputSingle   poll={poll} myVotes={myVotes} send={send} />;
      case "yesno":    return <InputSingle   poll={poll} myVotes={myVotes} send={send} />;
      case "multi":    return <InputMulti    poll={poll} myVotes={myVotes} send={send} />;
      case "rating":   return <InputRating   poll={poll} myVotes={myVotes} send={send} />;
      case "ranked":   return <InputRanked   poll={poll} myVotes={myVotes} send={send} />;
      case "approval": return <InputApproval poll={poll} myVotes={myVotes} send={send} />;
      case "text_suggest": return <InputTextSuggest poll={poll} myVotes={myVotes} send={send} />;
    }
  })();

  return (
    <div>
      {child}
      <div style={{ height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace", marginTop: "4px" }}>
        {error
          ? <span className="lightred">[!] {error}</span>
          : pending
            ? <span className="lightcyan">[saving...]</span>
            : myVotes.length > 0
              ? <span className="lightgreen">[ok - your vote is recorded]</span>
              : <span className="lightgrey">[ pick to cast your vote ]</span>}
      </div>
    </div>
  );
}

interface InputProps {
  poll: PollView;
  myVotes: FormProps["myVotes"];
  send: (payload: VotePayload) => void;
}

// ──────────────────────────────────────────────────────────────────────────
// Single choice / yes-no — radio, vote on click
// ──────────────────────────────────────────────────────────────────────────
function InputSingle({ poll, myVotes, send }: InputProps) {
  const [selected, setSelected] = useState<number | null>(myVotes[0]?.option_id ?? null);
  return (
    <div>
      {poll.options.map(o => {
        const id = `poll-${poll.id}-opt-${o.id}`;
        return (
          <div key={o.id} className="form-check form-switch">
            <input
              type="radio"
              className="form-check-input"
              name={`poll-${poll.id}`}
              id={id}
              checked={selected === o.id}
              onChange={() => { setSelected(o.id); send({ type: "single", option_id: o.id }); }}
            />
            <label className={`form-check-label ${selected === o.id ? "yellow" : "magenta"}`} htmlFor={id}>
              {o.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Multi-choice — checkbox, vote on every toggle
// ──────────────────────────────────────────────────────────────────────────
function InputMulti({ poll, myVotes, send }: InputProps) {
  const cfg = resolveConfig(poll);
  const [selected, setSelected] = useState<Set<number>>(new Set(myVotes.map(v => v.option_id)));
  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      send({ type: "multi", option_ids: Array.from(next) });
      return next;
    });
  };
  return (
    <div>
      {cfg.max_choices > 0 && (
        <div className="lightcyan" style={{ marginBottom: "4px", fontFamily: "TopazPlus_a1200, monospace", height: "16px", lineHeight: "16px" }}>
          [ pick up to {cfg.max_choices} ]
        </div>
      )}
      {poll.options.map(o => {
        const id = `poll-${poll.id}-opt-${o.id}`;
        const disabled = cfg.max_choices > 0 && !selected.has(o.id) && selected.size >= cfg.max_choices;
        return (
          <div key={o.id} className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id={id}
              checked={selected.has(o.id)}
              onChange={() => toggle(o.id)}
              disabled={disabled}
            />
            <label className={`form-check-label ${selected.has(o.id) ? "yellow" : "magenta"}`} htmlFor={id}>
              {o.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Rating per option — number buttons, vote on click
// ──────────────────────────────────────────────────────────────────────────
function InputRating({ poll, myVotes, send }: InputProps) {
  const cfg = resolveConfig(poll);
  const [ratings, setRatings] = useState<Record<number, number>>(
    Object.fromEntries(myVotes.map(v => [v.option_id, v.vote_value ?? 0])),
  );
  const setRating = (option_id: number, n: number) => {
    setRatings(prev => {
      const next = { ...prev, [option_id]: n };
      const list = Object.entries(next).filter(([, v]) => v > 0).map(([id, v]) => ({ option_id: Number(id), value: v }));
      send({ type: "rating", ratings: list });
      return next;
    });
  };
  return (
    <div>
      {poll.options.map(o => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "8px", height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}>
          <span className="magenta" style={{ minWidth: "160px" }}>{o.label}</span>
          {Array.from({ length: cfg.rating_scale }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(o.id, n)}
              className={ratings[o.id] === n ? "yellow" : "lightgrey"}
              style={{
                width: "24px", height: "16px", padding: 0,
                background: ratings[o.id] === n ? "#0000aa" : "transparent",
                border: "1px solid #555",
                fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px",
                cursor: "pointer",
              }}
            >{n}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Ranked — arrow buttons, vote on every move (debounced)
// ──────────────────────────────────────────────────────────────────────────
function InputRanked({ poll, myVotes, send }: InputProps) {
  const initial: number[] = (() => {
    if (myVotes.length === poll.options.length) {
      return [...myVotes].sort((a, b) => (a.vote_value ?? 0) - (b.vote_value ?? 0)).map(v => v.option_id);
    }
    return poll.options.map(o => o.id);
  })();
  const [order, setOrder] = useState<number[]>(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelById = new Map(poll.options.map(o => [o.id, o.label]));

  const move = (idx: number, dir: -1 | 1) => {
    setOrder(prev => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      // Debounce: rapid up/down clicks shouldn't fire one mutation per keystroke.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => send({ type: "ranked", order: next }), 250);
      return next;
    });
  };
  return (
    <div>
      <div className="lightcyan" style={{ marginBottom: "4px", height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace" }}>
        [ best first - rearrange with arrows ]
      </div>
      {order.map((id, i) => (
        <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px", height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}>
          <span className="yellow" style={{ minWidth: "32px" }}>{String(i + 1).padStart(2, "0")}.</span>
          <span className="magenta" style={{ minWidth: "200px" }}>{labelById.get(id)}</span>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
            className="btn-big bg-header lightcyan"
            style={{ height: "16px", lineHeight: "16px", padding: "0 8px", border: "none", cursor: "pointer", fontFamily: "TopazPlus_a1200, monospace" }}>
            ^
          </button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1}
            className="btn-big bg-header lightcyan"
            style={{ height: "16px", lineHeight: "16px", padding: "0 8px", border: "none", cursor: "pointer", fontFamily: "TopazPlus_a1200, monospace" }}>
            v
          </button>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Approval matrix — radio per stance, vote on click
// ──────────────────────────────────────────────────────────────────────────
function InputApproval({ poll, myVotes, send }: InputProps) {
  const cfg = resolveConfig(poll);
  const [choices, setChoices] = useState<Record<number, number>>(
    Object.fromEntries(myVotes.map(v => [v.option_id, v.vote_value ?? 0])),
  );
  const pick = (option_id: number, stance: number) => {
    setChoices(prev => {
      const next = { ...prev, [option_id]: stance };
      const list = Object.entries(next).map(([id, s]) => ({ option_id: Number(id), stance: s }));
      send({ type: "approval", choices: list });
      return next;
    });
  };
  return (
    <div>
      {poll.options.map(o => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", height: "16px", lineHeight: "16px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}>
          <span className="magenta" style={{ minWidth: "160px" }}>{o.label}</span>
          {cfg.approval_stances.map((s, sIdx) => {
            const id = `appr-${poll.id}-${o.id}-${sIdx}`;
            return (
              <div key={s} className="form-check form-switch" style={{ marginRight: "8px" }}>
                <input
                  type="radio"
                  className="form-check-input"
                  name={`approval-${poll.id}-${o.id}`}
                  id={id}
                  checked={choices[o.id] === sIdx}
                  onChange={() => pick(o.id, sIdx)}
                />
                <label className={`form-check-label ${choices[o.id] === sIdx ? "yellow" : "lightgrey"}`} htmlFor={id}>
                  {s}
                </label>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Text suggestions — vote on toggle + Enter submits a new suggestion
// ──────────────────────────────────────────────────────────────────────────
function InputTextSuggest({ poll, myVotes, send }: InputProps) {
  const cfg = resolveConfig(poll);
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set(myVotes.map(v => v.option_id)));
  const [newLabel, setNewLabel] = useState("");
  const toggle = (id: number) => {
    setUpvoted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      send({ type: "text_suggest", upvote_ids: Array.from(next) });
      return next;
    });
  };
  const submitNew = () => {
    const v = newLabel.trim();
    if (!v) return;
    setNewLabel("");
    send({ type: "text_suggest", upvote_ids: Array.from(upvoted), new_label: v });
  };
  return (
    <div>
      {poll.options.filter(o => o.approved).map(o => {
        const id = `suggest-${poll.id}-${o.id}`;
        return (
          <div key={o.id} className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id={id}
              checked={upvoted.has(o.id)}
              onChange={() => toggle(o.id)}
            />
            <label className={`form-check-label ${upvoted.has(o.id) ? "yellow" : "magenta"}`} htmlFor={id}>
              {o.label}
            </label>
          </div>
        );
      })}
      {cfg.allow_user_options && (
        <div style={{ marginTop: "8px" }}>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitNew(); } }}
            placeholder="Add a new suggestion... (Enter to add)"
            maxLength={200}
            className="form-control"
            style={{ width: "100%", height: "21px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px" }}
          />
        </div>
      )}
    </div>
  );
}
