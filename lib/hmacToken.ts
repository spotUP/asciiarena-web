import crypto from "crypto";

// Self-validating, time-bounded HMAC token used for links we email to a user
// (password reset, account activation). The token proves the holder controls
// the email address without any server-side session.
//
// Encoding: base64url( `${userId}|${email}|${expiryMs}|${hmac}` )
// where hmac = HMAC-SHA256(NEXTAUTH_SECRET, `${userId}|${email}|${expiryMs}`).
//
// This is the single source of truth for both minting and validating those
// tokens — the reminder (reset) and activation flows MUST share it, or a stored
// value minted by one will never validate in the other.

const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000; // 4h

export function buildHmacToken(userId: number, email: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const expiry = Date.now() + ttlMs;
  const payload = `${userId}|${email}|${expiry}`;
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${hmac}`).toString("base64url");
}

export function validateHmacToken(token: string): { userId: number; email: string } | null {
  let raw: string;
  try {
    raw = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = raw.split("|");
  if (parts.length !== 4) return null;

  const [userIdStr, email, expiryStr, providedHmac] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;

  const payload = `${userIdStr}|${email}|${expiryStr}`;
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  let providedBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    providedBuf = Buffer.from(providedHmac, "hex");
    expectedBuf = Buffer.from(expectedHmac, "hex");
  } catch {
    return null;
  }
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) return null;

  return { userId, email };
}
