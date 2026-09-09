import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    collys: { findFirst: vi.fn(), count: vi.fn() },
    colly_logos: { count: vi.fn() },
    comments: { count: vi.fn() },
    artists_collys: { findMany: vi.fn() },
    collys_crews: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/generated/prisma/client", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    raw: (s: string) => s,
    join: (vals: unknown[]) => vals,
  },
}));

vi.mock("@/lib/collyText", () => ({
  readCollyText: vi.fn().mockReturnValue("line0\nlogo here\nline2"),
}));

import { parsePagination, parseQuery, sliceLogoText, v1Envelope } from "@/lib/api-v1";
import { checkV1RateLimit, resetV1RateLimit } from "@/lib/api-v1-rate-limit";
import { buildOpenApi } from "@/lib/api-v1-openapi";
import { GET as LogosGET } from "@/app/api/v1/logos/route";
import { GET as StatusGET } from "@/app/api/v1/status/route";
import { GET as SearchGET } from "@/app/api/v1/search/route";
import { prisma } from "@/lib/db";

function req(url: string): Request {
  return new Request(url) as unknown as never as Request;
}

describe("v1 pagination + query parsing", () => {
  it("clamps per_page to 1..100 and accepts pagesize alias", () => {
    const sp = new URLSearchParams("page=0&pagesize=500");
    expect(parsePagination(sp as never).perPage).toBe(100);
    expect(parsePagination(sp as never).page).toBe(1);
  });

  it("reads q/filter/query aliases and trims", () => {
    expect(parseQuery(new URLSearchParams("filter=spot") as never)).toBe("spot");
    expect(parseQuery(new URLSearchParams("query=+x+") as never)).toBe("x");
  });

  it("builds a chatbot-friendly envelope", () => {
    const env = v1Envelope([1, 2], 2, 25, 51);
    expect(env.meta).toEqual({ page: 2, per_page: 25, total: 51, total_pages: 3 });
  });
});

describe("v1 rate limiter", () => {
  it("allows 120 requests then blocks with 429 shape", () => {
    resetV1RateLimit();
    let last = checkV1RateLimit("test-ip", 1000);
    for (let i = 1; i < 120; i++) last = checkV1RateLimit("test-ip", 1000 + i);
    expect(last.allowed).toBe(true);
    const blocked = checkV1RateLimit("test-ip", 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // next window allows again
    expect(checkV1RateLimit("test-ip", 1000 + 60_001).allowed).toBe(true);
  });
});

describe("sliceLogoText mirrors the gallery slicer", () => {
  const text = ["intro", "", "  ___", " /__/ ", "", "next"].join("\n");
  it("slices exact range and trims blank edges", () => {
    expect(sliceLogoText(text, 2, 4)).toEqual(["  ___", " /__/ "]);
  });
  it("falls back to a preview window when end is null", () => {
    const out = sliceLogoText(text, 2, null);
    expect(out[0]).toBe("  ___");
    expect(out.length).toBeGreaterThan(0);
  });
  it("rejects logos by an artist via the logos endpoint", async () => {
    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ cnt: BigInt(0) }]);
    const res = await LogosGET(req("http://localhost/api/v1/logos?artist=spot&per_page=10") as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[]; meta: { total: number } };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.total).toBe(0);
  });
});

describe("GET /api/v1/status", () => {
  it("returns version + endpoint index for bots", async () => {
    resetV1RateLimit();
    const res = await StatusGET(req("http://localhost/api/v1/status") as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { version: string; endpoints: string[] } };
    expect(body.data.version).toBe("1.0.0");
    expect(body.data.endpoints).toContain("GET /api/v1/logos");
    expect(body.data.endpoints).toContain("GET /api/v1/collys/:id/logos");
  });
});

describe("GET /api/v1/search rejects short queries", () => {
  it("returns 400 for a 1-char query", async () => {
    resetV1RateLimit();
    const res = await SearchGET(req("http://localhost/api/v1/search?q=x") as never);
    expect(res.status).toBe(400);
  });
});

describe("OpenAPI spec", () => {
  it("lists every v1 route bots need", () => {
    const spec = buildOpenApi() as { paths: Record<string, unknown> };
    for (const p of [
      "/api/v1/collys",
      "/api/v1/collys/{id}/logos",
      "/api/v1/logos",
      "/api/v1/logos/{id}",
      "/api/v1/artists",
      "/api/v1/crews",
      "/api/v1/search",
      "/api/v1/stats",
      "/api/v1/openapi",
    ]) {
      expect(spec.paths[p], p).toBeDefined();
    }
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
