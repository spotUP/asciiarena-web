import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $executeRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { rank: "Admin" } }),
}));

vi.mock("@/lib/live", () => ({
  broadcast: vi.fn(),
}));

import { PATCH } from "@/app/api/admin/collys/route";
import { prisma } from "@/lib/db";

describe("PATCH /api/admin/collys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
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
