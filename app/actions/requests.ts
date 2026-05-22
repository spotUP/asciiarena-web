"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function postRequestComment(
  requestId: number,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not logged in" };
  const userId = Number(session.user.id);
  try {
    await prisma.$executeRaw`
      INSERT INTO request_comments (request_id, user_id, comment, timestamp)
      VALUES (${requestId}, ${userId}, ${comment}, ${Math.floor(Date.now() / 1000)})
    `;
  } catch {
    return { success: false, error: "Failed" };
  }
  revalidatePath('/requests/' + requestId);
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
  return { success: true };
}
