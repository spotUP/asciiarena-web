import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

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
  crt_effect: number | null;
  anim_effect: number | null;
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
    crt_effect: row.crt_effect,
    anim_effect: row.anim_effect,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = parseInt(session.user.id);
  const body = await request.json() as {
    nick?: string;
    crew?: string;
    byear?: number | null;
    bmonth?: number | null;
    bday?: number | null;
    country?: string;
    mail?: string;
    webpage?: string;
    upload_signature?: string;
    viewmode?: number;
    def_bg_col?: string;
    def_fg_col?: string;
    display_mail?: number;
    def_font?: number;
    crt_effect?: number;
    anim_effect?: number;
    oldpass?: string;
    newpass?: string;
  };

  const {
    nick, crew, byear, bmonth, bday, country, mail, webpage,
    upload_signature, viewmode, def_bg_col, def_fg_col,
    display_mail, def_font, crt_effect, anim_effect,
    oldpass, newpass,
  } = body;

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

  await prisma.$executeRaw`
    UPDATE users SET
      nick = ${nick ?? null},
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
      crt_effect = ${crt_effect ?? null},
      anim_effect = ${anim_effect ?? null}
    WHERE id = ${userId}
  `;

  return apiOk({ status: true });
}
