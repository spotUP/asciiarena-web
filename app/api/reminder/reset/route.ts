import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";
import { hashResetToken } from "@/lib/resetToken";
import { validateHmacToken } from "@/lib/hmacToken";
import { isValidPassword, PASSWORD_RULE_TEXT } from "@/lib/accountRules";

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
  if (!isValidPassword(password)) {
    return apiError(PASSWORD_RULE_TEXT, 400);
  }

  const verified = validateHmacToken(token);
  if (!verified) return apiError("Invalid or expired reset link.", 400);

  // Verify the token hash matches what was stored and hasn't been used yet
  const tokenHash = hashResetToken(token);
  const user = await prisma.users.findUnique({
    where: { id: verified.userId },
    select: { temp_pw_hash: true },
  });
  if (!user?.temp_pw_hash || user.temp_pw_hash !== tokenHash) {
    return apiError("Reset link has already been used or is invalid.", 400);
  }

  const pwhash = await bcrypt.hash(password, 13);

  // Update password and clear the one-time token
  await prisma.users.update({
    where: { id: verified.userId },
    data: { pwhash, temp_pw_hash: null },
  });

  return apiOk({ status: true });
}
