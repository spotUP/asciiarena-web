// Shared, dependency-free contract for the chat "[!]" alert so the route, the
// client, and the tests agree on the wire shape and the rate-limit key.

export function alertRateLimitKey(userId: number, threadId: number): string {
  return `alert:${userId}:${threadId}`;
}

export interface AlertEvent {
  type: "alert";
  fromId: number;
  fromNick: string;
  [key: string]: unknown;
}

// fromId lets each receiver ignore the echo of their own alert (the sender
// already plays locally on click, so it must not double-play on the broadcast).
export function buildAlertEvent(fromId: number, fromNick: string): AlertEvent {
  return { type: "alert", fromId, fromNick };
}
