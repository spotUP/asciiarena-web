import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn().mockResolvedValue([]),
    artists: { findMany: vi.fn().mockResolvedValue([]) },
    crews: { findMany: vi.fn().mockResolvedValue([]) },
    users: { findMany: vi.fn().mockResolvedValue([]) },
    collys: { findUnique: vi.fn().mockResolvedValue({ filename: "chr-checkmate.ans", type: "ANSI" }) },
    colly_logos: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn((args: unknown) => ({ op: "deleteMany", args })),
      createMany: vi.fn((args: unknown) => ({ op: "createMany", args })),
    },
    colly_logo_edits: {
      create: vi.fn((args: unknown) => ({ op: "createEdit", args })),
      count: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "7", rank: "Admin" } }),
}));

vi.mock("@/lib/live", () => ({
  broadcast: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/admin/collys/route";
import { prisma } from "@/lib/db";

type EditArgs = { data: { colly_id: number; user_id: number; map: string; logo_count: number } };

const patchLogos = () => new Request("http://localhost/api/admin/collys", {
  method: "PATCH",
  body: JSON.stringify({ id: 123, logos: [{ line: 5, end: 12, caption: "spot" }] }),
});

function rawQueryText(): string {
  const firstCall = vi.mocked(prisma.$queryRaw).mock.calls[0];
  const strings = firstCall?.[0] as TemplateStringsArray | undefined;
  return strings ? Array.from(strings).join("?") : "";
}

describe("PATCH /api/admin/collys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
  });

  it("searches editable collys with the table alias required by artist and crew lookups", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{
      id: 123,
      filename: "chr-checkmate.ans",
      name: "Checkmate",
      year: 1995,
      month: 6,
      day: 12,
      type: "ANSI",
      file_id: "CHECKMATE",
      artists: "Chr",
      crews: "Mistigris",
      broken: 0,
      broken_comment: null,
      uploader: "spot",
      total_count: BigInt(1),
    }]);

    const req = { nextUrl: new URL("http://localhost/api/admin/collys?q=chr-checkmate.ans") };
    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0].filename).toBe("chr-checkmate.ans");
    expect(rawQueryText()).toContain("FROM collys c WHERE");
    expect(rawQueryText()).toContain("WHERE ac.colly_id = c.id");
    expect(rawQueryText()).toContain("WHERE cc.colly_id = c.id");
  });

  it("updates all editable colly fields and rewrites artist and crew links", async () => {
    const req = new Request("http://localhost/api/admin/collys", {
      method: "PATCH",
      body: JSON.stringify({
        id: 123,
        filename: "chr-checkmate.ans",
        name: "Checkmate",
        year: 1995,
        month: 6,
        day: 12,
        type: "ANSI",
        file_id: "CHECKMATE",
        artistNames: ["Chr"],
        crewNames: ["Mistigris"],
      }),
    });

    const res = await PATCH(req as never);

    expect(res.status).toBe(200);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(5);
  });

  it("leaves render columns untouched when the payload omits them (partial PATCH)", async () => {
    const req = new Request("http://localhost/api/admin/collys", {
      method: "PATCH",
      body: JSON.stringify({ id: 123, broken: 1 }),
    });
    await PATCH(req as never);
    // base UPDATE only — no per-field render UPDATEs, no link rewrites
    const texts = vi.mocked(prisma.$executeRaw).mock.calls
      .map((c) => Array.from((c[0] as TemplateStringsArray) ?? []).join("?"));
    expect(texts.some((t) => t.includes("render_font ="))).toBe(false);
  });

  it("writes render override columns when they are provided", async () => {
    const req = new Request("http://localhost/api/admin/collys", {
      method: "PATCH",
      body: JSON.stringify({ id: 123, render_font: "Topaz", render_fg: "#ff55ff", render_bg: "", soundtrack: "" }),
    });
    await PATCH(req as never);
    const texts = vi.mocked(prisma.$executeRaw).mock.calls
      .map((c) => Array.from((c[0] as TemplateStringsArray) ?? []).join("?"));
    expect(texts.some((t) => t.includes("render_font ="))).toBe(true);
    expect(texts.some((t) => t.includes("render_fg ="))).toBe(true);
    expect(texts.some((t) => t.includes("render_bg ="))).toBe(true);
    expect(texts.some((t) => t.includes("soundtrack ="))).toBe(true);
  });

  it("rebuilds the logo catalog when a map is provided", async () => {
    await PATCH(patchLogos() as never);
    expect(prisma.colly_logos.deleteMany).toHaveBeenCalledWith({ where: { colly_id: 123 } });
    expect(prisma.colly_logos.createMany).toHaveBeenCalled();
  });

  // The admin editor used to write `colly_logos` straight, with no snapshot.
  // Once ANY member has tagged a colly it already has snapshots, so the
  // baseline-once rule never fires for it again -- leaving the catalog ahead of
  // the newest snapshot. The tagging panel seeds from that snapshot, so the
  // next member save overwrote the admin's curation with a stale map and
  // preserved nothing: the same data-loss door the baseline snapshot closed,
  // reached from the admin side.
  it("snapshots the admin's logo map instead of writing the catalog behind history's back", async () => {
    await PATCH(patchLogos() as never);
    expect(prisma.colly_logo_edits.create).toHaveBeenCalledTimes(1);
    const snapshot = vi.mocked(prisma.colly_logo_edits.create).mock.calls[0][0] as EditArgs;
    expect(JSON.parse(snapshot.data.map)).toEqual([{ line: 5, end: 12, caption: "spot" }]);
    expect(snapshot.data.logo_count).toBe(1);
  });

  it("attributes the snapshot to the admin who made the edit", async () => {
    await PATCH(patchLogos() as never);
    const snapshot = vi.mocked(prisma.colly_logo_edits.create).mock.calls[0][0] as EditArgs;
    expect(snapshot.data.colly_id).toBe(123);
    expect(snapshot.data.user_id).toBe(7);
  });

  it("writes the snapshot and the catalog rebuild in one transaction", async () => {
    await PATCH(patchLogos() as never);
    const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as { op: string }[];
    expect(ops.map((o) => o.op)).toEqual(["createEdit", "deleteMany", "createMany"]);
  });

  it("takes no snapshot for a PATCH that carries no logo map", async () => {
    const req = new Request("http://localhost/api/admin/collys", {
      method: "PATCH",
      body: JSON.stringify({ id: 123, name: "Checkmate" }),
    });
    await PATCH(req as never);
    expect(prisma.colly_logo_edits.create).not.toHaveBeenCalled();
  });

  it("returns the saved manual map for the visual editor (?logos=id)", async () => {
    vi.mocked(prisma.colly_logos.findMany).mockResolvedValueOnce([
      { start_line: 4, end_line: 11, label: "spot" },
    ] as never);
    const req = { nextUrl: new URL("http://localhost/api/admin/collys?logos=123") };
    const res = await GET(req as never);
    const body = await res.json();
    expect(body).toEqual([{ line: 5, end: 12, caption: "spot" }]);
  });
});
