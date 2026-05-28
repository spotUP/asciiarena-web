import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PollFormClient from "../PollFormClient";
import type { PollConfig } from "@/lib/polls/types";

export const dynamic = "force-dynamic";

export default async function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();
  const poll = await prisma.polls.findUnique({
    where: { id },
    include: { options: { orderBy: { sort_order: "asc" } } },
  });
  if (!poll) notFound();

  const initial = {
    id: poll.id,
    title: poll.title,
    slug: poll.slug,
    body: poll.body,
    type: poll.type,
    status: poll.status,
    featured: poll.featured,
    opens_at: poll.opens_at,
    closes_at: poll.closes_at,
    config: (poll.config as PollConfig | null) ?? {},
    show_results: poll.show_results,
    result_layout: poll.result_layout,
    options: poll.options.map(o => ({ id: o.id, label: o.label, color_idx: o.color_idx })),
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">EDIT POLL: {poll.title.toUpperCase()}</h2>
      </div>
      <PollFormClient initial={initial} />
    </>
  );
}
