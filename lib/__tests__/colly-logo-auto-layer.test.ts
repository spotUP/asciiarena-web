import { describe, it, expect, beforeEach, vi } from "vitest";

// `indexColly` refreshes two things: the auto-detected logo rows, and
// `collys.content_text` -- the colly's whole plaintext, up to 5 MB.
//
// The public save route needs the first and must not pay for the second. It
// calls the rebuild whenever a save leaves no catalog rows, on an endpoint open
// to every logged-in member, and this box has already lost MySQL once to a full
// disk. A multi-megabyte row rewrite (plus its binlog copy) per save is a far
// bigger write than the snapshot the rate limit was built to bound -- and a
// pointless one, because a colly's file never changes after upload.

interface RawCall { sql: string }

const rawCalls: RawCall[] = [];
const txOps: unknown[][] = [];

const prismaFake = {
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
    const call = { sql: strings.join("?").replace(/\s+/g, " ").trim(), values };
    rawCalls.push(call);
    return call;
  },
  $transaction: (ops: unknown[]) => { txOps.push(ops); return Promise.resolve([]); },
  colly_logos: {
    // No manual rows: these cases all cover a colly nobody has hand-mapped, so
    // the auto layer is the colly's only map and does get rebuilt. The
    // hand-mapped case is covered in colly-logo-reindex.test.ts.
    count: () => Promise.resolve(0),
    deleteMany: (args: unknown) => ({ op: "deleteMany", args }),
    createMany: (args: unknown) => ({ op: "createMany", args }),
  },
  artists: { findMany: () => Promise.resolve([]) },
  crews: { findMany: () => Promise.resolve([]) },
  users: { findMany: () => Promise.resolve([]) },
};

const COLLY_TEXT = [
  "uP rOUGH",
  "",
  "_/\\__ ___ AAA ___ __/\\_",
  "|  | /   \\ |  | /   \\| |",
  "|__| \\___/ |__| \\___/|_|",
  "|  | /   \\ |  | /   \\| |",
  "|__| \\___/ |__| \\___/|_|",
  "",
].join("\n");

vi.mock("@/lib/db", () => ({ prisma: prismaFake }));
vi.mock("@/lib/collyText", () => ({
  readCollyText: () => COLLY_TEXT,
  collyFilePath: () => "/collections/wpx-boys/wpx-boys.txt",
}));

const { indexColly, rebuildAutoLogoLayer } = await import("@/lib/collyLogoIndex");

const DICTS = { artists: [], crews: [], users: [] };
const contentTextWrites = () => rawCalls.filter((c) => /content_text/i.test(c.sql));
const opNames = (i: number) => (txOps[i] as { op: string }[]).map((o) => o.op);

describe("rebuildAutoLogoLayer", () => {
  beforeEach(() => {
    rawCalls.length = 0;
    txOps.length = 0;
  });

  it("replaces the auto-detected logo rows", async () => {
    const result = await rebuildAutoLogoLayer(4122, "wpx-boys.txt", "ASCII", DICTS);
    expect(result.logos).toBeGreaterThan(0);
    expect(opNames(0)).toEqual(["deleteMany", "createMany"]);
  });

  it("does not rewrite the colly's content_text", async () => {
    await rebuildAutoLogoLayer(4122, "wpx-boys.txt", "ASCII", DICTS);
    expect(contentTextWrites()).toHaveLength(0);
  });

  it("detects exactly what indexColly detects", async () => {
    const viaIndex = await indexColly(4122, "wpx-boys.txt", "ASCII", DICTS);
    const viaRebuild = await rebuildAutoLogoLayer(4122, "wpx-boys.txt", "ASCII", DICTS);
    expect(viaRebuild).toEqual(viaIndex);
  });
});

describe("indexColly", () => {
  beforeEach(() => {
    rawCalls.length = 0;
    txOps.length = 0;
  });

  // The admin reindex tool and the upload path both rely on this pass to
  // backfill the full-content search column.
  it("still refreshes content_text alongside the logo rows", async () => {
    await indexColly(4122, "wpx-boys.txt", "ASCII", DICTS);
    expect(contentTextWrites()).toHaveLength(1);
    expect(opNames(0)).toContain("deleteMany");
  });
});
