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

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("$2b$13$newhash"),
  },
}));

import { GET, PATCH } from "@/app/api/settings/route";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

const mockSession = {
  user: { id: "1", name: "spot", rank: null, crew: null },
  expires: "2099-01-01",
};

describe("GET /api/settings", () => {
  it("returns 401 without auth", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(new Request("http://localhost/api/settings") as never);
    expect(res.status).toBe(401);
  });

  it("returns user settings when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{
      nick: "spot", crew: "UR", byear: 1990, bmonth: 5, bday: 1,
      country: 0, mail: "test@test.com", webpage: "", upload_signature: "",
      list_view_mode: "Standard", def_bg_col: "#000", def_fg_col: "#fff",
      display_mail: "N", def_font: "mOsOul", crt_effect: "Y", anim_effect: "N",
    }]);
    const res = await GET(new Request("http://localhost/api/settings") as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { nick: string };
    expect(data.nick).toBe("spot");
  });
});

describe("PATCH /api/settings — password change", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ pwhash: "$2b$13$existinghash" }]);
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1);
  });

  it("rejects weak new password", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldpass: "OldPass1!", newpass: "tooweak" }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/password/i);
  });

  it("rejects wrong old password", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldpass: "WrongPass1!", newpass: "NewPass123!" }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain("incorrect");
  });

  it("accepts valid password change", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    // pwhash query first, then nick uniqueness → no conflict, nickurl uniqueness → no conflict
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ pwhash: "$2b$13$existinghash" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldpass: "OldPass1!",
        newpass: "NewPass123!",
        nick: "spot", crew: "", byear: 1990, bmonth: 5, bday: 1,
        country: 0, mail: "", webpage: "", upload_signature: "",
        viewmode: "Standard", def_bg_col: "#000", def_fg_col: "#fff",
        display_mail: "N", def_font: "mOsOul", crt_effect: "Y", anim_effect: "N",
      }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith("NewPass123!", 13);
  });
});
