"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function claimArtist(nick: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);

  const artist = await prisma.artists.findFirst({ where: { nick }, select: { id: true, user_id: true } });
  if (!artist) return { success: false, error: `Artist '${nick}' not found` };
  if (artist.user_id !== null) return { success: false, error: "Already claimed" };

  try {
    await prisma.artists.update({ where: { id: artist.id }, data: { user_id: userId } });
  } catch {
    return { success: false, error: "Failed" };
  }
  revalidatePath('/artist', 'layout');
  return { success: true };
}
