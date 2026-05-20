import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validateToken(token: string): { userId: number; email: string } | null {
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
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(providedHmac, "hex"), Buffer.from(expectedHmac, "hex"))) {
    return null;
  }

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) return null;

  return { userId, email };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string;
    password?: string;
    repeatPassword?: string;
  };
  const { token, password, repeatPassword } = body;

  if (!token) return apiError("Reset token is missing.", 400);
  if (!password || !repeatPassword) return apiError("Both password fields are required.", 400);
  if (password !== repeatPassword) return apiError("Passwords do not match.", 400);
  if (!PASSWORD_RE.test(password)) {
    return apiError(
      "Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.",
      400
    );
  }

  const verified = validateToken(token);
  if (!verified) return apiError("Invalid or expired reset link.", 400);

  const pwhash = await bcrypt.hash(password, 13);

  await prisma.users.update({
    where: { id: verified.userId },
    data: { pwhash },
  });

  return apiOk({ status: true });
}
