import { describe, it, expect, beforeEach, vi } from "vitest";

// Tagging is open to any logged-in user, and every save must land as BOTH a
// history snapshot and a catalog rebuild, atomically. A save that writes one
// without the other leaves the colly's search index disagreeing with its
// recorded history.

interface RawCall { sql: string; values: unknown[] }

const rawCalls: RawCall[] = [];
const txCalls: unknown[][] = [];
const indexCollyCalls: unknown[][] = [];
let sessionRank: string | null = "Member";
let sessionId: string | null = "42";
let collyRow: { id: number; filename: string; type: string | null } | null =
  { id: 4122, filename: "wpx-boys.txt", type: "ASCII" };

// GET-specific fixtures: mutated per-test to exercise the three `current`
// derivation branches (newest snapshot / fallback to manual colly_logos /
// neither -> null). `editRows` doubles as the snapshot count the baseline
// check reads, so a POST test can put the colly in the "never snapshotted"
// state by emptying it.
let editRows: { id: number; colly_id: number; user_id: number; timestamp: number; logo_count: number; map: string }[] = [
  { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7, map: '[{"line":12,"caption":"dipswitch"}]' },
];
let manualLogoRows: { start_line: number; end_line: number | null; label: string }[] = [];
// The requesting user's most recent save on this colly, for the rate limit.
let lastOwnEdit: { timestamp: number } | null = null;
// The row a revert resolves `editId` to.
let revertEditRow: { id: number; colly_id: number; user_id: number; timestamp: number; logo_count: number; map: string } | null = {
  id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 1,
  map: '[{"line":12,"caption":"dipswitch"}]',
};

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
    count: () => Promise.resolve(editRows.length),
    findFirst: () => Promise.resolve(lastOwnEdit),
    findUnique: () => Promise.resolve(revertEditRow),
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
  indexColly: (...args: unknown[]) => { indexCollyCalls.push(args); return Promise.resolve({ logos: 3, resolved: 1 }); },
}));

const { POST, GET } = await import("../route");

type EditOp = { op: string; args: { data: { map: string; user_id: number; logo_count: number } } };

const params = Promise.resolve({ id: "4122" });
const req = (body: unknown) => new Request("http://localhost/api/collys/4122/logos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const resetFixtures = () => {
  rawCalls.length = 0;
  txCalls.length = 0;
  indexCollyCalls.length = 0;
  sessionRank = "Member";
  sessionId = "42";
  collyRow = { id: 4122, filename: "wpx-boys.txt", type: "ASCII" };
  editRows = [
    { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7, map: '[{"line":12,"caption":"dipswitch"}]' },
  ];
  manualLogoRows = [];
  lastOwnEdit = null;
  revertEditRow = {
    id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 1,
    map: '[{"line":12,"caption":"dipswitch"}]',
  };
};

describe("POST /api/collys/[id]/logos", () => {
  beforeEach(resetFixtures);

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

// A colly tagged before this feature has its hand-curated map ONLY as
// `colly_logos` rows -- not in any snapshot, and not in the file trailer
// (admin-editor maps are database-only). The first public save deletes those
// rows, so without a baseline the prior state would exist nowhere and
// [restore] would have nothing to restore to.
describe("POST /api/collys/[id]/logos -- baseline of a pre-feature map", () => {
  beforeEach(resetFixtures);

  const preFeature = () => {
    editRows = []; // never snapshotted
    manualLogoRows = [
      { start_line: 4, end_line: 7, label: "old admin tag" },
      { start_line: 20, end_line: null, label: "another old tag" },
    ];
  };

  it("snapshots the existing admin map before overwriting it", async () => {
    preFeature();
    const res = await POST(req({ logos: [{ line: 1, caption: "brand new" }] }), { params });
    expect(res.status).toBe(200);
    const ops = txCalls[0] as EditOp[];
    // Baseline first, then the member's own save, then the rebuild -- all in
    // the one transaction.
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "createEdit", "deleteMany", "createMany"]);
    expect(JSON.parse(ops[0].args.data.map)).toEqual([
      { line: 5, end: 8, caption: "old admin tag" },
      { line: 21, caption: "another old tag" },
    ]);
    expect(ops[0].args.data.logo_count).toBe(2);
    expect(JSON.parse(ops[1].args.data.map)).toEqual([{ line: 1, caption: "brand new" }]);
  });

  it("does not attribute the baseline to the member who triggered it", async () => {
    preFeature();
    await POST(req({ logos: [] }), { params });
    const ops = txCalls[0] as EditOp[];
    expect(ops[0].args.data.user_id).toBe(0);
    expect(ops[1].args.data.user_id).toBe(42);
  });

  it("preserves the map a member would have seen, so [restore] restores that exact map", async () => {
    preFeature();
    const getRes = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    const seen = (await getRes.json()).current;
    await POST(req({ logos: [] }), { params });
    const ops = txCalls[0] as EditOp[];
    expect(JSON.parse(ops[0].args.data.map)).toEqual(seen);
  });

  it("adds no baseline when the colly already has snapshots", async () => {
    manualLogoRows = [{ start_line: 4, end_line: 7, label: "already superseded" }];
    await POST(req({ logos: [{ line: 1, caption: "dipswitch" }] }), { params });
    const ops = txCalls[0] as { op: string }[];
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "deleteMany", "createMany"]);
  });

  it("adds no baseline when there was no map to lose", async () => {
    editRows = [];
    manualLogoRows = [];
    await POST(req({ logos: [{ line: 1, caption: "dipswitch" }] }), { params });
    const ops = txCalls[0] as { op: string }[];
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "deleteMany", "createMany"]);
  });
});

// The design promises an empty save "returns the colly to automatic
// detection". Deleting every row (auto layer included) and stopping there
// dropped the colly out of logo search until an admin reran the reindex tool.
describe("POST /api/collys/[id]/logos -- empty save restores auto-detection", () => {
  beforeEach(resetFixtures);

  it("rebuilds the auto-detected layer when the map is saved empty", async () => {
    const res = await POST(req({ logos: [] }), { params });
    expect(res.status).toBe(200);
    expect(indexCollyCalls).toHaveLength(1);
    expect(indexCollyCalls[0].slice(0, 3)).toEqual([4122, "wpx-boys.txt", "ASCII"]);
  });

  it("leaves the auto layer alone when the member saved actual entries", async () => {
    await POST(req({ logos: [{ line: 12, caption: "dipswitch" }] }), { params });
    expect(indexCollyCalls).toHaveLength(0);
  });
});

// An open endpoint accepting 500 entries of MEDIUMTEXT with no throttle is a
// disk-fill vector, and this box has already taken MySQL down once by filling
// its disk.
describe("POST /api/collys/[id]/logos -- rate limit", () => {
  beforeEach(resetFixtures);

  it("refuses a second save from the same user seconds after the first", async () => {
    lastOwnEdit = { timestamp: Math.floor(Date.now() / 1000) - 2 };
    const res = await POST(req({ logos: [{ line: 1, caption: "x" }] }), { params });
    expect(res.status).toBe(429);
    expect(txCalls).toHaveLength(0);
    const body = await res.json();
    expect(body.error).toMatch(/second/i);
  });

  it("allows the save once the window has elapsed", async () => {
    lastOwnEdit = { timestamp: Math.floor(Date.now() / 1000) - 30 };
    const res = await POST(req({ logos: [{ line: 1, caption: "x" }] }), { params });
    expect(res.status).toBe(200);
    expect(txCalls).toHaveLength(1);
  });
});

describe("GET /api/collys/[id]/logos", () => {
  beforeEach(resetFixtures);

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
    resetFixtures();
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

  // parseLogoMap returns [] for anything unreadable, which is right for
  // display and catastrophic on a write path: restoring a truncated row would
  // write an empty map over the colly instead of failing.
  it("refuses to restore a snapshot whose map cannot be parsed", async () => {
    revertEditRow = { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 3, map: '[{"line":12,"capt' };
    const res = await REVERT(revertReq(), { params });
    expect(res.status).toBe(422);
    expect(txCalls).toHaveLength(0);
  });

  it("refuses to restore a snapshot whose map fails the schema", async () => {
    revertEditRow = { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 2, map: '[{"line":-4,"caption":"future format"}]' };
    const res = await REVERT(revertReq(), { params });
    expect(res.status).toBe(422);
    expect(txCalls).toHaveLength(0);
  });

  it("still restores a snapshot that was genuinely empty", async () => {
    revertEditRow = { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 0, map: "[]" };
    const res = await REVERT(revertReq(), { params });
    expect(res.status).toBe(200);
    expect(txCalls).toHaveLength(1);
  });
});
