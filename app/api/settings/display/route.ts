import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { broadcast } from "@/lib/live";

export const dynamic = "force-dynamic";

const schema = z.object({
  crt_effect: z.union([z.literal(0), z.literal(1)]).optional(),
  anim_effect: z.union([z.literal(0), z.literal(1)]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const userId = parseInt(session.user.id);
  const { crt_effect, anim_effect } = parsed.data;

  const data: { crt_effect?: "Y" | "N"; anim_effect?: "Y" | "N" } = {};
  if (crt_effect !== undefined) data.crt_effect = crt_effect === 1 ? "Y" : "N";
  if (anim_effect !== undefined) data.anim_effect = anim_effect === 1 ? "Y" : "N";

  if (Object.keys(data).length === 0) return apiOk({ ok: true });

  await prisma.users.update({ where: { id: userId }, data });
  broadcast(`user:${userId}:profile`, { type: "updated" });

  return apiOk({ ok: true });
}
