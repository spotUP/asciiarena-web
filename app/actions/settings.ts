"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { urlsafe } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export interface Settings {
  nick: string | null;
  crew: string | null;
  byear: number | null;
  bmonth: number | null;
  bday: number | null;
  country: string | null;
  mail: string | null;
  webpage: string | null;
  upload_signature: string | null;
  viewmode: number | null;
  def_bg_col: string | null;
  def_fg_col: string | null;
  display_mail: number | null;
  def_font: string | null;
  crt_effect: number | null;
  anim_effect: number | null;
}

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
  def_font: string | null;
  crt_effect: string | null;
  anim_effect: string | null;
}

function isValidPassword(pw: string): boolean {
  return (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

export async function getInitialSettings(): Promise<Settings | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const userId = parseInt(session.user.id);

  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT nick, crew, byear, bmonth, bday, country, mail, webpage,
           upload_signature, list_view_mode, def_bg_col, def_fg_col,
           display_mail, def_font, crt_effect, anim_effect
    FROM users WHERE id = ${userId}
  `;

  const row = rows[0];
  if (!row) return null;

  return {
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
  };
}

export async function saveSettings(
  _prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };

  const userId = parseInt(session.user.id);

  const nick = (formData.get("nick") as string) || null;
  const crew = (formData.get("crew") as string) || null;
  const byearRaw = formData.get("byear") as string;
  const bmonthRaw = formData.get("bmonth") as string;
  const bdayRaw = formData.get("bday") as string;
  const countryRaw = (formData.get("country") as string) || null;
  const mail = (formData.get("mail") as string) || null;
  const webpage = (formData.get("webpage") as string) || null;
  const upload_signature = (formData.get("upload_signature") as string) || null;
  const viewmodeRaw = formData.get("viewmode") as string;
  const def_bg_col = (formData.get("def_bg_col") as string) || null;
  const def_fg_col = (formData.get("def_fg_col") as string) || null;
  const display_mailRaw = formData.get("display_mail") as string | null;
  const def_fontRaw = formData.get("def_font") as string;
  const crt_effectRaw = formData.get("crt_effect") as string | null;
  const anim_effectRaw = formData.get("anim_effect") as string | null;

  // Numeric columns (byear/bmonth/bday are Int, country is SmallInt). Guard
  // against NaN so a non-numeric value can never crash the whole UPDATE.
  const toIntOrNull = (v: string | null): number | null => {
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const byear = toIntOrNull(byearRaw);
  const bmonth = toIntOrNull(bmonthRaw);
  const bday = toIntOrNull(bdayRaw);
  const country = toIntOrNull(countryRaw);
  // list_view_mode (Char 8) and def_font (Char 32) are STRING columns, not
  // ints — store the raw value. (parseInt here yielded NaN for "standard" or a
  // font name like "Topaz_a1200" and threw on UPDATE.)
  const viewmode = viewmodeRaw || null;
  const def_font = def_fontRaw || null;
  const display_mail = display_mailRaw === "1" ? 1 : 0;
  const crt_effect = crt_effectRaw === "1" ? 1 : 0;
  const anim_effect = anim_effectRaw === "1" ? 1 : 0;

  const nickurl = nick ? urlsafe(nick) : null;

  if (nick) {
    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM users WHERE nick = ${nick} AND id != ${userId} LIMIT 1
    `;
    if (existing.length > 0) return { success: false, error: "Nickname is already in use." };
    if (nickurl) {
      const existingUrl = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM users WHERE nickurl = ${nickurl} AND id != ${userId} LIMIT 1
      `;
      if (existingUrl.length > 0)
        return { success: false, error: "Nickname conflicts with an existing profile URL." };
    }
  }

  const crtVal = crt_effect === 1 ? "Y" : "N";
  const animVal = anim_effect === 1 ? "Y" : "N";

  try {
    await prisma.$executeRaw`
      UPDATE users SET
        nick = ${nick},
        nickurl = COALESCE(${nickurl}, nickurl),
        crew = ${crew},
        byear = ${byear},
        bmonth = ${bmonth},
        bday = ${bday},
        country = ${country},
        mail = ${mail},
        webpage = ${webpage},
        upload_signature = ${upload_signature},
        list_view_mode = ${viewmode},
        def_bg_col = ${def_bg_col},
        def_fg_col = ${def_fg_col},
        display_mail = ${display_mail},
        def_font = ${def_font},
        crt_effect = ${crtVal},
        anim_effect = ${animVal}
      WHERE id = ${userId}
    `;
    // No user:profile broadcast here: it forced a full router.refresh on every
    // auto-save (the jarring black modem-redraw "blink"). crt/anim live updates
    // are handled by their own /api/settings/display endpoint.
    return { success: true };
  } catch {
    return { success: false, error: "An error occurred saving your settings." };
  }
}

export async function changePassword(
  _prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };

  const userId = parseInt(session.user.id);

  const oldpass = (formData.get("oldpass") as string) || "";
  const newpass = (formData.get("newpass") as string) || "";
  const repeatpass = (formData.get("repeatpass") as string) || "";

  if (!oldpass) return { success: false, error: "You must enter your old password to change it." };
  if (!newpass) return { success: false, error: "You have not specified a new password." };
  if (newpass !== repeatpass) return { success: false, error: "New passwords do not match." };

  if (!isValidPassword(newpass)) {
    return {
      success: false,
      error: "Password must include uppercase, lowercase, a number, and a special character.",
    };
  }

  const hashRows = await prisma.$queryRaw<{ pwhash: string | null }[]>`
    SELECT pwhash FROM users WHERE id = ${userId}
  `;
  const stored = hashRows[0]?.pwhash;
  if (!stored) return { success: false, error: "User not found." };

  let valid = false;
  if (stored.startsWith("$2")) {
    valid = await bcrypt.compare(oldpass, stored);
  } else {
    valid = createHash("md5").update(oldpass).digest("hex") === stored;
  }

  if (!valid) return { success: false, error: "Old password is incorrect." };

  const newHash = await bcrypt.hash(newpass, 13);
  await prisma.$executeRaw`
    UPDATE users SET pwhash = ${newHash} WHERE id = ${userId}
  `;

  return { success: true };
}
