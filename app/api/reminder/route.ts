import { NextRequest } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";

function buildToken(userId: number, email: string): string {
  const expiry = Date.now() + 4 * 60 * 60 * 1000;
  const payload = `${userId}|${email}|${expiry}`;
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const raw = `${payload}|${hmac}`;
  return Buffer.from(raw).toString("base64url");
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; spam?: string };
  const { email, spam } = body;

  if (!email) return apiError("E-Mail address is required.", 400);
  if (spam !== "iamnotarobot") return apiError("Spam check failed.", 400);

  const user = await prisma.users.findFirst({ where: { mail: email } });
  if (!user) return apiError("Unknown e-mail address.", 404);

  const token = buildToken(user.id, email);
  const siteRoot = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
  const resetLink = `${siteRoot}/reminder?reset=${token}`;

  const mailHost = process.env.MAILHOST;
  const mailPort = parseInt(process.env.MAILPORT ?? "465", 10);
  const mailUser = process.env.MAILUSER;
  const mailPass = process.env.MAILPASS;
  const mailRoot = process.env.MAILROOT ?? mailUser;

  if (mailHost && mailUser && mailPass) {
    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465,
      auth: { user: mailUser, pass: mailPass },
    });

    await transporter.sendMail({
      from: `"ASCII Arena" <${mailRoot}>`,
      to: email,
      subject: "ASCII Arena - Password Reset",
      text: [
        `Hello ${user.nick},`,
        "",
        "A password reset was requested for your ASCII Arena account.",
        "Click the link below to set a new password (valid for 4 hours):",
        "",
        resetLink,
        "",
        "If you did not request this, ignore this message.",
      ].join("\n"),
    });
  }
  // Always return success — do not leak whether the address exists via timing

  return apiOk({ status: true });
}
