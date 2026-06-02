"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addPlaylist(data: {
  title: string;
  filename: string;
  author?: string;
  genre?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (session?.user?.rank !== "Admin") return { success: false, error: "Forbidden" };
  await prisma.$executeRaw`
    INSERT INTO hippo_playlists (title, author, genre, filename, uploaddate)
    VALUES (${data.title}, ${data.author ?? ""}, ${data.genre ?? ""}, ${data.filename}, UNIX_TIMESTAMP())
  `;
  revalidatePath('/playlists');
  return { success: true };
}

export async function deletePlaylist(id: number): Promise<{ success: boolean }> {
  const session = await getSession();
  if (session?.user?.rank !== "Admin") return { success: false };
  await prisma.$executeRaw`DELETE FROM hippo_playlists WHERE id = ${id}`;
  revalidatePath('/playlists');
  return { success: true };
}
