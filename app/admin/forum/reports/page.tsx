import { prisma } from "@/lib/db";
import ReportsClient, { type ReportRow } from "@/app/admin/forum/reports/ReportsClient";
import { topicSlug } from "@/lib/forum/slug";

export const dynamic = "force-dynamic";

const EXCERPT = 400;

export default async function AdminForumReports() {
  const reports = await prisma.forum_reports.findMany({
    where: { resolved_at: null },
    orderBy: { created_at: "asc" },
    take: 100,
  });

  let rows: ReportRow[] = [];
  if (reports.length > 0) {
    const [posts, topics, boards, users] = await Promise.all([
      prisma.forum_posts.findMany({
        where: { id: { in: reports.map(r => r.post_id) } },
        select: { id: true, body: true, user_id: true, deleted_at: true },
      }),
      prisma.forum_topics.findMany({
        where: { id: { in: reports.map(r => r.topic_id) } },
        select: { id: true, title: true, slug: true, board_id: true, locked: true },
      }),
      prisma.forum_boards.findMany({ select: { id: true, slug: true } }),
      prisma.users.findMany({
        where: { id: { in: reports.map(r => r.reporter_id) } },
        select: { id: true, nick: true },
      }),
    ]);

    const postById = new Map(posts.map(p => [p.id, p]));
    const topicById = new Map(topics.map(t => [t.id, t]));
    const boardSlugById = new Map(boards.map(b => [b.id, b.slug]));
    const nickById = new Map(users.map(u => [u.id, u.nick]));
    // Post authors are a separate lookup: they are not the reporters.
    const authors = await prisma.users.findMany({
      where: { id: { in: posts.map(p => p.user_id) } },
      select: { id: true, nick: true },
    });
    for (const a of authors) nickById.set(a.id, a.nick);

    rows = reports.flatMap(r => {
      const post = postById.get(r.post_id);
      const topic = topicById.get(r.topic_id);
      const boardSlug = topic ? boardSlugById.get(topic.board_id) : undefined;
      if (!post || !topic || !boardSlug) return [];
      // The stored slug is authoritative; recompute only if a row predates it.
      const slug = topic.slug || topicSlug(topic.title, topic.id);
      return [
        {
          id: r.id,
          reason: r.reason,
          createdAt: r.created_at,
          reporterNick: nickById.get(r.reporter_id) ?? null,
          authorNick: nickById.get(post.user_id) ?? null,
          postId: post.id,
          postExcerpt: post.body.slice(0, EXCERPT),
          postDeleted: post.deleted_at != null,
          topicTitle: topic.title,
          topicLocked: topic.locked,
          href: `/forum/${boardSlug}/${slug}#p${post.id}`,
        },
      ];
    });
  }

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">FORUM REPORTS</h2>
      </div>
      <ReportsClient reports={rows} />
    </>
  );
}
