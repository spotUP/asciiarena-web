"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/live";
import { createNotification } from "@/lib/notifications";

export async function postRequestComment(
  requestId: number,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  const nick = session.user.name ?? "";
  try {
    await prisma.$executeRaw`
      INSERT INTO request_comments (request_id, user_id, comment, timestamp)
      VALUES (${requestId}, ${userId}, ${comment}, ${Math.floor(Date.now() / 1000)})
    `;
  } catch {
    return { success: false, error: "Failed" };
  }
  revalidatePath('/requests/' + requestId);
  broadcast(`requests:${requestId}`, { type: "posted", nick });
  const req = await prisma.requests.findUnique({ where: { id: requestId }, select: { requestedby: true, title: true } });
  if (req?.requestedby && req.requestedby !== userId) {
    await createNotification(req.requestedby, "notif-reply", {
      actorNick: nick,
      target: req.title ?? null,
      targetUrl: `/requests/${requestId}`,
    });
  }
  return { success: true };
}

export async function updateRequestStatus(
  requestId: number,
  status: number,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  const isAdmin = session.user.rank === "Admin";
  const req = await prisma.requests.findUnique({ where: { id: requestId } });
  if (!req) return { success: false, error: "Not found" };
  if (!isAdmin && req.requestedby !== userId) return { success: false, error: "Forbidden" };
  try {
    await prisma.requests.update({ where: { id: requestId }, data: { status } });
  } catch {
    return { success: false, error: "Failed" };
  }
  revalidatePath('/requests');
  revalidatePath('/requests/' + requestId);
  broadcast("site:status", { type: "request-status", id: requestId, status });
  broadcast(`requests:${requestId}`, { type: "status", status });
  if (req.requestedby && req.requestedby !== userId) {
    await createNotification(req.requestedby, "notif-status", {
      actorNick: session.user.name ?? null,
      target: req.title ?? null,
      targetUrl: `/requests/${requestId}`,
      payload: { status },
    });
  }
  return { success: true };
}
