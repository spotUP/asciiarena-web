import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/activity-types";
import { broadcast } from "@/lib/live";
import { revalidateTag } from "next/cache";

async function sendWelcomeMail(nick: string, mail: string) {
  const mailHost = process.env.MAILHOST;
  const mailPort = parseInt(process.env.MAILPORT ?? "465", 10);
  const mailUser = process.env.MAILUSER;
  const mailPass = process.env.MAILPASS;
  const mailRoot = process.env.MAILROOT ?? mailUser;
  const siteRoot = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";

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
    subject: "Welcome to ASCII Arena",
    text: [
      `Hello ${nick},`,
      "",
      "Your ASCII Arena account has been created and is pending activation.",
      "An admin will review your account shortly.",
      "",
      `In the meantime, visit us at: ${siteRoot}`,
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
      text: `New user registered: ${nick} (${mail})\n\nActivate at: ${siteRoot}/admin#edituser`,
    });
  }
}

function isValidPassword(pw: string): boolean {
  return (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
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
  };

  const { nick, mail, password, password2 } = body;

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

  if (password.length < 6) {
    return apiError("Password is too short (minimum 6 characters).", 400);
  }

  if (!isValidPassword(password)) {
    return apiError(
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
      400
    );
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
      (nick, crew, pwhash, lastactive, current, mail, uploaded, \`rank\`, upload_signature, list_view_mode, display_mail, nickurl, activity_hidden_types)
    VALUES
      (${nick}, 'Independent', ${pwhash}, UNIX_TIMESTAMP(), '', ${mail}, 0, 'Inactive',
       '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -', 0, 0, ${nickurl}, ${activityHiddenTypes})
  `;

  // Fire-and-forget — don't fail registration if mail is misconfigured
  sendWelcomeMail(nick, mail).catch(() => {});

  broadcast("site:users", { type: "joined", nick });
  revalidateTag("site:stats", "default");

  return apiOk({ status: true }, 201);
}
