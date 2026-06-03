import crypto from "crypto";

// Hash for the one-time password-reset token, stored in users.temp_pw_hash.
//
// That column is CHAR(60). A SHA-256 *hex* digest is 64 chars and overflows it,
// so Prisma rejects the write with P2000 ("value too long for column") and the
// reset silently produces no email. Encoding the same digest as base64url is 43
// chars — it fits comfortably while preserving the full 256 bits of entropy.
//
// Both the reminder route (which stores the hash) and the reset route (which
// recomputes and compares it) MUST use this single helper, or the stored and
// recomputed values will never match.
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("base64url");
}
