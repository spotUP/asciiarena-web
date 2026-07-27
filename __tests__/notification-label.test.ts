import { describe, it, expect } from "vitest";
import { describeNotification } from "@/lib/notificationLabel";

describe("describeNotification — message notifications name the message", () => {
  it("shows the subject after a colon", () => {
    const l = describeNotification({ kind: "notif-message", actorNick: "dipswitch", target: "re: logo swap" });
    expect(l.actor).toBe("dipswitch");
    expect(l.verb).toBe("sent you a message:");
    expect(l.target).toBe("re: logo swap");
  });

  it("does not leave a dangling colon on older rows that carry no subject", () => {
    const l = describeNotification({ kind: "notif-message", actorNick: "dipswitch", target: null });
    expect(l.verb).toBe("sent you a message");
    expect(l.target).toBeNull();
  });

  it("treats a blank subject as no subject", () => {
    const l = describeNotification({ kind: "notif-message", actorNick: "spot", target: "   " });
    expect(l.verb).toBe("sent you a message");
    expect(l.target).toBeNull();
  });
});

describe("describeNotification — other kinds read as phrases", () => {
  it("does not add a colon to a verb that already takes an object", () => {
    const l = describeNotification({ kind: "notif-comment", actorNick: "spot", target: "chr-checkmate.ans" });
    expect(l.verb).toBe("commented on");
    expect(l.target).toBe("chr-checkmate.ans");
  });

  it("falls back to the raw kind for an unknown type", () => {
    expect(describeNotification({ kind: "notif-future", actorNick: "spot", target: null }).verb).toBe("notif-future");
  });
});

describe("describeNotification — actor", () => {
  it("names an anonymous actor rather than rendering nothing", () => {
    expect(describeNotification({ kind: "notif-fav", actorNick: null, target: null }).actor).toBe("someone");
    expect(describeNotification({ kind: "notif-fav", actorNick: "  ", target: null }).actor).toBe("someone");
  });
});
