"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function claimArtist(nick: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);

  const artist = await prisma.artists.findFirst({ where: { nick }, select: { id: true, user_id: true } });
  if (!artist) return { success: false, error: `Artist '${nick}' not found` };
  if (artist.user_id !== null) return { success: false, error: "Already claimed" };

  const affected = await prisma.$executeRaw(
    Prisma.sql`UPDATE artists SET user_id = ${userId} WHERE id = ${artist.id} AND user_id IS NULL`
  );
  if (Number(affected) === 0) return { success: false, error: "Already claimed" };
  revalidatePath('/artist', 'layout');
  return { success: true };
}
