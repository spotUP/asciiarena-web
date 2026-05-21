import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const patchSchema = z.object({
  nick: z.string().min(1).max(50).optional(),
  crew: z.string().max(100).optional(),
  byear: z.number().int().nullable().optional(),
  bmonth: z.number().int().nullable().optional(),
  bday: z.number().int().nullable().optional(),
  country: z.string().max(100).optional(),
  mail: z.string().max(255).optional(),
  webpage: z.string().max(500).optional(),
  upload_signature: z.string().max(1000).optional(),
  viewmode: z.number().int().optional(),
  def_bg_col: z.string().max(20).optional(),
  def_fg_col: z.string().max(20).optional(),
  display_mail: z.number().int().optional(),
  def_font: z.number().int().optional(),
  crt_effect: z.number().int().optional(),
  anim_effect: z.number().int().optional(),
  oldpass: z.string().optional(),
  newpass: z.string().optional(),
});

interface UserRow {
  nick: string | null;
  crew: string | null;
  byear: number | null;
  bmonth: number | null;
  bday: number | null;
  country: string | null;
  mail: string | null;
  webpage: string | null;
  upload_signature: string | null;
  list_view_mode: number | null;
  def_bg_col: string | null;
  def_fg_col: string | null;
  display_mail: number | null;
  def_font: number | null;
  crt_effect: string | null;
  anim_effect: string | null;
  pwhash: string | null;
}

function isValidPassword(pw: string): boolean {
  return (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT nick, crew, byear, bmonth, bday, country, mail, webpage,
           upload_signature, list_view_mode, def_bg_col, def_fg_col,
           display_mail, def_font, crt_effect, anim_effect
    FROM users WHERE id = ${userId}
  `;

  const row = rows[0];
  if (!row) return apiError("Not found", 404);

  return apiOk({
    nick: row.nick,
    crew: row.crew,
    byear: row.byear,
    bmonth: row.bmonth,
    bday: row.bday,
    country: row.country,
    mail: row.mail,
    webpage: row.webpage,
    upload_signature: row.upload_signature,
    viewmode: row.list_view_mode,
    def_bg_col: row.def_bg_col,
    def_fg_col: row.def_fg_col,
    display_mail: row.display_mail,
    def_font: row.def_font,
    crt_effect: row.crt_effect === "Y" ? 1 : 0,
    anim_effect: row.anim_effect === "Y" ? 1 : 0,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);
  const rawBody = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  const {
    nick, crew, byear, bmonth, bday, country, mail, webpage,
    upload_signature, viewmode, def_bg_col, def_fg_col,
    display_mail, def_font, crt_effect, anim_effect,
    oldpass, newpass,
  } = parsed.data;

  if (newpass) {
    if (!oldpass) return apiError("Old password required to set new password", 400);

    const hashRows = await prisma.$queryRaw<{ pwhash: string | null }[]>`
      SELECT pwhash FROM users WHERE id = ${userId}
    `;
    const stored = hashRows[0]?.pwhash;
    if (!stored) return apiError("User not found", 404);

    let valid = false;
    if (stored.startsWith("$2")) {
      valid = await bcrypt.compare(oldpass, stored);
    } else {
      // Legacy MD5 check
      valid = createHash("md5").update(oldpass).digest("hex") === stored;
    }

    if (!valid) return apiError("Old password is incorrect", 400);

    if (!isValidPassword(newpass)) {
      return apiError(
        "New password must contain uppercase, lowercase, a digit, and a special character",
        400
      );
    }

    const newHash = await bcrypt.hash(newpass, 13);
    await prisma.$executeRaw`
      UPDATE users SET pwhash = ${newHash} WHERE id = ${userId}
    `;
  }

  const nickurl = nick ? urlsafe(nick) : null;

  // Validate nick uniqueness if changing nick
  if (nick) {
    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM users WHERE nick = ${nick} AND id != ${userId} LIMIT 1
    `;
    if (existing.length > 0) return apiError("Nickname is already in use.", 409);
    if (nickurl) {
      const existingUrl = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM users WHERE nickurl = ${nickurl} AND id != ${userId} LIMIT 1
      `;
      if (existingUrl.length > 0) return apiError("Nickname conflicts with an existing profile URL.", 409);
    }
  }

  const crtVal = crt_effect != null ? (crt_effect === 1 ? "Y" : "N") : null;
  const animVal = anim_effect != null ? (anim_effect === 1 ? "Y" : "N") : null;

  await prisma.$executeRaw`
    UPDATE users SET
      nick = ${nick ?? null},
      nickurl = COALESCE(${nickurl}, nickurl),
      crew = ${crew ?? null},
      byear = ${byear ?? null},
      bmonth = ${bmonth ?? null},
      bday = ${bday ?? null},
      country = ${country ?? null},
      mail = ${mail ?? null},
      webpage = ${webpage ?? null},
      upload_signature = ${upload_signature ?? null},
      list_view_mode = ${viewmode ?? null},
      def_bg_col = ${def_bg_col ?? null},
      def_fg_col = ${def_fg_col ?? null},
      display_mail = ${display_mail ?? null},
      def_font = ${def_font ?? null},
      crt_effect = COALESCE(${crtVal}, crt_effect),
      anim_effect = COALESCE(${animVal}, anim_effect)
    WHERE id = ${userId}
  `;

  return apiOk({ status: true });
}
