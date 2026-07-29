import { describe, it, expect } from "vitest";
import { notifyTargets } from "../chatFanout";
import { visibleLeaveNotices, mergeLeaveNotices, leaveNoticeId } from "../chatTimeline";
import type { TimelineMessage } from "../chatTimeline";

/**
 * Reported: diNO could not read https://asciiarena.se/messages?thread=2269.
 *
 * He had left that thread -- along with 45 others, all stamped on 2026-06-04,
 * when the button now labelled "Leave" still read "Delete". Three separate
 * defects then combined:
 *
 *   1. /messages?thread=N synthesised its row from the members endpoint, which
 *      cannot report membership, so it hardcoded `left: false`. The row rendered
 *      a ChatWindow instead of "You left this chat -- Rejoin to read it", and
 *      the messages endpoint clamped his history to `timestamp <= left_at`. A
 *      truncated conversation, no explanation, no Rejoin button. (Fixed by
 *      asking /api/messages?thread=N for the real row; covered by the route.)
 *   2. He was still notified about it. 29 notifications had been delivered for
 *      threads he had left, 4 of them on thread 2269, each linking to a
 *      conversation he could no longer read. See notifyTargets below.
 *   3. Nobody told the OTHER member. hARRiSONbERGEROn kept writing for eight
 *      weeks, his messages addressed to nobody (to_id NULL), because departures
 *      were only ever announced live into an open window. See the notice
 *      helpers below.
 */

describe("notifyTargets", () => {
  it("does not notify a member who left the thread", () => {
    // The exact shape of the bug: no active others, but the sender's window
    // still posts the departed peer's id as `receiver`.
    expect(notifyTargets({
      activeOthers: [],
      threadHasParticipants: true,
      clientReceiver: 22,
    })).toEqual([]);
  });

  it("still notifies on a legacy thread with no participant rows", () => {
    // Why the fallback exists: pre-migration threads would otherwise notify
    // nobody at all.
    expect(notifyTargets({
      activeOthers: [],
      threadHasParticipants: false,
      clientReceiver: 22,
    })).toEqual([22]);
  });

  it("prefers actual membership over the client's word", () => {
    expect(notifyTargets({
      activeOthers: [7, 9],
      threadHasParticipants: true,
      clientReceiver: 22,
    })).toEqual([7, 9]);
  });

  it("notifies nobody when membership is unknown and no receiver was supplied", () => {
    expect(notifyTargets({
      activeOthers: [],
      threadHasParticipants: false,
      clientReceiver: null,
    })).toEqual([]);
  });
});

describe("visibleLeaveNotices", () => {
  const dino = { participantId: 1068, nick: "diNO", leftAt: 1780609266 };

  it("tells a remaining member that the other person left", () => {
    // hARRiSONbERGEROn's case: joined at the start, never left, and the
    // departure falls inside the messages being shown.
    expect(visibleLeaveNotices([dino], {
      viewerJoinedAt: 1774961631,
      viewerLeftAt: null,
      oldestShownTimestamp: 1774961631,
    })).toEqual([dino]);
  });

  it("ends a departed member's own history with their departure", () => {
    // leftAt sits exactly on the boundary of their window, so it must not be
    // excluded by the upper bound.
    expect(visibleLeaveNotices([dino], {
      viewerJoinedAt: 1774961631,
      viewerLeftAt: 1780609266,
      oldestShownTimestamp: 1774961631,
    })).toEqual([dino]);
  });

  it("hides departures that happened after the viewer was already gone", () => {
    const later = { participantId: 2000, nick: "someoneElse", leftAt: 1784000000 };
    expect(visibleLeaveNotices([later], {
      viewerJoinedAt: 1774961631,
      viewerLeftAt: 1780609266,
      oldestShownTimestamp: 1774961631,
    })).toEqual([]);
  });

  it("hides departures from before the viewer joined", () => {
    expect(visibleLeaveNotices([dino], {
      viewerJoinedAt: 1784000000,
      viewerLeftAt: null,
      oldestShownTimestamp: 1784000000,
    })).toEqual([]);
  });

  it("does not dangle a notice above a truncated history", () => {
    // History is capped at the most recent messages. A notice older than the
    // oldest one shown would float at the top with nothing to anchor it.
    expect(visibleLeaveNotices([dino], {
      viewerJoinedAt: 1774961631,
      viewerLeftAt: null,
      oldestShownTimestamp: 1784336900,
    })).toEqual([]);
  });

  it("keeps notices when there are no messages to bound them", () => {
    expect(visibleLeaveNotices([dino], {
      viewerJoinedAt: 1774961631,
      viewerLeftAt: null,
      oldestShownTimestamp: null,
    })).toEqual([dino]);
  });
});

describe("mergeLeaveNotices", () => {
  // The endpoint returns newest-first and the client reverses for display, so
  // the merge has to preserve newest-first to land at the right point in the
  // conversation.
  const msgs: TimelineMessage[] = [
    { id: 3423, timestamp: 1785030736 },
    { id: 3419, timestamp: 1784469301 },
    { id: 3157, timestamp: 1775647192 },
  ];

  it("places the departure between the messages it fell between", () => {
    const merged = mergeLeaveNotices(msgs, [
      { participantId: 1068, nick: "diNO", leftAt: 1780609266 },
    ]);
    expect(merged.map(m => m.id)).toEqual([3423, 3419, leaveNoticeId(1068), 3157]);
  });

  it("gives notices ids that cannot collide with message ids", () => {
    // The client keys rows by id; a collision would make React reuse the wrong
    // node. Negative and derived from the participant row, so it is also stable
    // across reloads.
    expect(leaveNoticeId(1068)).toBe(-1068);
    expect(leaveNoticeId(1068)).toBeLessThan(0);
  });

  it("marks them so the client renders a status line, not a message", () => {
    const merged = mergeLeaveNotices(msgs, [
      { participantId: 1068, nick: "diNO", leftAt: 1780609266 },
    ]);
    const notice = merged.find(m => m.id < 0);
    expect(notice?.kind).toBe("left");
    expect(notice?.nick).toBe("diNO");
  });

  it("leaves the history untouched when nobody has left", () => {
    expect(mergeLeaveNotices(msgs, []).map(m => m.id)).toEqual([3423, 3419, 3157]);
  });

  it("orders a departure after a message posted in the same second", () => {
    const merged = mergeLeaveNotices(
      [{ id: 500, timestamp: 1780609266 }] as TimelineMessage[],
      [{ participantId: 7, nick: "diNO", leftAt: 1780609266 }],
    );
    // Newest-first, so "after" means earlier in the array.
    expect(merged.map(m => m.id)).toEqual([leaveNoticeId(7), 500]);
  });
});
