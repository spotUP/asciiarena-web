import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const postSchema = z.object({
  nick: z.string().min(1).max(100),
});

interface ArtistRow {
  id: number;
  nick: string;
  artisturl: string;
  user_id: number | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);
  const userNick = session.user.name ?? "";

  const [linked, suggested] = await Promise.all([
    // Artists already claimed by this user
    prisma.$queryRaw<ArtistRow[]>`
      SELECT id, nick, artisturl, user_id FROM artists WHERE user_id = ${userId}
    `,
    // Artists whose nick matches the user's nick but are unclaimed
    prisma.$queryRaw<ArtistRow[]>`
      SELECT id, nick, artisturl, user_id FROM artists
      WHERE LOWER(nick) = LOWER(${userNick}) AND user_id IS NULL
    `,
  ]);

  return apiOk({ linked, suggested });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = parseInt(session.user.id);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const nick = parsed.data.nick.trim();
  if (!nick) return apiError("nick is required", 400);

  const rows = await prisma.$queryRaw<ArtistRow[]>`
    SELECT id, nick, artisturl, user_id FROM artists WHERE nick = ${nick} LIMIT 1
  `;
  if (!rows[0]) return apiError(`Artist '${nick}' not found`, 404);
  if (rows[0].user_id !== null) return apiError("This artist handle is already claimed", 409);

  await prisma.$executeRaw`
    UPDATE artists SET user_id = ${userId} WHERE id = ${rows[0].id}
  `;

  return apiOk({ status: true });
}
