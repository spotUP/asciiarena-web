"use client";

import React, { useState, useEffect } from "react";
import PollVoteForm from "./PollVoteForm";
import PollResults from "./PollResults";
import type { PollView, PollResults as ResultsT, PollResultLayout } from "@/lib/polls/types";
import { resolveConfig } from "@/lib/polls/types";

interface Props {
  poll: PollView;
  myVotes: Array<{ option_id: number; vote_value: number | null }>;
  results: ResultsT;
  canSeeResults: boolean;
  isLoggedIn: boolean;
  layout: PollResultLayout;
  widthCells: number;
}

// Client wrapper that swaps the vote form for live results once the user has
// cast their vote. A small "change vote" link flips back to the form so the
// voter can revise.
export default function PollVoteOrResults({
  poll, myVotes, results, canSeeResults, isLoggedIn, layout, widthCells,
}: Props) {
  const hasVoted = myVotes.length > 0;
  const [showForm, setShowForm] = useState<boolean>(!hasVoted);

  // When the parent re-renders with fresh myVotes (after castVoteAction +
  // router.refresh), auto-collapse the form to results.
  useEffect(() => {
    if (hasVoted) setShowForm(false);
  }, [hasVoted, myVotes.length]);

  const cfg = resolveConfig(poll);

  if (showForm) {
    return (
      <div>
        <PollVoteForm poll={poll} myVotes={myVotes} isLoggedIn={isLoggedIn} />
        {hasVoted && (
          <div style={{ marginTop: "4px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="lightcyan"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}
            >
              [ back to results ]
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {canSeeResults ? (
        <PollResults
          results={results}
          layout={layout}
          widthCells={widthCells}
          approvalStances={poll.type === "approval" ? cfg.approval_stances : undefined}
        />
      ) : (
        <div className="lightgrey" style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
          {poll.show_results === "after_close" ? "* Results will appear when the poll closes." : "* Your vote was recorded."}
        </div>
      )}
      {poll.status === "open" && isLoggedIn && (
        <div style={{ marginTop: "4px", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="lightcyan"
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}
          >
            [ change my vote ]
          </button>
        </div>
      )}
    </div>
  );
}
