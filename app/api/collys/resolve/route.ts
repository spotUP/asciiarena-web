import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils";
import { loadEntityDicts } from "@/lib/collyLogoIndex";
import { resolveEntities } from "@/lib/handleMatch";

export const dynamic = "force-dynamic";

// Given a selected logo's text (which usually carries an acronym/handle), resolve
// it to an artist and return the full name — so the editor can auto-fill "author".
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = (body.text ?? "").slice(0, 300).trim();
  if (!text) return apiOk({ author: null });
  try {
    const res = resolveEntities(text, await loadEntityDicts());
    if (!res.artist_id) return apiOk({ author: null });
    const a = await prisma.artists.findUnique({ where: { id: res.artist_id }, select: { nick: true } });
    return apiOk({ author: a?.nick ?? null });
  } catch {
    return apiOk({ author: null });
  }
}
