import { describe, it, expect, beforeEach, vi } from "vitest";

// Tagging is open to any logged-in user, and every save must land as BOTH a
// history snapshot and a catalog rebuild, atomically. A save that writes one
// without the other leaves the colly's search index disagreeing with its
// recorded history.

interface RawCall { sql: string; values: unknown[] }

const rawCalls: RawCall[] = [];
const txCalls: unknown[][] = [];
let sessionRank: string | null = "Member";
let sessionId: string | null = "42";
let collyRow: { id: number; filename: string } | null = { id: 4122, filename: "wpx-boys.txt" };

// GET-specific fixtures: mutated per-test to exercise the three `current`
// derivation branches (newest snapshot / fallback to manual colly_logos /
// neither -> null).
let editRows: { id: number; colly_id: number; user_id: number; timestamp: number; logo_count: number; map: string }[] = [
  { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7, map: '[{"line":12,"caption":"dipswitch"}]' },
];
let manualLogoRows: { start_line: number; end_line: number | null; label: string }[] = [];

const prismaFake = {
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
    const call = { sql: strings.join("?").replace(/\s+/g, " ").trim(), values };
    rawCalls.push(call);
    return call;
  },
  $queryRaw: () => Promise.resolve([]),
  $transaction: (ops: unknown[]) => { txCalls.push(ops); return Promise.resolve([]); },
  collys: { findUnique: () => Promise.resolve(collyRow) },
  colly_logos: {
    deleteMany: (args: unknown) => ({ op: "deleteMany", args }),
    createMany: (args: unknown) => ({ op: "createMany", args }),
    findMany: () => Promise.resolve(manualLogoRows),
  },
  colly_logo_edits: {
    create: (args: unknown) => ({ op: "createEdit", args }),
    findUnique: () => Promise.resolve({
      id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 1,
      map: '[{"line":12,"caption":"dipswitch"}]',
    }),
    findMany: () => Promise.resolve(editRows),
  },
  users: {
    findMany: () => Promise.resolve([{ id: 42, nick: "dipswitch" }]),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaFake }));
vi.mock("@/lib/auth", () => ({
  auth: () => Promise.resolve(sessionId ? { user: { id: sessionId, name: "dipswitch", rank: sessionRank } } : null),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/live", () => ({ broadcast: () => {} }));
vi.mock("@/lib/collyLogoIndex", () => ({
  loadEntityDicts: () => Promise.resolve({ artists: [], crews: [], users: [] }),
}));

const { POST, GET } = await import("../route");

const params = Promise.resolve({ id: "4122" });
const req = (body: unknown) => new Request("http://localhost/api/collys/4122/logos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("POST /api/collys/[id]/logos", () => {
  beforeEach(() => {
    rawCalls.length = 0;
    txCalls.length = 0;
    sessionRank = "Member";
    sessionId = "42";
    collyRow = { id: 4122, filename: "wpx-boys.txt" };
  });

  it("lets an ordinary logged-in member save a map", async () => {
    const res = await POST(req({ logos: [{ line: 12, end: 20, caption: "dipswitch" }] }), { params });
    expect(res.status).toBe(200);
  });

  it("rejects a logged-out request", async () => {
    sessionId = null;
    const res = await POST(req({ logos: [] }), { params });
    expect(res.status).toBe(401);
  });

  it("404s an unknown colly before writing anything", async () => {
    collyRow = null;
    const res = await POST(req({ logos: [{ line: 1, caption: "x" }] }), { params });
    expect(res.status).toBe(404);
    expect(txCalls).toHaveLength(0);
  });

  it("rejects an invalid map", async () => {
    const res = await POST(req({ logos: [{ line: 0, caption: "x" }] }), { params });
    expect(res.status).toBe(400);
    expect(txCalls).toHaveLength(0);
  });

  it("writes the snapshot and the catalog rebuild in ONE transaction", async () => {
    await POST(req({ logos: [{ line: 12, caption: "dipswitch" }] }), { params });
    expect(txCalls).toHaveLength(1);
    const ops = txCalls[0] as { op: string }[];
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "deleteMany", "createMany"]);
  });

  it("accepts an empty map, which clears the colly's tags", async () => {
    const res = await POST(req({ logos: [] }), { params });
    expect(res.status).toBe(200);
    const ops = txCalls[0] as { op: string }[];
    // Snapshot + delete still run; there is nothing to create.
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "deleteMany"]);
  });
});

describe("GET /api/collys/[id]/logos", () => {
  beforeEach(() => {
    editRows = [
      { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7, map: '[{"line":12,"caption":"dipswitch"}]' },
    ];
    manualLogoRows = [];
  });

  it("returns the edit history newest first", async () => {
    const res = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.history[0]).toMatchObject({ id: 9, logoCount: 7 });
  });

  // The bug this test guards against: the panel used to seed from the
  // colly FILE's embedded trailer, which public tagging never writes to.
  // A save-then-reopen must see the artist's own tags, not stale/auto data.
  // The newest `colly_logo_edits` snapshot IS the current map.
  it("returns the newest snapshot's map as current", async () => {
    editRows = [
      { id: 11, colly_id: 4122, user_id: 42, timestamp: 1753700000, logo_count: 1, map: '[{"line":5,"end":8,"caption":"newest snapshot"}]' },
      { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 1, map: '[{"line":12,"caption":"older snapshot"}]' },
    ];
    const res = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    const body = await res.json();
    expect(body.current).toEqual([{ line: 5, end: 8, caption: "newest snapshot" }]);
  });

  it("falls back to manual colly_logos rows (1-based lines) when there is no snapshot", async () => {
    editRows = [];
    manualLogoRows = [
      { start_line: 4, end_line: 7, label: "old admin tag" },
      { start_line: 20, end_line: null, label: "another old tag" },
    ];
    const res = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    const body = await res.json();
    expect(body.current).toEqual([
      { line: 5, end: 8, caption: "old admin tag" },
      { line: 21, caption: "another old tag" },
    ]);
    expect(body.history).toEqual([]);
  });

  it("returns current: null when there is neither a snapshot nor manual rows", async () => {
    editRows = [];
    manualLogoRows = [];
    const res = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    const body = await res.json();
    expect(body.current).toBeNull();
  });
});

const { POST: REVERT } = await import("../revert/route");

describe("POST /api/collys/[id]/logos/revert", () => {
  beforeEach(() => {
    txCalls.length = 0;
    sessionRank = "Admin";
    sessionId = "1";
  });

  const revertReq = () => new Request("http://localhost/api/collys/4122/logos/revert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editId: 9 }),
  });

  it("refuses a non-admin", async () => {
    sessionRank = "Member";
    const res = await REVERT(revertReq(), { params });
    expect(res.status).toBe(403);
    expect(txCalls).toHaveLength(0);
  });

  it("replays the old map as a NEW edit rather than deleting history", async () => {
    const res = await REVERT(revertReq(), { params });
    expect(res.status).toBe(200);
    const ops = txCalls[0] as { op: string }[];
    // A new snapshot is appended; nothing in the history is removed.
    expect(ops[0].op).toBe("createEdit");
    expect(ops.some((o) => o.op === "createMany")).toBe(true);
  });
});
