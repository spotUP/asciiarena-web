import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all Next.js/NextAuth dependencies before importing the route
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    raw: (s: string) => s,
  },
}));

import { GET } from "@/app/api/collys/route";
import { prisma } from "@/lib/db";

const mockCollyRow = {
  id: BigInt(1),
  name: "Test Colly",
  filename: "test.lha",
  filesize: BigInt(1024),
  artists: "Artist1",
  crews: "Crew1",
  cdate: "2024-01-01",
};

const mockCountRow = { cnt: BigInt(1) };

describe("GET /api/collys", () => {
  beforeEach(() => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockCollyRow])
      .mockResolvedValueOnce([mockCountRow]);
  });

  it("returns 200 with colly list", async () => {
    const req = new Request("http://localhost/api/collys?page=1&sort=name&asc=A&pagesize=10&filter=");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { id: number; name: string; total_count: number }[];
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe(1);
    expect(data[0].name).toBe("Test Colly");
    expect(data[0].total_count).toBe(1);
  });

  it("serializes BigInt without throwing", async () => {
    const req = new Request("http://localhost/api/collys?page=1&sort=name&asc=A&pagesize=10&filter=");
    const res = await GET(req as never);
    // If BigInt is not converted, JSON.stringify throws — this would have caused the test to fail
    await expect(res.json()).resolves.toBeDefined();
  });
});

describe("GET /api/collys — sort injection guard", () => {
  beforeEach(() => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockCollyRow])
      .mockResolvedValueOnce([mockCountRow]);
  });

  it("returns 200 and does not crash for unknown sort column", async () => {
    // safeSort() converts unknown columns to the fallback — route must not 500
    const req = new Request("http://localhost/api/collys?page=1&sort=pwhash&asc=A&pagesize=10&filter=");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });

  it("returns 200 for SQL injection in sort param", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([mockCollyRow])
      .mockResolvedValueOnce([mockCountRow]);
    const req = new Request("http://localhost/api/collys?page=1&sort=1%3BDROP+TABLE+collys--&asc=A&pagesize=10&filter=");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });
});
