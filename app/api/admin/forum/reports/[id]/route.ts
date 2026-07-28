import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { softDeletePost } from "@/lib/forum/db";
import { setTopicState } from "@/lib/forum/db";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  /** What the admin actually did about it. */
  resolution: z.enum(["dismissed", "deleted", "locked"]),
});

/**
 * Resolve a report. "deleted" and "locked" carry out the action as well as
 * recording it, so the queue is the one place an admin has to touch -- a
 * resolution that only bookkeeps would leave the offending post up.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.rank !== "Admin") return apiError("Forbidden", 403);
  const adminId = Number(session.user.id);

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return apiError("Invalid report", 400);

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request", 400);

  const report = await prisma.forum_reports.findUnique({ where: { id } });
  if (!report) return apiError("That report does not exist", 404);

  if (parsed.data.resolution === "deleted") {
    const post = await prisma.forum_posts.findUnique({
      where: { id: report.post_id },
      select: { deleted_at: true },
    });
    // Already gone: record the resolution without a second soft-delete, which
    // would move deleted_at and re-run the counter repair for nothing.
    if (post && post.deleted_at == null) await softDeletePost(report.post_id, adminId);
  } else if (parsed.data.resolution === "locked") {
    await setTopicState(report.topic_id, { locked: true });
  }

  await prisma.forum_reports.update({
    where: { id },
    data: {
      resolved_at: Math.floor(Date.now() / 1000),
      resolved_by_id: adminId,
      resolution: parsed.data.resolution,
    },
  });

  broadcast("site:moderation", { type: "forum-report-resolved", reportId: id });
  return apiOk({ ok: true });
}
