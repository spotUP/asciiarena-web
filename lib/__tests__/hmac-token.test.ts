import { describe, it, expect, beforeAll } from "vitest";
import { buildHmacToken, validateHmacToken } from "@/lib/hmacToken";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-hmac-tokens";
});

describe("hmacToken", () => {
  it("round-trips a freshly minted token back to its userId and email", () => {
    const token = buildHmacToken(42, "user@example.com", 60_000);
    expect(validateHmacToken(token)).toEqual({ userId: 42, email: "user@example.com" });
  });

  it("rejects an expired token", () => {
    const token = buildHmacToken(42, "user@example.com", -1);
    expect(validateHmacToken(token)).toBeNull();
  });

  it("rejects a token whose signature was tampered with", () => {
    const token = buildHmacToken(42, "user@example.com", 60_000);
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    parts[0] = "999"; // change the userId but keep the old signature
    const forged = Buffer.from(parts.join("|")).toString("base64url");
    expect(validateHmacToken(forged)).toBeNull();
  });

  it("rejects malformed garbage", () => {
    expect(validateHmacToken("not-a-token")).toBeNull();
    expect(validateHmacToken("")).toBeNull();
  });

  it("is signed with the secret — a different secret does not validate", () => {
    const token = buildHmacToken(1, "a@b.c", 60_000);
    process.env.NEXTAUTH_SECRET = "a-different-secret";
    expect(validateHmacToken(token)).toBeNull();
    process.env.NEXTAUTH_SECRET = "test-secret-for-hmac-tokens";
  });
});
