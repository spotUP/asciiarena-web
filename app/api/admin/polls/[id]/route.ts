import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { broadcast } from "@/lib/live";
import { urlsafe } from "@/lib/utils";
import type { PollType, PollStatus, PollShowResults, PollResultLayout, PollConfig } from "@/lib/polls/types";
import { POLL_TYPES } from "@/lib/polls/types";

const nowSec = () => Math.floor(Date.now() / 1000);

interface PatchBody {
  title?: string;
  slug?: string;
  type?: PollType;
  body?: string;
  status?: PollStatus;
  featured?: boolean;
  opens_at?: number | null;
  closes_at?: number | null;
  config?: PollConfig;
  show_results?: PollShowResults;
  result_layout?: PollResultLayout;
  options?: Array<{ id?: number; label: string; color_idx?: number; sort_order?: number }>;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const body = await req.json() as PatchBody;
  const t = nowSec();

  const existing = await prisma.polls.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
    if (body.featured === true && !existing.featured) {
      await tx.polls.updateMany({
        where: { featured: true, NOT: { id } },
        data: { featured: false },
      });
    }
    const data: Record<string, unknown> = { updated_at: t };
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.slug !== undefined) {
      const next = (body.slug.trim() ? urlsafe(body.slug) : urlsafe(body.title ?? existing.title)).slice(0, 96);
      if (next.length > 0 && next !== existing.slug) data.slug = next;
    }
    if (body.type !== undefined) {
      if (!POLL_TYPES.includes(body.type)) throw new Error("invalid_type");
      data.type = body.type;
    }
    if (body.body !== undefined) data.body = body.body;
    if (body.status !== undefined) data.status = body.status;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.opens_at !== undefined) data.opens_at = body.opens_at;
    if (body.closes_at !== undefined) data.closes_at = body.closes_at;
    if (body.config !== undefined) data.config = body.config as unknown as object;
    if (body.show_results !== undefined) data.show_results = body.show_results;
    if (body.result_layout !== undefined) data.result_layout = body.result_layout;
    const poll = await tx.polls.update({ where: { id }, data });

    if (Array.isArray(body.options)) {
      // Strategy: replace option set. Existing votes' option_id are FK-cascaded
      // on delete, so we only delete options the admin explicitly removed.
      const submittedIds = new Set(body.options.filter(o => o.id).map(o => o.id!));
      const currentOpts = await tx.poll_options.findMany({ where: { poll_id: id } });
      const toDelete = currentOpts.filter(o => !submittedIds.has(o.id)).map(o => o.id);
      if (toDelete.length > 0) {
        await tx.poll_options.deleteMany({ where: { id: { in: toDelete } } });
      }
      for (let i = 0; i < body.options.length; i++) {
        const o = body.options[i];
        const color_idx = Math.max(0, Math.min(15, o.color_idx ?? 7));
        if (o.id) {
          await tx.poll_options.update({
            where: { id: o.id },
            data: { label: o.label.slice(0, 255), color_idx, sort_order: i },
          });
        } else {
          await tx.poll_options.create({
            data: { poll_id: id, label: o.label.slice(0, 255), color_idx, sort_order: i, approved: true },
          });
        }
      }
    }
    return poll;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "invalid_type") return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    throw e;
  }

  broadcast("site:polls", { type: "updated", id: updated.id, slug: updated.slug, status: updated.status, featured: updated.featured });
  broadcast(`poll:${updated.id}`, { type: "updated" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const poll = await prisma.polls.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.polls.delete({ where: { id } });
  broadcast("site:polls", { type: "deleted", id, slug: poll.slug });
  return NextResponse.json({ ok: true });
}
