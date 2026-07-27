import { describe, it, expect } from "vitest";
import { buildInboxRow, truncatePreview, PREVIEW_MAX } from "@/lib/inboxRow";
import { isArchived } from "@/lib/chatThread";

const base = {
  overrideTitle: null,
  subject: null,
  participants: [{ id: 2, nick: "spot" }],
  preview: null,
  lastSenderNick: null,
  lastFromMe: false,
  unread: 0,
};

describe("buildInboxRow — the row shows subject AND participants", () => {
  it("puts the subject in the heading and the nicks on their own line", () => {
    const row = buildInboxRow({
      ...base,
      subject: "re: logo swap",
      participants: [{ id: 2, nick: "spot" }, { id: 3, nick: "dipswitch" }],
    });
    expect(row.heading).toBe("re: logo swap");
    expect(row.participantLine).toBe("spot, dipswitch");
  });

  it("does not repeat the nicks when they are already the heading", () => {
    const row = buildInboxRow({ ...base, subject: null });
    expect(row.heading).toBe("spot");
    expect(row.participantLine).toBe("");
  });

  it("lets a per-user rename win over the subject", () => {
    const row = buildInboxRow({ ...base, overrideTitle: "the logo thing", subject: "re: logo swap" });
    expect(row.heading).toBe("the logo thing");
    expect(row.participantLine).toBe("spot");
  });

  it("falls back to a placeholder when a thread has no other participants", () => {
    const row = buildInboxRow({ ...base, participants: [] });
    expect(row.heading).toBe("(empty)");
  });
});

describe("buildInboxRow — the preview the old list threw away", () => {
  it("renders the newest message with its sender", () => {
    const row = buildInboxRow({ ...base, preview: "sure, send it", lastSenderNick: "spot" });
    expect(row.previewLine).toBe("spot: sure, send it");
  });

  it("says 'you' for your own last message", () => {
    const row = buildInboxRow({ ...base, preview: "sure, send it", lastSenderNick: "spot", lastFromMe: true });
    expect(row.previewLine).toBe("you: sure, send it");
  });

  it("is empty when there is nothing to preview", () => {
    expect(buildInboxRow({ ...base, preview: null }).previewLine).toBe("");
    expect(buildInboxRow({ ...base, preview: "   " }).previewLine).toBe("");
  });

  it("keeps a multi-line message on one line", () => {
    const row = buildInboxRow({ ...base, preview: "line one\nline two", lastSenderNick: "spot" });
    expect(row.previewLine).toBe("spot: line one line two");
  });
});

describe("truncatePreview", () => {
  it("leaves a short message alone", () => {
    expect(truncatePreview("short")).toBe("short");
  });

  it("cuts a long message to the limit", () => {
    const out = truncatePreview("x".repeat(PREVIEW_MAX + 50));
    expect(out.length).toBe(PREVIEW_MAX);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("buildInboxRow — unread", () => {
  it("flags a row with unread messages", () => {
    expect(buildInboxRow({ ...base, unread: 2 }).isUnread).toBe(true);
    expect(buildInboxRow({ ...base, unread: 0 }).isUnread).toBe(false);
  });
});

describe("isArchived — archiving hides until something happens", () => {
  it("does not hide a thread that was never archived", () => {
    expect(isArchived({ archivedAt: null }, 1000)).toBe(false);
    expect(isArchived({}, 1000)).toBe(false);
  });

  it("hides a thread whose newest message predates the archive", () => {
    expect(isArchived({ archivedAt: 1000 }, 900)).toBe(true);
  });

  it("resurfaces a thread as soon as a newer message arrives", () => {
    expect(isArchived({ archivedAt: 1000 }, 1001)).toBe(false);
  });

  it("treats a message at exactly archived_at as already seen", () => {
    expect(isArchived({ archivedAt: 1000 }, 1000)).toBe(true);
  });

  it("keeps an empty archived thread hidden", () => {
    expect(isArchived({ archivedAt: 1000 }, null)).toBe(true);
  });
});
