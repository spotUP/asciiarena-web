// Effective poll state — the single place that turns the stored `status`
// column plus the wall clock into the state the rest of the site acts on.
//
// The DB row alone is not the truth. A poll with `status = "open"` is over once
// `closes_at` has passed, and has not started yet while `opens_at` is still in
// the future, even though nothing has written to the row in either case. Every
// read path (list queries, hero, poll card) and every write path (the vote
// server actions) goes through here so they cannot drift apart.
//
// Prisma-free on purpose so client components can import it.

import type { PollStatus } from "./types";

export interface PollTiming {
  status: PollStatus;
  opens_at: number | null;
  closes_at: number | null;
}

export const nowSec = () => Math.floor(Date.now() / 1000);

// Nominally open, but its closing time has passed.
export function isPollExpired(poll: PollTiming, now: number): boolean {
  return poll.status === "open" && poll.closes_at !== null && poll.closes_at <= now;
}

// Nominally open, but scheduled to start later.
export function isPollPending(poll: PollTiming, now: number): boolean {
  return poll.status === "open" && poll.opens_at !== null && poll.opens_at > now;
}

// The status the site should behave as if the row held. A poll that has run out
// of time reads as closed; one that has not started yet reads as a draft.
export function effectivePollStatus(poll: PollTiming, now: number): PollStatus {
  if (isPollExpired(poll, now)) return "closed";
  if (isPollPending(poll, now)) return "draft";
  return poll.status;
}

// True when votes may still be cast / retracted.
export function isPollLive(poll: PollTiming, now: number): boolean {
  return effectivePollStatus(poll, now) === "open";
}

// Prisma `where` fragment matching only polls that are live right now. Used by
// the public list and the featured-poll lookup so out-of-window polls drop out
// in SQL rather than being filtered after the fact.
export function livePollWhere(now: number) {
  return {
    status: "open" as const,
    AND: [
      { OR: [{ opens_at: null }, { opens_at: { lte: now } }] },
      { OR: [{ closes_at: null }, { closes_at: { gt: now } }] },
    ],
  };
}
