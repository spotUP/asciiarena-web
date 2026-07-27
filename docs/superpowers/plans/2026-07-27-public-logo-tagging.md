# Public Logo Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any logged-in user map the logos inside any published colly, with every save snapshotted so admins can revert.

**Architecture:** A new append-only `colly_logo_edits` table holds one JSON snapshot per save; the newest row for a colly *is* its current map, and `colly_logos` stays a derived index rebuilt from it through the existing `buildLogoRowsFromMap`. The editor component already exists and is admin-agnostic — the work is a public write endpoint plus mounting that editor in place of the release viewer.

**Tech Stack:** Next.js App Router (server components + route handlers), Prisma 7 against MariaDB, Zod for request validation, Vitest for tests.

Spec: `docs/superpowers/specs/2026-07-27-public-logo-tagging-design.md`

## Global Constraints

- TypeScript strict, no `any`. Run `npx tsc --noEmit` after every code change.
- Tests live in a `__tests__` directory and match `**/__tests__/**/*.test.ts`. Run with `npx vitest run <path>`.
- Every bug fix and feature ships with a test that fails before the change and passes after. Verify the failure by temporarily reverting.
- No emojis anywhere — UI strings, comments, commit messages. ASCII tokens only.
- Full English words in UI labels. `Tag Logos`, not `Tag`.
- Every UI dimension is a multiple of the 8x16 character cell. No round corners.
- Never `git add -A` or `git add .` — add files by name.
- Database migrations are hand-written SQL in `prisma/`, applied on the host. There is no `prisma/migrations` directory and `prisma migrate` is not used.
- API responses use `apiOk(data)` / `apiError(msg, status)` from `@/lib/utils`. `apiError` returns `{ error: msg }`.
- Admin check pattern, copied verbatim: `(session?.user as { rank?: string } | undefined)?.rank !== "Admin"`.

## File Structure

**Create:**
- `lib/logoMapPayload.ts` — the logo-map array schema, shared by the admin PATCH and the new public route so they cannot drift.
- `lib/collyLogoSnapshot.ts` — pure serialize/parse for the snapshot `map` column plus `logoCountOf`.
- `prisma/colly_logo_edits_migration.sql` — the new table, run on the host.
- `lib/collyLogoWrite.ts` — `writeLogoEdit`: the atomic snapshot-plus-catalog-rebuild, shared by the save and revert routes.
- `app/api/collys/[id]/logos/route.ts` — public POST (save) and GET (history).
- `app/api/collys/[id]/logos/revert/route.ts` — admin POST (replay an edit).
- `components/release/LogoTagPanel.tsx` — the tagging mode: report fetch, map state, save, history.
- Tests: `lib/__tests__/logo-map-payload.test.ts`, `lib/__tests__/colly-logo-snapshot.test.ts`, `app/api/collys/[id]/logos/__tests__/logos-route.test.ts`, `lib/__tests__/release-tag-mode.test.ts`.

**Modify:**
- `lib/adminCollyPatch.ts` — consume the shared payload schema.
- `prisma/schema.prisma` — add the `colly_logo_edits` model.
- `app/api/collys/preview/route.ts:113` — drop the admin gate on GET to any session.
- `app/release/[filename]/ReleaseClient.tsx` — a `tagging` mode flag, the Tag Logos button, and swapping the viewer for the panel.

---

### Task 1: Shared logo-map payload schema

The admin PATCH already validates a logo map inline. The public route must accept exactly the same shape. Extract it once so a future change cannot make the two disagree.

**Files:**
- Create: `lib/logoMapPayload.ts`
- Modify: `lib/adminCollyPatch.ts:33-37`
- Test: `lib/__tests__/logo-map-payload.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `logoMapSchema: z.ZodType<LogoMapEntry[]>` and `interface LogoMapEntry { line: number; end?: number; caption: string }`. Tasks 2, 3 and 4 import both.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/logo-map-payload.test.ts
import { describe, it, expect } from "vitest";
import { logoMapSchema } from "../logoMapPayload";

// One schema guards both the admin PATCH and the public tagging route. A map
// that one accepts and the other rejects is the bug this prevents.

describe("logoMapSchema", () => {
  it("accepts a hand-mapped colly", () => {
    const parsed = logoMapSchema.safeParse([
      { line: 12, end: 20, caption: "dipswitch" },
      { line: 21, caption: "NEXUS -spot for zeus" },
    ]);
    expect(parsed.success).toBe(true);
  });

  it("accepts an empty map, which clears the colly's tags", () => {
    expect(logoMapSchema.safeParse([]).success).toBe(true);
  });

  it("rejects lines that cannot exist", () => {
    expect(logoMapSchema.safeParse([{ line: 0, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: -3, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: 1.5, caption: "x" }]).success).toBe(false);
    expect(logoMapSchema.safeParse([{ line: "12", caption: "x" }]).success).toBe(false);
  });

  it("rejects an end before its start", () => {
    expect(logoMapSchema.safeParse([{ line: 20, end: 12, caption: "x" }]).success).toBe(false);
  });

  it("accepts an end equal to its start (a one-line logo)", () => {
    expect(logoMapSchema.safeParse([{ line: 20, end: 20, caption: "x" }]).success).toBe(true);
  });

  it("rejects captions longer than the label column", () => {
    expect(logoMapSchema.safeParse([{ line: 1, caption: "x".repeat(201) }]).success).toBe(false);
  });

  it("caps the number of entries so one request cannot flood the catalog", () => {
    const huge = Array.from({ length: 501 }, (_, i) => ({ line: i + 1, caption: "x" }));
    expect(logoMapSchema.safeParse(huge).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/logo-map-payload.test.ts`
Expected: FAIL — `Cannot find module '../logoMapPayload'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/logoMapPayload.ts
import { z } from "zod";

// The logo map as it travels over the wire, shared by the admin colly PATCH
// and the public tagging route. Lines are 1-based as authored; the catalog
// builder converts to 0-based when it writes rows.
//
// `end` is optional: a map entry without one runs to the next entry's start.
// A caption is free text — buildLogoRow decides whether it is searchable.
export const logoMapEntrySchema = z.object({
  line: z.number().int().positive(),
  end: z.number().int().positive().optional(),
  caption: z.string().max(200),
}).refine((e) => e.end === undefined || e.end >= e.line, {
  message: "end must not be before line",
});

// 500 entries is far beyond any real colly (the biggest packs run to ~90) and
// bounds the work a single request can create.
export const logoMapSchema = z.array(logoMapEntrySchema).max(500);

export type LogoMapEntry = z.infer<typeof logoMapEntrySchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/logo-map-payload.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Point the admin schema at it**

In `lib/adminCollyPatch.ts`, add the import and replace the inline `logos` definition:

```ts
import { logoMapSchema } from "@/lib/logoMapPayload";
```

Replace:

```ts
  logos: z.array(z.object({
    line: z.number().int().positive(),
    end: z.number().int().positive().optional(),
    caption: z.string().max(200),
  })).optional(),
```

with:

```ts
  // Same shape the public tagging route accepts — one schema, so the two
  // write paths cannot drift apart.
  logos: logoMapSchema.optional(),
```

- [ ] **Step 6: Verify nothing regressed**

Run: `npx vitest run lib/__tests__/admin-colly-patch.test.ts && npx tsc --noEmit`
Expected: PASS (5 tests), no type errors

- [ ] **Step 7: Commit**

```bash
git add lib/logoMapPayload.ts lib/__tests__/logo-map-payload.test.ts lib/adminCollyPatch.ts
git commit -m "refactor: share one logo-map payload schema between write paths"
```

---

### Task 2: Snapshot storage

The table plus the pure helpers that read and write its `map` column.

**Files:**
- Create: `prisma/colly_logo_edits_migration.sql`, `lib/collyLogoSnapshot.ts`
- Modify: `prisma/schema.prisma`
- Test: `lib/__tests__/colly-logo-snapshot.test.ts`

**Interfaces:**
- Consumes: `LogoMapEntry`, `logoMapSchema` from Task 1.
- Produces: `serializeLogoMap(map: LogoMapEntry[]): string`, `parseLogoMap(json: string): LogoMapEntry[]`, `logoCountOf(map: LogoMapEntry[]): number`. Tasks 3 and 4 import all three.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/colly-logo-snapshot.test.ts
import { describe, it, expect } from "vitest";
import { serializeLogoMap, parseLogoMap, logoCountOf } from "../collyLogoSnapshot";

// Each save appends a snapshot of the whole map. The newest snapshot for a
// colly IS its current map, so a round trip that loses or reorders an entry
// silently corrupts the colly.

const map = [
  { line: 12, end: 20, caption: "dipswitch" },
  { line: 21, caption: "NEXUS -spot for zeus" },
];

describe("logo map snapshots", () => {
  it("round trips a map unchanged", () => {
    expect(parseLogoMap(serializeLogoMap(map))).toEqual(map);
  });

  it("round trips an empty map", () => {
    expect(parseLogoMap(serializeLogoMap([]))).toEqual([]);
  });

  it("sorts entries by line so a snapshot has one canonical form", () => {
    const unsorted = [{ line: 21, caption: "b" }, { line: 12, caption: "a" }];
    expect(parseLogoMap(serializeLogoMap(unsorted)).map((e) => e.line)).toEqual([12, 21]);
  });

  it("drops an absent end rather than storing null", () => {
    expect(serializeLogoMap([{ line: 5, caption: "x" }])).not.toMatch(/null/);
  });

  it("counts the entries saved, not the rows the catalog will keep", () => {
    // buildLogoRow drops uncaptioned entries; logo_count records what the user
    // actually mapped, and the panel reports the difference as a warning.
    expect(logoCountOf(map)).toBe(2);
    expect(logoCountOf([{ line: 1, caption: "" }, { line: 2, caption: "real" }])).toBe(2);
    expect(logoCountOf([])).toBe(0);
  });

  it("returns an empty map for stored garbage instead of throwing", () => {
    // A row written by an older format must never break the release page.
    expect(parseLogoMap("not json")).toEqual([]);
    expect(parseLogoMap("")).toEqual([]);
    expect(parseLogoMap('{"line":1}')).toEqual([]);
    expect(parseLogoMap('[{"line":0,"caption":"bad"}]')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/colly-logo-snapshot.test.ts`
Expected: FAIL — `Cannot find module '../collyLogoSnapshot'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/collyLogoSnapshot.ts
import { logoMapSchema, type LogoMapEntry } from "@/lib/logoMapPayload";

// Read/write for the `colly_logo_edits.map` column. Pure, so the storage
// format is testable without a database.

/** Canonical JSON for a map: sorted by line, `end` omitted when absent. */
export function serializeLogoMap(map: LogoMapEntry[]): string {
  const sorted = [...map].sort((a, b) => a.line - b.line);
  return JSON.stringify(sorted.map((e) => (
    e.end === undefined ? { line: e.line, caption: e.caption } : { line: e.line, end: e.end, caption: e.caption }
  )));
}

/**
 * Map stored in a snapshot row. Returns an empty map for anything unreadable —
 * a malformed historical row must never break the release page that reads it.
 */
export function parseLogoMap(json: string): LogoMapEntry[] {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return []; }
  const parsed = logoMapSchema.safeParse(raw);
  if (!parsed.success) return [];
  return [...parsed.data].sort((a, b) => a.line - b.line);
}

/** Entries the user mapped. The catalog may keep fewer (uncaptioned ones). */
export function logoCountOf(map: LogoMapEntry[]): number {
  return map.length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/colly-logo-snapshot.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Write the migration**

```sql
-- prisma/colly_logo_edits_migration.sql
-- Public logo tagging: one append-only snapshot per save. The newest row for a
-- colly IS that colly's current logo map; colly_logos is a derived index
-- rebuilt from it. Run on the server after deploying:
--   mysql -u <user> -p <db> < colly_logo_edits_migration.sql

CREATE TABLE IF NOT EXISTS colly_logo_edits (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  colly_id   INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  timestamp  INT          NOT NULL,
  map        MEDIUMTEXT   NOT NULL,
  logo_count INT          NOT NULL DEFAULT 0,
  KEY ix_colly_newest (colly_id, id),
  KEY ix_user (user_id)
);
```

- [ ] **Step 6: Add the Prisma model**

Append to `prisma/schema.prisma`, keeping models in alphabetical order (it sits after `colly_logos`):

```prisma
model colly_logo_edits {
  id         Int    @id @default(autoincrement()) @db.UnsignedInt
  colly_id   Int    @db.UnsignedInt
  user_id    Int    @db.UnsignedInt
  timestamp  Int // unix seconds, matching `comments`
  map        String @db.MediumText // JSON: [{line, end?, caption}, ...]
  logo_count Int    @default(0) // entries in `map`, for the tagger leaderboard

  @@index([colly_id, id], map: "ix_colly_newest")
  @@index([user_id], map: "ix_user")
}
```

- [ ] **Step 7: Regenerate the client and type-check**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: "Generated Prisma Client", no type errors

- [ ] **Step 8: Commit**

```bash
git add lib/collyLogoSnapshot.ts lib/__tests__/colly-logo-snapshot.test.ts prisma/colly_logo_edits_migration.sql prisma/schema.prisma
git commit -m "feat: add colly logo edit snapshots"
```

---

### Task 3: Public save and history endpoint

**Files:**
- Create: `lib/collyLogoWrite.ts`, `app/api/collys/[id]/logos/route.ts`, `app/api/collys/[id]/logos/__tests__/logos-route.test.ts`

**Interfaces:**
- Consumes: `logoMapSchema` (Task 1); `serializeLogoMap`, `logoCountOf` (Task 2); existing `buildLogoRowsFromMap` from `@/lib/collyLogoRows` and `loadEntityDicts` from `@/lib/collyLogoIndex`.
- Produces: `writeLogoEdit(collyId: number, userId: number, logos: LogoMapEntry[]): Promise<{ logoCount: number; rowCount: number }>` in `lib/collyLogoWrite.ts` — Task 4 imports it from there. Plus `POST /api/collys/[id]/logos` returning `{ status: true, logoCount, rowCount }` and `GET` returning `{ id, nick, timestamp, logoCount }[]`.

**Why the helper lives in `lib/`, not the route file:** no `route.ts` in this
codebase exports a non-handler, and Next.js validates App Router route module
exports. Shared server logic belongs in `lib/`.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/collys/[id]/logos/__tests__/logos-route.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"`
Expected: FAIL — cannot resolve `../route`

- [ ] **Step 3: Write the implementation**

```ts
// lib/collyLogoWrite.ts
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { type LogoMapEntry } from "@/lib/logoMapPayload";
import { serializeLogoMap, logoCountOf } from "@/lib/collyLogoSnapshot";
import { buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { loadEntityDicts } from "@/lib/collyLogoIndex";

/**
 * Append a snapshot and rebuild the colly's catalog rows from it, atomically.
 * A snapshot without its rebuild (or the reverse) would leave search
 * disagreeing with the recorded history, so both go in one transaction.
 *
 * Shared by the public save route and the admin revert route, which replays an
 * old map through here.
 */
export async function writeLogoEdit(
  collyId: number,
  userId: number,
  logos: LogoMapEntry[],
): Promise<{ logoCount: number; rowCount: number }> {
  const rows = buildLogoRowsFromMap(collyId, logos, await loadEntityDicts());
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.colly_logo_edits.create({
      data: {
        colly_id: collyId,
        user_id: userId,
        timestamp: Math.floor(Date.now() / 1000),
        map: serializeLogoMap(logos),
        logo_count: logoCountOf(logos),
      },
    }),
    prisma.colly_logos.deleteMany({ where: { colly_id: collyId } }),
  ];
  // Manual rows drive rendering and search, exactly as an artist-tagged upload does.
  if (rows.length) {
    ops.push(prisma.colly_logos.createMany({ data: rows.map((r) => ({ ...r, manual: 1 })) }));
  }
  await prisma.$transaction(ops);
  return { logoCount: logoCountOf(logos), rowCount: rows.length };
}
```

```ts
// app/api/collys/[id]/logos/route.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { logoMapSchema } from "@/lib/logoMapPayload";
import { writeLogoEdit } from "@/lib/collyLogoWrite";

const postSchema = z.object({ logos: logoMapSchema });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  // Check the colly exists BEFORE writing, so a bad id never leaves an
  // orphaned snapshot behind.
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { id: true, filename: true } });
  if (!colly) return apiError("Not found", 404);

  const result = await writeLogoEdit(collyId, Number(session.user.id), parsed.data.logos);

  if (colly.filename) revalidatePath("/release/" + colly.filename);
  broadcast(`release:${collyId}:logos`, { type: "tagged", nick: session.user.name ?? "" });

  return apiOk({ status: true, ...result });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const edits = await prisma.colly_logo_edits.findMany({
    where: { colly_id: collyId },
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, user_id: true, timestamp: true, logo_count: true },
  });
  if (!edits.length) return apiOk([]);

  const users = await prisma.users.findMany({
    where: { id: { in: edits.map((e) => e.user_id) } },
    select: { id: true, nick: true },
  });
  const nick = new Map(users.map((u) => [u.id, u.nick]));

  return apiOk(edits.map((e) => ({
    id: e.id,
    nick: nick.get(e.user_id) ?? "unknown",
    timestamp: e.timestamp,
    logoCount: e.logo_count,
  })));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/collyLogoWrite.ts "app/api/collys/[id]/logos/route.ts" "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"
git commit -m "feat: public endpoint for saving a colly logo map"
```

---

### Task 4: Admin revert

**Files:**
- Create: `app/api/collys/[id]/logos/revert/route.ts`
- Test: extend `app/api/collys/[id]/logos/__tests__/logos-route.test.ts`

**Interfaces:**
- Consumes: `writeLogoEdit` (Task 3), `parseLogoMap` (Task 2).
- Produces: `POST /api/collys/[id]/logos/revert` taking `{ editId: number }`.

- [ ] **Step 1: Write the failing test**

Append to `app/api/collys/[id]/logos/__tests__/logos-route.test.ts`. Add `findUnique` to the `colly_logo_edits` fake first, alongside the existing `create` and `findMany`:

```ts
  colly_logo_edits: {
    create: (args: unknown) => ({ op: "createEdit", args }),
    findUnique: () => Promise.resolve({
      id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 1,
      map: '[{"line":12,"caption":"dipswitch"}]',
    }),
    findMany: () => Promise.resolve([
      { id: 9, colly_id: 4122, user_id: 42, timestamp: 1753600000, logo_count: 7 },
    ]),
  },
```

Then append the new describe block:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"`
Expected: FAIL — cannot resolve `../revert/route`

- [ ] **Step 3: Write the implementation**

```ts
// app/api/collys/[id]/logos/revert/route.ts
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { parseLogoMap } from "@/lib/collyLogoSnapshot";
import { writeLogoEdit } from "@/lib/collyLogoWrite";

const postSchema = z.object({ editId: z.number().int().positive() });

// Reverting replays an older snapshot as a NEW edit, attributed to the admin
// doing the revert. History stays append-only: nothing is ever rewritten, so
// a revert can itself be reverted.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  const edit = await prisma.colly_logo_edits.findUnique({ where: { id: parsed.data.editId } });
  if (!edit || edit.colly_id !== collyId) return apiError("Not found", 404);

  const result = await writeLogoEdit(collyId, Number(session!.user!.id), parseLogoMap(edit.map));

  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
  if (colly?.filename) revalidatePath("/release/" + colly.filename);

  return apiOk({ status: true, ...result });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"`
Expected: PASS (9 tests)

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit`

```bash
git add "app/api/collys/[id]/logos/revert/route.ts" "app/api/collys/[id]/logos/__tests__/logos-route.test.ts"
git commit -m "feat: admin revert for colly logo maps"
```

---

### Task 5: Open the preview endpoint to any logged-in user

The editor needs the report for an existing colly. That GET is admin-gated today; it is a read-only dry run of an already-public file.

**Files:**
- Modify: `app/api/collys/preview/route.ts:111-114`

- [ ] **Step 1: Make the change**

Replace:

```ts
export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);
```

with:

```ts
// Any logged-in user: this is a read-only dry run of a colly that is already
// publicly downloadable, and the public logo tagger needs the same report the
// admin editor does. Nothing it returns is privileged.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
```

- [ ] **Step 2: Verify the whole suite still passes**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors

- [ ] **Step 3: Commit**

```bash
git add app/api/collys/preview/route.ts
git commit -m "feat: let any logged-in user read a colly preview report"
```

---

### Task 6: The tagging panel

Owns the report fetch, the map state, saving and history. Keeps `ReleaseClient.tsx` from growing.

**Files:**
- Create: `components/release/LogoTagPanel.tsx`

**Interfaces:**
- Consumes: `CollyPreview`, `PreviewReport`, `LogoEntry` from `@/components/submit/CollyPreview`; the routes from Tasks 3-5.
- Produces: `export default function LogoTagPanel(props: LogoTagPanelProps)` where
  `interface LogoTagPanelProps { collyId: number; filename: string; type: string; font: string; fg: string; bg: string; isAdmin: boolean; onDone: () => void }`.
  Task 7 mounts it with exactly these props.

- [ ] **Step 1: Write the component**

```tsx
// components/release/LogoTagPanel.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import CollyPreview, { type PreviewReport, type LogoEntry } from "@/components/submit/CollyPreview";

export interface LogoTagPanelProps {
  collyId: number;
  filename: string;
  type: string;
  font: string;
  fg: string;
  bg: string;
  isAdmin: boolean;
  onDone: () => void;
}

interface EditRow { id: number; nick: string; timestamp: number; logoCount: number }

function ago(unix: number): string {
  const secs = Math.max(0, Math.floor(Date.now() / 1000) - unix);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function LogoTagPanel({ collyId, filename, type, font, fg, bg, isAdmin, onDone }: LogoTagPanelProps) {
  const [report, setReport] = useState<PreviewReport | null>(null);
  const [logoMap, setLogoMap] = useState<LogoEntry[]>([]);
  const [history, setHistory] = useState<EditRow[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadHistory = useCallback(() => {
    fetch(`/api/collys/${collyId}/logos`)
      .then(r => r.json())
      .then((rows: EditRow[]) => setHistory(Array.isArray(rows) ? rows : []))
      .catch(() => setHistory([]));
  }, [collyId]);

  // Seed the editor from the colly's current map, exactly as the admin editor
  // does: saved entries verbatim, auto-detected regions only where they do not
  // overlap one (canvas collys have no text lines to detect against).
  useEffect(() => {
    let live = true;
    fetch(`/api/collys/preview?filename=${encodeURIComponent(filename)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((rep: PreviewReport) => {
        if (!live) return;
        setReport(rep);
        const saved: LogoEntry[] = (rep.meta.logos ?? []).map(m => ({ line: m.line, end: m.end, caption: m.caption, auto: false }));
        const isCanvas = rep.type === "ANSI" || rep.type === "CP437";
        const overlapsSaved = (a: { line: number; end?: number }) =>
          saved.some(m => a.line <= (m.end ?? m.line) && (a.end ?? a.line) >= m.line);
        const auto: LogoEntry[] = isCanvas ? [] : (rep.logos ?? [])
          .map(l => ({
            line: l.line,
            end: l.end,
            caption: l.searchable ? (l.author ? `${l.name} -${l.author}` : l.name) : "",
            auto: true,
          }))
          .filter(a => !overlapsSaved(a));
        setLogoMap([...saved, ...auto].sort((x, y) => x.line - y.line));
      })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [filename]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const save = async () => {
    setSaving(true);
    let res: Response;
    try {
      res = await fetch(`/api/collys/${collyId}/logos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logos: logoMap.map(l => ({ line: l.line, end: l.end, caption: l.caption })) }),
      });
    } catch {
      setSaving(false);
      setMsg({ text: "Save failed - network error", ok: false });
      return;
    }
    setSaving(false);
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      setMsg({ text: detail?.error ?? `Save failed (${res.status})`, ok: false });
      return;
    }
    const body = await res.json().catch(() => null);
    // rowCount < logoCount means captions were dropped as unsearchable.
    const dropped = body ? body.logoCount - body.rowCount : 0;
    setMsg({
      text: dropped > 0
        ? `Saved. ${dropped} caption${dropped === 1 ? "" : "s"} are not searchable.`
        : "Saved!",
      ok: true,
    });
    loadHistory();
  };

  const revert = async (editId: number) => {
    if (!confirm("Restore this version of the logo map?")) return;
    const res = await fetch(`/api/collys/${collyId}/logos/revert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editId }),
    }).catch(() => null);
    if (!res?.ok) { setMsg({ text: "Revert failed", ok: false }); return; }
    setMsg({ text: "Reverted. Reload to see the restored map.", ok: true });
    loadHistory();
  };

  if (failed) {
    return (
      <div className="bg-secondary ap-1 amb-1">
        <div className="red amb-1">Could not load the logo editor.</div>
        <input type="button" className="btn-big" value="Done" onClick={onDone} />
      </div>
    );
  }

  if (!report) return <div className="lightgrey ap-1">Loading logo editor...</div>;

  return (
    <div className="bg-secondary ap-1 amb-1">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <input type="button" className="btn-big" value={saving ? "Saving..." : "Save Logo Map"} disabled={saving} onClick={save} />
        <input type="button" className="btn-big" value="Done" onClick={onDone} />
        {msg && <span className={msg.ok ? "green" : "red"}>{msg.text}</span>}
      </div>

      <CollyPreview
        report={report}
        type={type}
        font={font}
        fg={fg}
        bg={bg}
        logoMap={logoMap}
        setLogoMap={setLogoMap}
      />

      {history.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div className="lightgrey" style={{ marginBottom: "8px" }}>EDIT HISTORY</div>
          {history.map(h => (
            <div key={h.id} style={{ display: "flex", gap: "8px", alignItems: "center", height: "16px", lineHeight: "16px" }}>
              <span className="lightgrey">mapped by</span>
              <span className="magenta">{h.nick}</span>
              <span className="lightgrey">{ago(h.timestamp)}, {h.logoCount} logo{h.logoCount === 1 ? "" : "s"}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => revert(h.id)}
                  style={{ background: "transparent", border: "none", color: "#aaaaaa", padding: 0, fontFamily: "inherit", lineHeight: "16px", cursor: "pointer" }}
                >
                  [restore]
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/release/LogoTagPanel.tsx
git commit -m "feat: logo tagging panel for the release page"
```

---

### Task 7: Tag mode in the release viewer

Tagging replaces the viewer in place. The art must never render twice.

**Files:**
- Modify: `app/release/[filename]/ReleaseClient.tsx`
- Test: `lib/__tests__/release-tag-mode.test.ts`

**Interfaces:**
- Consumes: `LogoTagPanel` (Task 6).
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/release-tag-mode.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Tagging is a MODE of the existing viewer, not a second copy of the art.
// Both viewer branches and the minimap must be suppressed while tagging, or
// the colly renders twice on the same page.

const source = readFileSync(
  path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
  "utf8",
);

describe("release page tag mode", () => {
  it("suppresses both viewer branches while tagging", () => {
    // Each viewer branch is gated on `collyVisible`; tagging must gate them too.
    const branches = source.match(/collyVisible && \(/g) ?? [];
    expect(branches.length).toBeGreaterThan(0);
    expect(source).toMatch(/const viewerVisible = collyVisible && !tagging/);
    expect(source).not.toMatch(/!useCanvasViewer && \(type === "ASCII" \|\| !!fileContent\) && collyVisible/);
  });

  it("keeps the minimap out of tag mode", () => {
    expect(source).toMatch(/entryCount: tagging \? 0 : logoIndex\.length/);
  });

  it("loads the panel lazily so readers never download the editor", () => {
    expect(source).toMatch(/dynamic\(\(\) => import\("@\/components\/release\/LogoTagPanel"\)/);
    expect(source).toMatch(/ssr:\s*false/);
  });

  it("offers tagging only to logged-in users", () => {
    expect(source).toMatch(/userNick && .*Tag Logos/s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/release-tag-mode.test.ts`
Expected: FAIL — 4 failing assertions

- [ ] **Step 3: Add the import and state**

At the top of `app/release/[filename]/ReleaseClient.tsx`, with the other imports:

```ts
import dynamic from "next/dynamic";

// Loaded on first entry into tag mode only — readers who never tag do not
// download the editor.
const LogoTagPanel = dynamic(() => import("@/components/release/LogoTagPanel"), { ssr: false });
```

Next to `const [collyVisible, setCollyVisible] = useState(true);` add:

```ts
  // Tagging replaces the viewer in place rather than rendering the art twice.
  const [tagging, setTagging] = useState(false);
```

- [ ] **Step 4: Gate both viewer branches**

Immediately after `const hasInlineContent = !isArchive || !!fileContent;` add:

```ts
  // One flag for both viewer branches: the plain-text one and the canvas one.
  const viewerVisible = collyVisible && !tagging;
```

Then in the two viewer conditions, replace `collyVisible` with `viewerVisible`:

- `{!useCanvasViewer && (type === "ASCII" || !!fileContent) && collyVisible && (`
  becomes `{!useCanvasViewer && (type === "ASCII" || !!fileContent) && viewerVisible && (`
- `{useCanvasViewer && collyVisible && (`
  becomes `{useCanvasViewer && viewerVisible && (`

- [ ] **Step 5: Keep the minimap and the mode-specific controls out of tag mode**

In the `shouldShowMinimap` call, replace `entryCount: logoIndex.length,` with:

```ts
    entryCount: tagging ? 0 : logoIndex.length,
```

In the controls bar, change the three `collyVisible` guards on Fullscreen, Fit to screen and the autoplay/groove/index/minimap group to `viewerVisible`, so those controls disappear in tag mode. The `Hide Colly` and `Download` buttons keep using `collyVisible` and stay available.

- [ ] **Step 6: Add the button and mount the panel**

In the controls bar, after the Download button:

```tsx
          {hasInlineContent && userNick && (
            <input type="button" className="btn-big"
              value={tagging ? "Stop Tagging" : "Tag Logos"}
              title="Map the logos in this colly so they show up in search"
              onClick={() => setTagging(t => !t)} />
          )}
```

Directly before the first viewer branch (`{!useCanvasViewer && ...`), mount the panel:

```tsx
      {tagging && (
        <LogoTagPanel
          collyId={collyId}
          filename={filename}
          type={type}
          font={font}
          fg={fgColor}
          bg={bgColor}
          isAdmin={isAdmin}
          onDone={() => setTagging(false)}
        />
      )}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/release-tag-mode.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests), no type errors

- [ ] **Step 8: Run the whole suite and build**

Run: `npx vitest run && npm run build`
Expected: all tests pass, build completes

- [ ] **Step 9: Commit**

```bash
git add "app/release/[filename]/ReleaseClient.tsx" lib/__tests__/release-tag-mode.test.ts
git commit -m "feat: tag logos from the release page"
```

---

### Task 8: Migrate and verify on production

**Files:** none changed. This task runs the migration and checks the feature end to end.

- [ ] **Step 1: Apply the migration on the host**

The credentials live in the app's `.env` on the server (`/var/www/asciiarena.se/nextjs-current/.env`, key `DATABASE_URL`). Ask the human partner to run this — reading credentials is blocked in automation:

```bash
scp prisma/colly_logo_edits_migration.sql spot@97.75.89.139:/tmp/
ssh spot@97.75.89.139 'F=/var/www/asciiarena.se/nextjs-current/.env; \
  URL=$(grep -m1 "^DATABASE_URL" $F | cut -d= -f2- | tr -d "\""); \
  C=${URL#*://}; UP=${C%%@*}; HD=${C#*@}; \
  DBU=${UP%%:*}; DBP=${UP#*:}; DBN=${HD##*/}; DBN=${DBN%%\?*}; \
  MYSQL_PWD="$DBP" mysql -u "$DBU" "$DBN" < /tmp/colly_logo_edits_migration.sql && echo "[OK] table created"'
```

- [ ] **Step 2: Confirm the table exists**

```bash
ssh spot@97.75.89.139 'F=/var/www/asciiarena.se/nextjs-current/.env; \
  URL=$(grep -m1 "^DATABASE_URL" $F | cut -d= -f2- | tr -d "\""); \
  C=${URL#*://}; UP=${C%%@*}; HD=${C#*@}; \
  DBU=${UP%%:*}; DBP=${UP#*:}; DBN=${HD##*/}; DBN=${DBN%%\?*}; \
  MYSQL_PWD="$DBP" mysql -u "$DBU" "$DBN" -e "DESCRIBE colly_logo_edits;"'
```

Expected: six columns — id, colly_id, user_id, timestamp, map, logo_count.

- [ ] **Step 3: Deploy**

```bash
bash deploy.sh
```

Expected: build succeeds, service restarts, home page returns 200. A transient 500 immediately after the restart is the Prisma pool warming and self-heals.

- [ ] **Step 4: Manual verification (human, logged in)**

These cannot be automated — they need a real session. Do NOT check these off on the human's behalf.

- [ ] Open a colly, confirm "Tag Logos" appears when logged in and is absent when logged out.
- [ ] Click it: the normal viewer is replaced by the editor. The art appears exactly once on the page.
- [ ] The minimap, Fullscreen, Fit to screen, Autoplay and Index controls are gone while tagging.
- [ ] Map a logo by clicking a line, give it a caption, Save. The message reports success and any unsearchable captions.
- [ ] "Done" restores the normal viewer.
- [ ] Reload: the release page's sections and index reflect the new map.
- [ ] Search the caption you used and confirm the logo is found with a working deep link.
- [ ] Tag the same colly from a second account; the history lists both edits, newest first.
- [ ] As an admin, "[restore]" an earlier edit and confirm the map returns and history grows rather than shrinks.

- [ ] **Step 5: Record the outcome**

Append a short "logo tagging shipped" section to `thoughts/shared/handoffs/2026-07-27_user-reported-bug-fixes.md` or a new dated handoff, noting the migration has been applied and listing anything the manual pass turned up.

```bash
git add thoughts/shared/handoffs/
git commit -m "docs: record public logo tagging rollout"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Scope: logo map only, DB only, never rewrite the file | Task 3 (no file writes anywhere in the write path) |
| Permissions: any logged-in account, no extra rank check | Task 3 Step 3 |
| Data model: `colly_logo_edits`, no `colly_logos` change | Task 2 |
| Newest snapshot is the current map | Task 2 (helpers), Task 3 (`writeLogoEdit`) |
| Revert replays as a new edit | Task 4 |
| `logo_count` counts saves, catalog may hold fewer | Task 2 Step 1 test, Task 6 dropped-caption message |
| Pre-feature collys seed from existing rows | Task 6 Step 1 (seeds from `report.meta.logos`) |
| `POST`/`GET /api/collys/[id]/logos` | Task 3 |
| Unknown colly id 404s before any write | Task 3 Step 3 |
| Empty map is a legal save | Tasks 1, 3 |
| Preview GET opened to any session | Task 5 |
| Tag mode replaces the viewer, no double render | Task 7 |
| Editor loaded via `next/dynamic`, `ssr: false` | Task 7 |
| Editor inherits reader font/fg/bg | Task 7 Step 6 |
| Panel in its own file | Task 6 |
| Excluded: rate limiting, SSE, leaderboard | Not planned, by design |

One deliberate deviation from the spec: the spec said tagging hides the index
panel; the plan achieves that by gating the whole autoplay/groove/index control
group on `viewerVisible` (Task 7 Step 5), which is the same outcome with one
condition instead of four.

**Placeholder scan:** No TBDs, no "add error handling", no "similar to Task N".
Every code step carries the actual code.

**Type consistency:** `LogoMapEntry` (Task 1) is consumed by name in Tasks 2-4.
`writeLogoEdit(collyId, userId, logos)` is defined in Task 3 and imported in
Task 4 with the same signature. `LogoTagPanelProps` in Task 6 matches the props
passed in Task 7 Step 6 exactly: `collyId, filename, type, font, fg, bg,
isAdmin, onDone`. `serializeLogoMap` / `parseLogoMap` / `logoCountOf` keep the
same names in Tasks 2, 3 and 4.
