import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
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
});
