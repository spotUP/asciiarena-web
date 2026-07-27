import { describe, it, expect, beforeEach, vi } from "vitest";

// Regression: re-indexing a hand-mapped colly laid the auto-detected layer on
// top of its manual rows. `indexColly` deleted only `manual = 0` and then
// inserted the detected rows regardless, and nothing downstream filters on
// `manual` -- so search, stats and the gallery each showed every logo in that
// colly twice. Public tagging makes manual rows the norm, so this would have
// grown with adoption.

interface CreateCall { data: unknown[] }

let manualRowCount = 0;
const deleteCalls: unknown[] = [];
const createCalls: CreateCall[] = [];
const rawCalls: string[] = [];

const prismaFake = {
  colly_logos: {
    count: () => Promise.resolve(manualRowCount),
    deleteMany: (args: unknown) => { deleteCalls.push(args); return Promise.resolve(); },
    createMany: (args: CreateCall) => { createCalls.push(args); return Promise.resolve(); },
  },
  $executeRaw: (strings: TemplateStringsArray) => {
    rawCalls.push(strings.join("?").replace(/\s+/g, " ").trim());
    return Promise.resolve();
  },
  $transaction: (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]),
  artists: { findMany: () => Promise.resolve([]) },
  crews: { findMany: () => Promise.resolve([]) },
  users: { findMany: () => Promise.resolve([]) },
};

vi.mock("@/lib/db", () => ({ prisma: prismaFake }));
// Two captioned logos worth of art, so detection has something to find.
vi.mock("@/lib/collyText", () => ({
  readCollyText: () => "dipswitch\n\n\n\n\nspot\n",
  collyFilePath: () => "/collections/x/x.txt",
}));
vi.mock("@/lib/collyLogoRows", () => ({
  buildLogoRows: (collyId: number) => ([
    { colly_id: collyId, position: 0, start_line: 0, end_line: null, label: "dipswitch", label_norm: "dipswitch", artist_id: null, crew_id: null, user_id: null },
    { colly_id: collyId, position: 1, start_line: 5, end_line: null, label: "spot", label_norm: "spot", artist_id: null, crew_id: null, user_id: null },
  ]),
}));

const { indexColly, rebuildAutoLogoLayer } = await import("../collyLogoIndex");

const dicts = { artists: [], crews: [], users: [] };

describe("re-indexing a colly", () => {
  beforeEach(() => {
    deleteCalls.length = 0;
    createCalls.length = 0;
    rawCalls.length = 0;
    manualRowCount = 0;
  });

  it("does not add an auto layer on top of a hand-mapped colly", () => {
    manualRowCount = 4;
    return indexColly(1, "x.txt", "ASCII", dicts).then((result) => {
      expect(createCalls).toHaveLength(0);
      expect(result.logos).toBe(0);
    });
  });

  it("still clears a stale auto layer from before the colly was mapped", async () => {
    manualRowCount = 4;
    await indexColly(1, "x.txt", "ASCII", dicts);
    // The delete is scoped to manual = 0, so the hand-made map itself survives.
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0]).toEqual({ where: { colly_id: 1, manual: 0 } });
  });

  it("still builds the auto layer for a colly nobody has mapped", async () => {
    manualRowCount = 0;
    const result = await indexColly(1, "x.txt", "ASCII", dicts);
    expect(createCalls).toHaveLength(1);
    expect(result.logos).toBe(2);
  });

  it("keeps syncing content_text on the admin reindex path", async () => {
    await indexColly(1, "x.txt", "ASCII", dicts);
    expect(rawCalls.some((s) => /UPDATE collys SET content_text/i.test(s))).toBe(true);
  });

  it("never touches content_text on the public save path", async () => {
    await rebuildAutoLogoLayer(1, "x.txt", "ASCII", dicts);
    expect(rawCalls).toHaveLength(0);
  });

  it("rebuilds the auto layer after a save cleared the map, since no manual rows remain", async () => {
    manualRowCount = 0;
    const result = await rebuildAutoLogoLayer(1, "x.txt", "ASCII", dicts);
    expect(createCalls).toHaveLength(1);
    expect(result.logos).toBe(2);
  });
});
