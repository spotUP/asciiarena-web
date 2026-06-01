import { NextRequest, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { broadcast, subscriberCount } from "@/lib/live";
import { apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

const BOT_UA = /bot|crawl|spider|google|bing|yahoo|baidu|duckduck|semrush|ahrefs|python|curl|wget|scrapy|java\/|ruby\/|go-http/i;

// Throttle the heavy broadcastOnline() fan-out to once per 5s across all
// concurrent pings. Every browser tab fires a heartbeat ping on mount and
// every 60s; without this, a tab-burst (a few visitors loading at once)
// makes every ping wait on 2 fresh DB queries + a fan-out. With it, those
// pings return instantly and one broadcast covers the whole window.
const BROADCAST_INTERVAL_MS = 5_000;
let lastBroadcast = 0;

async function broadcastOnline() {
  const cutoff = Math.floor(Date.now() / 1000) - 300;
  const [activeUsers, anonResult] = await Promise.all([
    prisma.users.findMany({
      where: { lastactive: { gt: cutoff } },
      orderBy: { lastactive: "desc" },
      select: { id: true, nick: true },
    }),
    prisma.$queryRaw<[{ cnt: bigint }]>(
      Prisma.sql`SELECT COUNT(DISTINCT session) AS cnt FROM users_online WHERE timestamp > ${cutoff}`
    ),
  ]);
  broadcast("site:online", {
    type: "update",
    activeUsers: activeUsers.map(u => ({
      id: u.id,
      nick: u.nick ?? "",
      inChat: subscriberCount(`user:${u.id}:messages`) > 0,
    })),
    anonymousOnline: Number(anonResult[0]?.cnt ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return apiOk({ ok: true });

  const session = await auth();
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 300;

  if (session?.user?.id) {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE users SET lastactive = ${now} WHERE id = ${parseInt(session.user.id)}`
    );
  } else {
    let body: { sessionId?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const sessionId = String(body.sessionId ?? "").slice(0, 128);
    if (sessionId && /^[a-f0-9-]{36}$/.test(sessionId)) {
      await prisma.$executeRaw(
        Prisma.sql`DELETE FROM users_online WHERE session = ${sessionId}`
      );
      await prisma.$executeRaw(
        Prisma.sql`INSERT INTO users_online (timestamp, session, current) VALUES (${now}, ${sessionId}, "")`
      );
      await prisma.$executeRaw(
        Prisma.sql`DELETE FROM users_online WHERE timestamp < ${cutoff}`
      );
    }
  }

  // Fan-out runs AFTER the response is sent (next/server's `after` hook),
  // and only one fan-out fires per 5s window even under a tab-burst, so the
  // client never waits on broadcastOnline()'s 2 DB queries.
  const nowMs = Date.now();
  if (nowMs - lastBroadcast >= BROADCAST_INTERVAL_MS) {
    lastBroadcast = nowMs;
    after(() => broadcastOnline().catch(() => { /* swallow */ }));
  }

  return apiOk({ ok: true });
}
