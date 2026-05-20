import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
  },
}));

import { GET, POST } from "@/app/api/collys/[id]/comments/route";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

describe("GET /api/collys/[id]/comments", () => {
  beforeEach(() => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { commentid: BigInt(1), timestamp: 1700000000, nick: "spot", rating: 8, comment: "nice" },
    ]);
  });

  it("returns comments without auth", async () => {
    const res = await GET(
      new Request("http://localhost/api/collys/1/comments"),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json() as { id: number; nick: string }[];
    expect(data[0].nick).toBe("spot");
  });

  it("formats timestamp as YYYY-MM-DD HH:mm", async () => {
    const res = await GET(
      new Request("http://localhost/api/collys/1/comments"),
      { params: Promise.resolve({ id: "1" }) }
    );
    const data = await res.json() as { time: string }[];
    expect(data[0].time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

describe("POST /api/collys/[id]/comments", () => {
  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new Request("http://localhost/api/collys/1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "test", rating: 5 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("inserts comment when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "42", name: "spot", rank: null, crew: null },
      expires: "2099-01-01",
    });
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);

    const req = new Request("http://localhost/api/collys/1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "great work" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });
});
