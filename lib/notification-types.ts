// Notification kinds, kept free of any Prisma import so client components and
// unit tests can use them without a database connection — the same split as
// lib/activity-types.ts vs lib/activity.ts.

export type NotificationType =
  | "notif-comment"
  | "notif-fav"
  | "notif-reply"
  | "notif-message"
  | "notif-status"
  | "notif-poll"
  // Someone replied in a topic you started. Distinct from notif-reply, which
  // lib/notificationLabel.ts hardcodes as "replied to your request".
  | "notif-forum-reply"
  | "notif-mention";

/**
 * What the bell is allowed to show: things addressed to you personally that
 * you might need to act on.
 *
 * Comments and favourites are deliberately absent. They are "yours" only in
 * the sense that they landed on something you uploaded, so for anyone who has
 * uploaded a large slice of the archive they are a constant drip of
 * notifications about other people's browsing — which buries the messages that
 * actually need an answer. Those events are not lost: they still broadcast to
 * the site-wide LIVE FEED, which is where ambient "someone did something"
 * belongs.
 *
 * Applied when reading rather than when writing, so rows created before this
 * distinction existed stop appearing too, and so the choice can be revisited
 * without having thrown the data away.
 */
export const BELL_NOTIFICATION_TYPES: NotificationType[] = [
  "notif-message",
  "notif-reply",
  "notif-status",
  // Both are addressed to you by name and may want an answer, which is the
  // criterion above — not the ambient drip that comments and favourites are.
  "notif-forum-reply",
  "notif-mention",
];
