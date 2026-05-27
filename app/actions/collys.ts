"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Prisma } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { broadcastActivityIfAllowed } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export async function trackView(collyId: number) {
  try {
    await prisma.collys.updateMany({ where: { id: collyId }, data: { view_counter: { increment: 1 } } });
  } catch { /* fire-and-forget */ }
}

export async function trackDownload(collyId: number) {
  try {
    await prisma.collys.updateMany({ where: { id: collyId }, data: { downloads: { increment: 1 } } });
    broadcast(`release:${collyId}:downloads`, { type: "downloaded" });
  } catch { /* fire-and-forget */ }
}

export async function addFavourite(collyId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  try {
    const exists = await prisma.favourites.count({ where: { user_id: userId, colly_id: collyId } });
    if (!exists) await prisma.favourites.create({ data: { user_id: userId, colly_id: collyId } });
    const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true, uploader_id: true } });
    if (colly?.filename) {
      revalidatePath(`/release/${colly.filename}`);
      await broadcastActivityIfAllowed(userId, "fav", { type: "fav", nick: session.user.name ?? "", target: colly.filename, targetUrl: `/release/${colly.filename}`, timestamp: Math.floor(Date.now() / 1000) });
    }
    broadcast(`release:${collyId}:fav`, { type: "changed", delta: 1, nick: session.user.name ?? "" });
    if (!exists && colly?.uploader_id && colly.uploader_id !== userId && colly.filename) {
      await createNotification(colly.uploader_id, "notif-fav", {
        actorNick: session.user.name ?? null,
        target: colly.filename,
        targetUrl: `/release/${colly.filename}`,
      });
    }
    revalidatePath(`/member`);
    return { success: true };
  } catch { return { success: false, error: "Failed" }; }
}

export async function removeFavourite(collyId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  try {
    await prisma.favourites.deleteMany({ where: { user_id: userId, colly_id: collyId } });
    const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
    if (colly?.filename) {
      revalidatePath(`/release/${colly.filename}`);
      await broadcastActivityIfAllowed(userId, "unfav", { type: "unfav", nick: session.user.name ?? "", target: colly.filename, targetUrl: `/release/${colly.filename}`, timestamp: Math.floor(Date.now() / 1000) });
    }
    broadcast(`release:${collyId}:fav`, { type: "changed", delta: -1, nick: session.user.name ?? "" });
    revalidatePath(`/member`);
    return { success: true };
  } catch { return { success: false, error: "Failed" }; }
}

export async function reportBroken(collyId: number, comment: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  await prisma.collys.updateMany({
    where: { id: collyId },
    data: { broken: 1, broken_comment: comment },
  });
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
  if (colly?.filename) revalidatePath('/release/' + colly.filename);
  return { success: true };
}

interface Comment { id: number; nick: string; time: string; comment: string | null; rating: number | null; }

export async function getComments(collyId: number): Promise<Comment[]> {
  return prisma.$queryRaw<Comment[]>`
    SELECT c.commentid AS id, u.nick, DATE_FORMAT(FROM_UNIXTIME(c.timestamp), '%Y-%m-%d') AS time,
           c.comment, c.rating
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.colly_id = ${collyId}
    ORDER BY c.timestamp DESC
  `;
}

export async function postComment(
  collyId: number,
  comment: string,
  rating: string | null,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  const nick = session.user.name ?? null;
  const ratingNum = rating ? parseInt(rating) : null;
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true, uploader_id: true } });
  await prisma.$executeRaw`
    INSERT INTO comments (colly_id, user_id, comment, rating, timestamp, filename, nick)
    VALUES (${collyId}, ${userId}, ${comment}, ${ratingNum}, ${Math.floor(Date.now() / 1000)}, ${colly?.filename ?? null}, ${nick})
  `;
  if (colly?.filename) revalidatePath('/release/' + colly.filename);
  broadcast(`comments:${collyId}`, { type: "posted", nick });
  broadcast("site:comments", { type: "posted" });
  if (ratingNum !== null) {
    broadcast("site:votes", {
      type: "vote",
      collyId,
      filename: colly?.filename ?? null,
      rating: ratingNum,
    });
  }
  if (colly?.uploader_id && colly.uploader_id !== userId && colly.filename) {
    await createNotification(colly.uploader_id, "notif-comment", {
      actorNick: nick,
      target: colly.filename,
      targetUrl: `/release/${colly.filename}`,
    });
  }
  return { success: true };
}

export async function editComment(
  collyId: number,
  commentId: number,
  comment: string,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false };
  const userId = Number(session.user.id);
  const isAdmin = session.user.rank === "Admin";
  const where = isAdmin
    ? Prisma.sql`WHERE commentid = ${commentId} AND colly_id = ${collyId}`
    : Prisma.sql`WHERE commentid = ${commentId} AND colly_id = ${collyId} AND user_id = ${userId}`;
  await prisma.$executeRaw`UPDATE comments SET comment = ${comment} ${where}`;
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
  if (colly?.filename) revalidatePath('/release/' + colly.filename);
  broadcast(`comments:${collyId}`, { type: "edited", commentId, comment, nick: session.user.name ?? "" });
  return { success: true };
}

export async function deleteComment(
  collyId: number,
  commentId: number,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false };
  const userId = Number(session.user.id);
  const isAdmin = session.user.rank === "Admin";
  const where = isAdmin
    ? Prisma.sql`WHERE commentid = ${commentId} AND colly_id = ${collyId}`
    : Prisma.sql`WHERE commentid = ${commentId} AND colly_id = ${collyId} AND user_id = ${userId}`;
  await prisma.$executeRaw`DELETE FROM comments ${where}`;
  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
  if (colly?.filename) revalidatePath('/release/' + colly.filename);
  broadcast(`comments:${collyId}`, { type: "deleted", commentId, nick: session.user.name ?? "" });
  return { success: true };
}
