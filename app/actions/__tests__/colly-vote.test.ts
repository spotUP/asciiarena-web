import { describe, it, expect, beforeEach, vi } from "vitest";

// Regression: users could vote twice on the same colly and both ratings
// counted. The release page averages every `comments` row with rating > 0
// (app/release/[filename]/page.tsx), so a second rated comment inflated both
// the average and the vote count. Posting a new rating must retire the user's
// previous one, exactly as the legacy PHP did (cmds.php saveComment).

interface RawCall { sql: string; values: unknown[] }

const rawCalls: RawCall[] = [];
const txCalls: unknown[][] = [];

function record(strings: TemplateStringsArray, values: unknown[]): RawCall {
  const call = { sql: strings.join("?").replace(/\s+/g, " ").trim(), values };
  rawCalls.push(call);
  return call;
}

const prismaFake = {
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => record(strings, values),
  $transaction: (ops: unknown[]) => { txCalls.push(ops); return Promise.resolve([]); },
  collys: { findUnique: () => Promise.resolve({ filename: "wpx-boys.txt", uploader_id: 7 }) },
};

vi.mock("@/lib/db", () => ({ prisma: prismaFake }));
vi.mock("@/lib/session", () => ({
  getSession: () => Promise.resolve({ user: { id: "42", name: "dipswitch", rank: "User" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/live", () => ({ broadcast: () => {} }));
vi.mock("@/lib/activity", () => ({ broadcastActivityIfAllowed: () => Promise.resolve() }));
vi.mock("@/lib/notifications", () => ({ createNotification: () => Promise.resolve() }));
vi.mock("@/lib/generated/prisma/client", () => ({ Prisma: { sql: () => ({}) } }));

const { postComment } = await import("../collys");

const clearingUpdates = () =>
  rawCalls.filter(c => /UPDATE comments SET rating = NULL/i.test(c.sql));
const inserts = () => rawCalls.filter(c => /INSERT INTO comments/i.test(c.sql));

describe("postComment vote handling", () => {
  beforeEach(() => {
    rawCalls.length = 0;
    txCalls.length = 0;
  });

  it("retires the user's previous rating on the same colly when a new rating is cast", async () => {
    await postComment(4122, "second vote", "9");

    const clears = clearingUpdates();
    expect(clears).toHaveLength(1);
    // Scoped to this user on this colly — nobody else's vote is touched.
    expect(clears[0].values).toEqual([4122, 42]);
    expect(clears[0].sql).toMatch(/colly_id = \?/i);
    expect(clears[0].sql).toMatch(/user_id = \?/i);
  });

  it("clears the old rating and inserts the new one in a single transaction", async () => {
    await postComment(4122, "second vote", "9");

    expect(txCalls).toHaveLength(1);
    expect(txCalls[0]).toHaveLength(2);
    // Order matters: clear first, then insert, or the new vote gets wiped too.
    expect(txCalls[0][0]).toBe(clearingUpdates()[0]);
    expect(txCalls[0][1]).toBe(inserts()[0]);
  });

  it("leaves earlier ratings alone for a comment posted without a rating", async () => {
    await postComment(4122, "just a comment", null);

    expect(clearingUpdates()).toHaveLength(0);
    expect(inserts()).toHaveLength(1);
    expect(txCalls).toHaveLength(0);
  });

  it("treats a non-numeric rating as no rating at all", async () => {
    await postComment(4122, "garbage rating", "not-a-number");

    expect(clearingUpdates()).toHaveLength(0);
    expect(inserts()[0].values).toContain(null);
  });
});
