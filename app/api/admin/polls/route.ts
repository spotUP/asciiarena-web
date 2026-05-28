import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { broadcast } from "@/lib/live";
import { urlsafe } from "@/lib/utils";
import { createBulkNotification } from "@/lib/notifications";
import type { PollType, PollStatus, PollShowResults, PollResultLayout, PollConfig } from "@/lib/polls/types";
import { POLL_TYPES } from "@/lib/polls/types";

const nowSec = () => Math.floor(Date.now() / 1000);

interface CreateBody {
  title: string;
  slug?: string;
  body: string;
  type: PollType;
  status?: PollStatus;
  featured?: boolean;
  opens_at?: number | null;
  closes_at?: number | null;
  config?: PollConfig;
  show_results?: PollShowResults;
  result_layout?: PollResultLayout;
  options: Array<{ label: string; color_idx?: number }>;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number((session as { user: { id: string } }).user.id);

  const body = await req.json() as CreateBody;
  if (!body.title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!POLL_TYPES.includes(body.type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (!Array.isArray(body.options) || body.options.length === 0) {
    return NextResponse.json({ error: "At least one option required" }, { status: 400 });
  }

  const slug = (body.slug?.trim() ? urlsafe(body.slug) : urlsafe(body.title)).slice(0, 96) || `poll-${nowSec()}`;
  const t = nowSec();

  // Enforce featured exclusivity: if this new poll is featured, unfeature
  // any currently-featured poll in the same transaction.
  const created = await prisma.$transaction(async (tx) => {
    if (body.featured) {
      await tx.polls.updateMany({ where: { featured: true }, data: { featured: false } });
    }
    const poll = await tx.polls.create({
      data: {
        slug,
        title: body.title.trim(),
        body: body.body ?? "",
        type: body.type,
        status: body.status ?? "draft",
        featured: !!body.featured,
        created_by_id: userId,
        opens_at: body.opens_at ?? null,
        closes_at: body.closes_at ?? null,
        config: (body.config as unknown as object) ?? undefined,
        show_results: body.show_results ?? "always",
        result_layout: body.result_layout ?? "tail",
        created_at: t,
        updated_at: t,
      },
    });
    await tx.poll_options.createMany({
      data: body.options.map((o, i) => ({
        poll_id: poll.id,
        label: o.label.slice(0, 255),
        color_idx: Math.max(0, Math.min(15, o.color_idx ?? 7)),
        sort_order: i,
        approved: true,
      })),
    });
    return poll;
  });

  broadcast("site:polls", { type: "created", id: created.id, slug: created.slug });

  // Created already-open? Fan out notif-poll immediately. Drafts wait until
  // the admin flips status to "open" in the PATCH handler.
  if (created.status === "open") {
    void createBulkNotification("notif-poll", {
      actorId: userId,
      actorNick: (session as { user: { name?: string } }).user.name ?? null,
      target: created.title,
      targetUrl: `/polls/${created.slug}`,
    });
  }

  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}
