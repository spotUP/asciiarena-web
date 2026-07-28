import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BoardFormClient from "@/app/admin/forum/BoardFormClient";

export const dynamic = "force-dynamic";

export default async function AdminEditBoard({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const b = await prisma.forum_boards.findUnique({ where: { id } });
  if (!b) notFound();

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">EDIT BOARD</h2>
      </div>
      <BoardFormClient
        initial={{
          id: b.id,
          slug: b.slug,
          name: b.name,
          description: b.description,
          sortOrder: b.sort_order,
          minReadRank: b.min_read_rank,
          minPostRank: b.min_post_rank,
          locked: b.locked,
          hidden: b.hidden,
        }}
      />
    </>
  );
}
