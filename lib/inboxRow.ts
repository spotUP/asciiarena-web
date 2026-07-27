// How one conversation is presented in the inbox list.
//
// The old list rendered a single string from resolveDisplayTitle(), which
// returns the override OR the subject OR the participants' nicks — never a
// combination — so a row was one bare word and you could not tell a thread
// with three people from a DM. It also dropped the last message entirely
// despite the API returning it.
//
// Keeping this derivation pure (no React, no Prisma) means the row's content
// is unit-testable, which is what the previous version had no way to assert.

import { defaultThreadTitle } from "./chatThread";

export interface InboxRowInput {
  overrideTitle: string | null;   // per-user rename, wins over everything
  subject: string | null;         // first message's subject ("Chat" already normalised to null)
  participants: Array<{ id: number; nick: string }>; // OTHER participants (excludes self)
  preview: string | null;         // newest message body
  lastSenderNick: string | null;  // who wrote it
  lastFromMe: boolean;
  unread: number;
}

export interface InboxRow {
  heading: string;
  /** Nicks line. Empty when the heading is already the participant list. */
  participantLine: string;
  /** "spot: sure, send it" — empty when there is nothing to preview. */
  previewLine: string;
  isUnread: boolean;
}

export const PREVIEW_MAX = 90;

// Collapse newlines so a multi-line message cannot blow up the row height, and
// cut to a single grid-friendly line.
export function truncatePreview(text: string, max = PREVIEW_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max - 1).trimEnd() + "…";
}

export function buildInboxRow(input: InboxRowInput): InboxRow {
  const nicks = input.participants.map(p => p.nick);
  const named = (input.overrideTitle?.trim() || input.subject?.trim()) ?? "";

  // With a name, the nicks get their own line. Without one, the nicks ARE the
  // heading and repeating them below would be noise.
  const heading = named || defaultThreadTitle(nicks);
  const participantLine = named ? nicks.join(", ") : "";

  const body = input.preview?.trim() ? truncatePreview(input.preview) : "";
  const who = input.lastFromMe ? "you" : (input.lastSenderNick?.trim() || "");
  const previewLine = body ? (who ? `${who}: ${body}` : body) : "";

  return { heading, participantLine, previewLine, isUnread: input.unread > 0 };
}
