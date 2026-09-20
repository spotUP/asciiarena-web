import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/activity-types";
import { broadcast } from "@/lib/live";
import { revalidateTag } from "next/cache";
import { buildHmacToken } from "@/lib/hmacToken";
import { isValidPassword, PASSWORD_RULE_TEXT } from "@/lib/accountRules";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Activation links stay valid for 7 days so a user has a comfortable window to
// click through from their welcome email.
const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function sendWelcomeMail(nick: string, mail: string, activationLink: string) {
  const mailHost = process.env.MAILHOST;
  const mailPort = parseInt(process.env.MAILPORT ?? "465", 10);
  const mailUser = process.env.MAILUSER;
  const mailPass = process.env.MAILPASS;
  const mailRoot = process.env.MAILROOT ?? mailUser;

  if (!mailHost || !mailUser || !mailPass) return;

  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailPort === 465,
    auth: { user: mailUser, pass: mailPass },
  });

  await transporter.sendMail({
    from: `"ASCII Arena" <${mailRoot}>`,
    to: mail,
    subject: "Welcome to ASCII Arena - activate your account",
    text: [
      `Hello ${nick},`,
      "",
      "Your ASCII Arena account has been created. Click the link below to",
      "activate it and log in (valid for 7 days):",
      "",
      activationLink,
      "",
      "If you did not create this account, ignore this message.",
      "",
      "- the aSCIIaRENA team",
    ].join("\n"),
  });

  // Notify admin
  if (mailRoot) {
    await transporter.sendMail({
      from: `"ASCII Arena" <${mailRoot}>`,
      to: mailRoot,
      subject: `New registration: ${nick}`,
      text: `New user registered: ${nick} (${mail}). Activation link emailed to the user.`,
    });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
    return apiError("Too many registration attempts. Try again later.", 429);
  }

  const body = (await request.json()) as {
    nick?: string;
    mail?: string;
    password?: string;
    password2?: string;
    activityOptIn?: string[];
    recaptchaToken?: string;
  };

  const { nick, mail, password, password2 } = body;

  // Before anything else, and before any database work: the form rendered a
  // captcha widget that was never loaded and never checked, so the only thing
  // standing between a script and an account was a 3-per-hour IP limit. That is
  // where the spam accounts came from.
  const captcha = await verifyRecaptcha(body.recaptchaToken, ip);
  if (!captcha.ok) {
    return apiError(captcha.error ?? "Captcha check failed.", 400);
  }

  const optInSet = new Set(
    (body.activityOptIn ?? []).filter((t): t is ActivityType =>
      (ACTIVITY_TYPES as readonly string[]).includes(t)
    )
  );
  const activityHiddenTypes = ACTIVITY_TYPES.filter((t) => !optInSet.has(t)).join(",");

  if (!nick || !mail || !password) {
    return apiError("Nick, email and password are required.", 400);
  }

  if (!/^[A-Za-z0-9\-\.#_!^]{2,60}$/.test(nick)) {
    return apiError("Invalid nickname. Use 2-60 characters: letters, digits, - . # _ ! ^", 400);
  }

  if (nick === password) {
    return apiError("Username and password may not be identical.", 400);
  }

  if (password !== password2) {
    return apiError("Passwords do not match.", 400);
  }

  if (!isValidPassword(password)) {
    return apiError(PASSWORD_RULE_TEXT, 400);
  }

  const nickurl = urlsafe(nick);

  // Run all uniqueness checks + bcrypt in parallel before writing anything
  const [nickInArtists, nickInUsers, mailInUsers, nickurlInUsers, pwhash] = await Promise.all([
    prisma.$queryRaw<{ id: number }[]>`SELECT id FROM artists WHERE nick = ${nick} LIMIT 1`,
    prisma.$queryRaw<{ id: number }[]>`SELECT id FROM users WHERE nick = ${nick} LIMIT 1`,
    prisma.$queryRaw<{ id: number }[]>`SELECT id FROM users WHERE mail = ${mail} LIMIT 1`,
    prisma.$queryRaw<{ id: number }[]>`SELECT id FROM users WHERE nickurl = ${nickurl} LIMIT 1`,
    bcrypt.hash(password, 13),
  ]);

  if (nickInArtists.length > 0 || nickInUsers.length > 0) {
    return apiError("Nickname is already in use.", 400);
  }
  if (mailInUsers.length > 0) {
    return apiError("E-mail address is already in use.", 400);
  }
  if (nickurlInUsers.length > 0) {
    return apiError("Nickname is too similar to an existing one. Please choose another.", 400);
  }

  await prisma.$executeRaw`
    INSERT INTO users
      (nick, crew, pwhash, lastactive, joined, current, mail, uploaded, \`rank\`, upload_signature, list_view_mode, display_mail, nickurl, activity_hidden_types)
    VALUES
      (${nick}, 'Independent', ${pwhash}, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), '', ${mail}, 0, 'Inactive',
       '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -', 'standard', '0', ${nickurl}, ${activityHiddenTypes})
  `;

  // Look up the id we just inserted so we can mint the activation token.
  const created = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE nickurl = ${nickurl} LIMIT 1
  `;
  const siteRoot = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
  const activationLink = created[0]
    ? `${siteRoot}/api/activate?token=${buildHmacToken(created[0].id, mail, ACTIVATION_TTL_MS)}`
    : siteRoot;

  // Fire-and-forget — don't fail registration if mail is misconfigured
  sendWelcomeMail(nick, mail, activationLink).catch(() => {});

  broadcast("site:users", { type: "joined", nick });
  revalidateTag("site:stats", "default");

  return apiOk({ status: true }, 201);
}
