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
  },
  colly_logo_edits: {
    create: (args: unknown) => ({ op: "createEdit", args }),
    findMany: () => Promise.resolve([
      { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7 },
    ]),
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
  it("returns the edit history newest first", async () => {
    const res = await GET(new Request("http://localhost/api/collys/4122/logos"), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toMatchObject({ id: 9, logoCount: 7 });
  });
});
