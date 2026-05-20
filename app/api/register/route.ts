import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiOk, urlsafe } from "@/lib/utils";
import bcrypt from "bcryptjs";

function isValidPassword(pw: string): boolean {
  return (
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    nick?: string;
    mail?: string;
    password?: string;
    password2?: string;
  };

  const { nick, mail, password, password2 } = body;

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

  // Check nick not already taken in artists or users tables
  const existingNickInArtists = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM artists WHERE nick = ${nick} LIMIT 1
  `;
  if (existingNickInArtists.length > 0) {
    return apiError("Nickname is already in use.", 400);
  }

  const existingNickInUsers = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE nick = ${nick} LIMIT 1
  `;
  if (existingNickInUsers.length > 0) {
    return apiError("Nickname is already in use.", 400);
  }

  const existingMail = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE mail = ${mail} LIMIT 1
  `;
  if (existingMail.length > 0) {
    return apiError("E-mail address is already in use.", 400);
  }

  const pwhash = await bcrypt.hash(password, 13);
  const nickurl = urlsafe(nick);

  await prisma.$executeRaw`
    INSERT INTO users
      (nick, crew, pwhash, lastactive, current, mail, uploaded, \`rank\`, upload_signature, list_view_mode, display_mail, nickurl)
    VALUES
      (${nick}, 'Independent', ${pwhash}, UNIX_TIMESTAMP(), '', ${mail}, 0, 'Inactive',
       '- -- - aSCIIaRENa - ---- - aSCIIaRENa - -- -', 0, 0, ${nickurl})
  `;

  return apiOk({ status: true }, 201);
}
