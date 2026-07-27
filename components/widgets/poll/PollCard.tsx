import React from "react";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import PollResults from "./PollResults";
import PollVoteOrResults from "./PollVoteOrResults";
import PollCountdown from "./PollCountdown";
import type { PollView, PollResults as ResultsT } from "@/lib/polls/types";
import { resolveConfig, POLL_TYPE_LABELS } from "@/lib/polls/types";

// Shared "card" used by the hero, the /polls/[slug] page, the /polls list
// page, and (in compact form) the sidebar latest-closed widget.

interface Props {
  poll: PollView;
  myVotes: Array<{ option_id: number; vote_value: number | null }>;
  results: ResultsT;
  canSeeResults: boolean;
  isLoggedIn: boolean;
  variant?: "hero" | "page" | "list" | "sidebar";
}

export default function PollCard({ poll, myVotes, results, canSeeResults, isLoggedIn, variant = "page" }: Props) {
  const cfg = resolveConfig(poll);
  // Compact single-row layout everywhere except very-tall hero placements; the
  // form's option list already gives a label-per-row view, so the results
  // section just adds the bar — no need to repeat labels in a second row.
  const layout = variant === "sidebar" ? "solid" : "tail";
  const widthCells = variant === "hero" ? 40 : variant === "sidebar" ? 20 : 32;

  const titleAccent =
    variant === "hero" ? "yellow"
    : variant === "sidebar" ? "lightcyan"
    : "magenta";

  return (
    <div className="container-fluid m-0 p-0 amb-1 poll-card">
      {poll.effective_status === "open" && <LiveRefresh channel={`poll:${poll.id}`} />}

      <div className="header bg-header col-12 ap-1 text-truncate">
        <span className={titleAccent} style={{ marginRight: "16px" }}>
          {variant === "hero" ? ">> FEATURED POLL <<" : variant === "sidebar" ? "LAST POLL" : "POLL"}
        </span>
        <span className="white">{poll.title}</span>
        {variant !== "sidebar" && (
          <span className="lightgrey" style={{ marginLeft: "16px" }}>
            [{POLL_TYPE_LABELS[poll.type].toLowerCase()}]
          </span>
        )}
        {poll.effective_status === "open" && poll.closes_at && variant !== "sidebar" && (
          <PollCountdown closesAt={poll.closes_at} />
        )}
        {poll.effective_status === "closed" && (
          <span className="lightred" style={{ marginLeft: "16px" }}>[closed]</span>
        )}
        {poll.effective_status === "draft" && (
          <span className="yellow" style={{ marginLeft: "16px" }}>[not open yet]</span>
        )}
      </div>

      <div className="bg-secondary col-12 ap-1 amb-1">
        {variant !== "sidebar" && poll.body && (
          <div
            className="lightgrey"
            style={{
              whiteSpace: "pre-wrap",
              marginBottom: "8px",
              fontFamily: "TopazPlus_a1200, monospace",
              fontSize: "16px",
              lineHeight: "16px",
            }}
          >
            {poll.body}
          </div>
        )}

        {variant === "sidebar" ? (
          /* Read-only compact results for the sidebar widget. */
          canSeeResults && (
            <PollResults
              results={results}
              layout={layout}
              widthCells={widthCells}
              approvalStances={poll.type === "approval" ? cfg.approval_stances : undefined}
            />
          )
        ) : poll.effective_status === "open" ? (
          /* Live poll on hero / page: form swaps to results after vote. */
          <PollVoteOrResults
            poll={poll}
            myVotes={myVotes}
            results={results}
            canSeeResults={canSeeResults}
            isLoggedIn={isLoggedIn}
            layout={layout}
            widthCells={widthCells}
          />
        ) : poll.effective_status === "draft" ? (
          /* Scheduled but not started: nothing to vote on, nothing to show. */
          <div className="lightgrey" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
            * Voting has not opened yet.
          </div>
        ) : (
          /* Closed poll: results only. */
          canSeeResults ? (
            <PollResults
              results={results}
              layout={layout}
              widthCells={widthCells}
              approvalStances={poll.type === "approval" ? cfg.approval_stances : undefined}
            />
          ) : (
            <div className="grey-text" style={{ fontFamily: "TopazPlus_a1200, monospace" }}>
              * Results revealed when the poll closes.
            </div>
          )
        )}
      </div>
    </div>
  );
}
