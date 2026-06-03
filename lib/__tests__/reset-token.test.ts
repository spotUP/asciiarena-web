import { describe, it, expect } from "vitest";
import { hashResetToken } from "@/lib/resetToken";

describe("hashResetToken", () => {
  // The bug: a SHA-256 hex digest is 64 chars and overflows users.temp_pw_hash
  // (CHAR(60)), so Prisma rejects the reset write with P2000 and no email is
  // ever sent. The hash must fit in 60 chars.
  it("fits within the CHAR(60) temp_pw_hash column", () => {
    const token = Buffer.from("123|user@example.com|9999999999999|deadbeef").toString("base64url");
    expect(hashResetToken(token).length).toBeLessThanOrEqual(60);
  });

  it("rejects the previous 64-char hex encoding that overflowed the column", () => {
    // Guards against regressing back to digest('hex'), which is exactly 64 chars.
    expect(hashResetToken("any-token").length).not.toBe(64);
  });

  it("is deterministic so the stored and recomputed hashes match", () => {
    expect(hashResetToken("token-abc")).toBe(hashResetToken("token-abc"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashResetToken("token-a")).not.toBe(hashResetToken("token-b"));
  });
});
