import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    artists: { findMany: vi.fn().mockResolvedValue([]) },
    crews: { findMany: vi.fn().mockResolvedValue([]) },
    users: { findMany: vi.fn().mockResolvedValue([]) },
    colly_logos: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { rank: "Admin" } }),
}));

vi.mock("@/lib/live", () => ({
  broadcast: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/admin/collys/route";
import { prisma } from "@/lib/db";

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
    const req = new Request("http://localhost/api/admin/collys", {
      method: "PATCH",
      body: JSON.stringify({ id: 123, logos: [{ line: 5, end: 12, caption: "spot" }] }),
    });
    await PATCH(req as never);
    expect(prisma.colly_logos.deleteMany).toHaveBeenCalledWith({ where: { colly_id: 123 } });
    expect(prisma.colly_logos.createMany).toHaveBeenCalled();
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
