import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateHmacToken } from "@/lib/hmacToken";
import { INACTIVE_RANK, ACTIVE_RANK } from "@/lib/accountRules";

// One-click account activation reached from the welcome email. Validates the
// HMAC token, flips the account from Inactive to Member, and redirects to the
// friendly /activate result page. Idempotent: a second click on an already
// activated account reports "already active" rather than erroring.
export async function GET(request: NextRequest) {
  const siteRoot = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
  const result = (status: string) => NextResponse.redirect(`${siteRoot}/activate?status=${status}`);

  const token = request.nextUrl.searchParams.get("token");
  if (!token) return result("invalid");

  const verified = validateHmacToken(token);
  if (!verified) return result("invalid");

  const user = await prisma.users.findUnique({
    where: { id: verified.userId },
    select: { rank: true, mail: true },
  });
  // The token binds a userId to the email it was sent to; both must still match.
  if (!user || (user.mail ?? "") !== verified.email) return result("invalid");

  if (user.rank !== INACTIVE_RANK) return result("already");

  await prisma.users.update({
    where: { id: verified.userId },
    data: { rank: ACTIVE_RANK },
  });

  return result("ok");
}
