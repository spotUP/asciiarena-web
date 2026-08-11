import { z } from "zod";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { isValidPassword, PASSWORD_RULE_TEXT } from "@/lib/accountRules";

const patchSchema = z.object({
  id: z.number().int().positive(),
  rank: z.string().max(50).optional(),
  crew: z.string().max(100).optional(),
  password: z.string().max(200).optional(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


export async function GET(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q) return apiOk([]);

  const like = `%${q}%`;
  const rows = await prisma.$queryRaw<{ id: number; nick: string; nickurl: string; rank: string | null; crew: string | null; mail: string | null }[]>`
    SELECT id, nick, nickurl, \`rank\`, crew, mail FROM users
    WHERE nick LIKE ${like} ORDER BY nick ASC LIMIT 30
  `;
  return apiOk(rows);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawPatchBody = await request.json().catch(() => ({}));
  const patchParsed = patchSchema.safeParse(rawPatchBody);
  if (!patchParsed.success) return apiError("Invalid request: " + patchParsed.error.issues[0]?.message, 400);
  const body = patchParsed.data;

  if (body.password !== undefined) {
    if (!isValidPassword(body.password)) return apiError(PASSWORD_RULE_TEXT, 400);
    const pwhash = await bcrypt.hash(body.password, 13);
    // temp_pw_hash is the one-time reset-link token; a stale link must not be
    // able to overwrite the password the admin just set.
    await prisma.$executeRaw`
      UPDATE users SET pwhash = ${pwhash}, temp_pw_hash = NULL WHERE id = ${body.id}
    `;
    return apiOk({ status: true });
  }

  await prisma.$executeRaw`
    UPDATE users SET
      \`rank\` = COALESCE(${body.rank ?? null}, \`rank\`),
      crew = COALESCE(${body.crew ?? null}, crew)
    WHERE id = ${body.id}
  `;
  return apiOk({ status: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);
  const body = deleteParsed.data;

  await prisma.$executeRaw`DELETE FROM users WHERE id = ${body.id}`;
  return apiOk({ status: true });
}
