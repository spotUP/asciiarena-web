import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";

const postSchema = z.object({
  comment: z.string().min(1).max(5000),
  filename: z.string().max(255).optional(),
  filedata: z.string().optional(),
});

interface CommentRow {
  comment_id: number;
  request_id: number;
  user_id: number | null;
  comment: string | null;
  attach_filename: string | null;
  timestamp: number | null;
  user: string | null;
}

interface RequestRow {
  requestedby: number | null;
}

function formatTimestamp(ts: number | null): string {
  if (ts == null) return "";
  const d = new Date(ts * 1000);
  const Y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const H = String(d.getHours()).padStart(2, "0");
  const i = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${m}-${day} ${H}:${i}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = parseInt(id);

  const rows = await prisma.$queryRaw<CommentRow[]>`
    SELECT rc.*, u.nick AS user
    FROM request_comments rc
    LEFT JOIN users u ON u.id = rc.user_id
    WHERE rc.request_id = ${requestId}
  `;

  const result = rows.map((r) => ({
    id: r.comment_id,
    user: r.user,
    time: formatTimestamp(r.timestamp),
    comment: r.comment,
    filename: r.attach_filename,
  }));

  return apiOk(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  const requestId = parseInt(id);
  const userId = parseInt(session.user.id);

  const rawBody = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(rawBody);
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);
  const { comment, filename, filedata } = parsed.data;

  await prisma.$executeRaw`
    INSERT INTO request_comments
      (request_id, user_id, comment, attach_filename, attach_filedata, timestamp)
    VALUES
      (${requestId}, ${userId}, ${comment}, ${filename ?? null}, ${filedata ?? null}, UNIX_TIMESTAMP())
  `;

  if (filename && filedata) {
    const reqRows = await prisma.$queryRaw<RequestRow[]>`
      SELECT requestedby FROM requests WHERE id = ${requestId}
    `;
    const authorId = reqRows[0]?.requestedby;

    if (authorId && authorId !== userId) {
      const nick = session.user.name ?? String(userId);
      const subject = `New attachment on your request`;
      const msgtext = `${nick} attached a file (${filename}) to your request #${requestId}.`;

      await prisma.$executeRaw`
        INSERT INTO messages (thread, from_id, to_id, postedto, postername, timestamp, subject, message, \`new\`, unread)
        SELECT IFNULL(MAX(thread) + 1, 1), ${userId}, ${authorId},
               (SELECT nick FROM users WHERE id = ${authorId}),
               (SELECT nick FROM users WHERE id = ${userId}),
               UNIX_TIMESTAMP(), ${subject}, ${msgtext}, 1, 1
        FROM messages
      `;
    }
  }

  broadcast(`requests:${requestId}`, { type: "posted" });

  return apiOk({ status: true });
}
