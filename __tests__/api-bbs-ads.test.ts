import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    raw: (s: string) => s,
    empty: {},
  },
}));

import { GET } from "@/app/api/bbs-ads/route";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

function req(url: string): never {
  return { nextUrl: new URL(url) } as never;
}

describe("GET /api/bbs-ads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses anonymous callers with 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(req("http://localhost/api/bbs-ads?q=x"));
    expect(res.status).toBe(401);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("returns ad rows for a logged-in user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "7" } } as never);
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([
        {
          id: 1,
          bbs_id: 2,
          bbs_name: "The Yard",
          filename: "tHEYARd.bbS",
          filesize: 1334,
          content: "tHe yARd!",
          is_ansi: 0,
          nodes: 8,
          total_count: 1,
        },
      ])
      .mockResolvedValueOnce([{ cnt: 1 }]);
    const res = await GET(req("http://localhost/api/bbs-ads?q=yard"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ id: 1, bbs_name: "The Yard", filename: "tHEYARd.bbS", content: "tHe yARd!" });
  });
});
