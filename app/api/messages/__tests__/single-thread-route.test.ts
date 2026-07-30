import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Reported: diNO could not read /messages?thread=2269.
 *
 * The client used to synthesise the row for a deep-linked thread from the members
 * endpoint, which cannot report membership, so it hardcoded `left: false`. For a
 * thread the user had left that rendered a ChatWindow instead of "You left this
 * chat — Rejoin to read it", while the history endpoint clamped their messages to
 * `timestamp <= left_at`: a truncated conversation, no explanation, no way back.
 *
 * `GET /api/messages?thread=N` exists so the flags come from the same place the
 * inbox gets them. This is the test that the left case actually reports itself as
 * left — the one thing that could not be checked from diNO's own session, since
 * his rows have since been repaired and he is no longer in that state.
 */

const session: { user: { id: string; name: string } | null } = {
  user: { id: "22", name: "diNO" },
};

let member: { userId: number; joinedAt: number; leftAt: number | null; lastReadAt: number; title: string | null; archivedAt: number | null } | null = null;
let leftThreads: Array<{
  thread: number; lastTimestamp: number | null; firstSubject: string | null;
  overrideTitle: string | null; otherNicks: string | null;
}> = [];
let inboxRows: unknown[] = [];

vi.mock("@/lib/auth", () => ({ auth: () => Promise.resolve(session) }));
vi.mock("@/lib/chatThreadDb", () => ({
  getMember: () => Promise.resolve(member),
  getLeftThreads: () => Promise.resolve(leftThreads),
  addParticipant: () => Promise.resolve(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: () => Promise.resolve(inboxRows),
    $transaction: () => Promise.resolve(0),
  },
}));
vi.mock("@/lib/live", () => ({ broadcast: () => {} }));
vi.mock("@/lib/notifications", () => ({ createNotification: () => Promise.resolve() }));

const { GET } = await import("../route");

// The route reads `request.nextUrl`, which is NextRequest's parsed URL rather
// than the plain `Request.url` string.
function request(url: string) {
  return { nextUrl: new URL(url) } as unknown as Parameters<typeof GET>[0];
}

async function get(url: string) {
  const res = await GET(request(url));
  return { status: res.status, body: await res.json() };
}

const US = "\u001f";

beforeEach(() => {
  session.user = { id: "22", name: "diNO" };
  member = null;
  leftThreads = [];
  inboxRows = [];
});

describe("GET /api/messages?thread=N", () => {
  it("reports a thread the caller has left as left", () => {
    member = { userId: 22, joinedAt: 1774961631, leftAt: 1780609266, lastReadAt: 0, title: null, archivedAt: null };
    leftThreads = [{
      thread: 2269, lastTimestamp: 1785030736, firstSubject: "hey",
      overrideTitle: null, otherNicks: `2293${US}hARRiSONbERGEROn`,
    }];
    return get("https://x/api/messages?thread=2269").then(({ status, body }) => {
      expect(status).toBe(200);
      expect(body).toHaveLength(1);
      // The whole point: this flag is what makes the page offer Rejoin instead
      // of a chat window it cannot fill.
      expect(body[0].left).toBe(true);
      expect(body[0].thread).toBe(2269);
      // A left member receives nothing until they rejoin, so no unread count.
      expect(body[0].unread).toBe(0);
    });
  });

  it("reports a thread the caller is still in as not left, with its real flags", async () => {
    member = { userId: 22, joinedAt: 1774961631, leftAt: null, lastReadAt: 0, title: null, archivedAt: 1780609266 };
    inboxRows = [{
      thread: 2269, id: 3423, from_id: 2293, postername: "hARRiSONbERGEROn",
      message: "hello", timestamp: 1785030736, total_count: 1,
      override_title: null, first_subject: "hey",
      other_nicks: `2293${US}hARRiSONbERGEROn`, unread: 2,
      archived_at: 1780609266,
    }];
    const { body } = await get("https://x/api/messages?thread=2269");
    expect(body).toHaveLength(1);
    expect(body[0].left).toBe(false);
    // Archived state is reported rather than assumed too -- the old synthesised
    // row hardcoded this to false as well.
    expect(body[0].archived).toBe(true);
    expect(body[0].unread).toBe(2);
  });

  it("returns no row for a thread the caller was never in", async () => {
    member = null;
    const { status, body } = await get("https://x/api/messages?thread=999");
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("rejects a non-numeric thread id", async () => {
    const { status } = await get("https://x/api/messages?thread=notanumber");
    expect(status).toBe(400);
  });

  it("requires a session", async () => {
    session.user = null;
    const { status } = await get("https://x/api/messages?thread=2269");
    expect(status).toBe(401);
  });
});
