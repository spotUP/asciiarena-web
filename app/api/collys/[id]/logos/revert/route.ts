import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { parseLogoMap } from "@/lib/collyLogoSnapshot";
import { writeLogoEdit } from "@/lib/collyLogoWrite";

const postSchema = z.object({ editId: z.number().int().positive() });

// Reverting replays an older snapshot as a NEW edit, attributed to the admin
// doing the revert. History stays append-only: nothing is ever rewritten, so
// a revert can itself be reverted.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const { id } = await params;
  const collyId = Number(id);
  if (!Number.isFinite(collyId) || collyId <= 0) return apiError("Invalid id", 400);

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid request: " + parsed.error.issues[0]?.message, 400);

  const edit = await prisma.colly_logo_edits.findUnique({ where: { id: parsed.data.editId } });
  if (!edit || edit.colly_id !== collyId) return apiError("Not found", 404);

  // `parseLogoMap` degrades to an empty map for anything it cannot read, which
  // is right for display -- a malformed historical row must not break the
  // release page -- and wrong here: restoring a truncated or future-format row
  // would write an empty map over the colly instead of failing. The stored
  // `logo_count` says what the row is meant to contain, so a mismatch is a
  // read failure, not an empty snapshot.
  const map = parseLogoMap(edit.map);
  if (!map.length && edit.logo_count > 0) {
    return apiError("That snapshot could not be read, so nothing was restored.", 422);
  }

  const result = await writeLogoEdit(collyId, Number(session!.user!.id), map);

  const colly = await prisma.collys.findUnique({ where: { id: collyId }, select: { filename: true } });
  if (colly?.filename) revalidatePath("/release/" + colly.filename);

  return apiOk({ status: true, ...result });
}
