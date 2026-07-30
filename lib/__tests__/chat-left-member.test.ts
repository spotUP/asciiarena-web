import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { notifyTargets, addressedTo, isThreadReadOnly } from "../chatFanout";
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
      otherParticipantsEver: 1,
      clientReceiver: 22,
    })).toEqual([]);
  });

  it("still notifies on a legacy thread with no participant rows", () => {
    // Why the fallback exists: pre-migration threads would otherwise notify
    // nobody at all.
    expect(notifyTargets({
      activeOthers: [],
      otherParticipantsEver: 0,
      clientReceiver: 22,
    })).toEqual([22]);
  });

  it("prefers actual membership over the client's word", () => {
    expect(notifyTargets({
      activeOthers: [7, 9],
      otherParticipantsEver: 1,
      clientReceiver: 22,
    })).toEqual([7, 9]);
  });

  it("notifies nobody when membership is unknown and no receiver was supplied", () => {
    expect(notifyTargets({
      activeOthers: [],
      otherParticipantsEver: 0,
      clientReceiver: null,
    })).toEqual([]);
  });
});

describe("a half-migrated thread is not an abandoned one", () => {
  /**
   * 106 threads on prod carry exactly ONE participant row -- the sender's own --
   * with the peer named only in messages.to_id. Nobody left them; the other side
   * was simply never recorded.
   *
   * An earlier version of these rules asked "does this thread have participant
   * rows?", which reads all 106 as abandoned. That silently stopped delivering
   * to the peer, and would have frozen the conversations as read-only. The test
   * is whether OTHERS were ever recorded, not whether any row exists.
   */
  const halfMigrated = { activeOthers: [], otherParticipantsEver: 0, clientReceiver: 22 };

  it("still notifies the peer", () => {
    expect(notifyTargets(halfMigrated)).toEqual([22]);
  });

  it("stays writable", () => {
    expect(isThreadReadOnly(halfMigrated)).toBe(false);
  });

  it("still addresses the row to the peer", () => {
    expect(addressedTo(notifyTargets(halfMigrated))).toBe(22);
  });
});

describe("isThreadReadOnly", () => {
  it("closes a thread whose other member left", () => {
    // The one that prompted this: eight weeks of messages into an empty room.
    expect(isThreadReadOnly({ activeOthers: [], otherParticipantsEver: 1 })).toBe(true);
  });

  it("leaves a live conversation open", () => {
    expect(isThreadReadOnly({ activeOthers: [2293], otherParticipantsEver: 1 })).toBe(false);
  });

  it("leaves a group open while anyone remains", () => {
    expect(isThreadReadOnly({ activeOthers: [7], otherParticipantsEver: 3 })).toBe(false);
  });
});

describe("addressedTo", () => {
  /**
   * `messages.to_id` used to be written straight from the client's `peerId`, so a
   * message could claim a recipient that membership denied -- addressed to
   * someone who had left. It is now derived from the same targets as the
   * notifications, so the row and the bell cannot disagree.
   *
   * The column still drives the new/unread reset in /api/chat/read, the 1:1
   * thread lookup in /api/chat/thread, and the pre-participants authorisation
   * fallbacks, so the existing cases have to keep their old answers.
   */
  it("addresses a two-person thread to the other person", () => {
    expect(addressedTo([22])).toBe(22);
  });

  it("addresses a group to nobody, as it always did", () => {
    // Three or more in the thread: to_id was already NULL for these.
    expect(addressedTo([7, 9])).toBeNull();
  });

  it("addresses a thread everyone else has left to nobody", () => {
    // The case that changed. It used to write the departed peer's id.
    expect(addressedTo([])).toBeNull();
  });

  it("agrees with the notification fan-out on a legacy thread", () => {
    // No participant rows: the client's peer is still the recipient, so the row
    // keeps its addressing rather than silently becoming unaddressed.
    const targets = notifyTargets({
      activeOthers: [],
      otherParticipantsEver: 0,
      clientReceiver: 22,
    });
    expect(addressedTo(targets)).toBe(22);
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

describe("every notification fan-out uses the rule", () => {
  /**
   * Guards the mistake that shipped: the fan-out fix was applied to
   * /api/messages/thread/[threadId], which turned out to have no caller at all,
   * while the route the client actually uses -- /api/chat/send -- kept the bug
   * for another deploy. The dead route has since been deleted.
   *
   * The invariant: a route that decides who to notify from thread membership has
   * to decide it with notifyTargets, not by hand. Hand-rolling is how the
   * client-supplied-recipient fallback got reached for a member who had left.
   */
  function routeFilesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...routeFilesUnder(full));
      else if (entry === "route.ts") out.push(full);
    }
    return out;
  }

  const routes = routeFilesUnder(path.join(process.cwd(), "app/api"));

  it("scans a plausible number of routes", () => {
    expect(routes.length).toBeGreaterThan(20);
  });

  it("has no route fanning out notifications by hand", () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const src = readFileSync(file, "utf8");
      const readsMembership = src.includes("getActiveParticipants");
      const notifies = src.includes("createNotification");
      if (readsMembership && notifies && !src.includes("notifyTargets")) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
