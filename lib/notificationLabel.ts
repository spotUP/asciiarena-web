// How a notification reads in the bell dropdown.
//
// Pure so the wording is testable: the dropdown renders the three parts in
// different colours, so it needs them separately rather than as one string.

export const KIND_VERB: Record<string, string> = {
  "notif-comment": "commented on",
  "notif-fav": "favourited",
  "notif-reply": "replied to your request",
  "notif-message": "sent you a message",
  "notif-status": "changed status of your request",
  "notif-poll": "opened a poll",
};

export interface NotificationLabel {
  actor: string;
  /** Verb including its separator, e.g. "sent you a message:". */
  verb: string;
  /** The thing acted on — a colly name, a subject, a chat preview. */
  target: string | null;
}

export function describeNotification(n: {
  kind: string;
  actorNick: string | null;
  target: string | null;
}): NotificationLabel {
  const base = KIND_VERB[n.kind] ?? n.kind;
  const target = n.target?.trim() ? n.target : null;
  // "commented on <colly>" is already a phrase; "sent you a message <subject>"
  // is not, so the message kind gets a colon — but only when a subject is
  // actually attached, since notifications created before subjects were
  // carried have none and would show a dangling colon.
  const needsColon = n.kind === "notif-message" && target !== null;
  return {
    actor: n.actorNick?.trim() ? n.actorNick : "someone",
    verb: needsColon ? `${base}:` : base,
    target,
  };
}
