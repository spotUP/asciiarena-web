import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeMessageText } from "@/lib/normalizeText";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  postId: z.number().int().positive(),
  reason: z.string().trim().min(3).max(255).transform(normalizeMessageText),
});

/**
 * Report a post to the moderators. One open report per person per post, which
 * the unique key enforces; re-reporting after a resolution is allowed, so the
 * insert upgrades an existing row rather than colliding with it.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);

  const parsed = reportSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Say briefly what is wrong with the post", 400);

  if (!checkRateLimit(`forum:report:${userId}`, 10, 3_600_000)) {
    return apiError("You are reporting too fast. Wait a moment and try again.", 429);
  }

  const post = await prisma.forum_posts.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, topic_id: true, board_id: true, user_id: true, deleted_at: true },
  });
  if (!post || post.deleted_at != null) return apiError("That post does not exist", 404);
  if (post.user_id === userId) return apiError("You cannot report your own post", 400);

  const now = Math.floor(Date.now() / 1000);
  await prisma.forum_reports.upsert({
    where: { post_id_reporter_id: { post_id: post.id, reporter_id: userId } },
    create: {
      post_id: post.id,
      topic_id: post.topic_id,
      board_id: post.board_id,
      reporter_id: userId,
      reason: parsed.data.reason,
      created_at: now,
    },
    // Re-reporting a post whose earlier report was already dealt with reopens
    // it rather than failing on the unique key.
    update: { reason: parsed.data.reason, created_at: now, resolved_at: null, resolved_by_id: null, resolution: null },
  });

  // ModerationBadge already listens here; app/api/admin/moderation-count
  // counts open reports so the number it then fetches includes this one.
  broadcast("site:moderation", { type: "forum-report", postId: post.id });
  return apiOk({ ok: true });
}
