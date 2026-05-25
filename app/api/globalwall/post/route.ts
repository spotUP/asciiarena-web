import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const WALL_URL = "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems/";
const COLORS = ["\x1b[31m", "\x1b[32m", "\x1b[33m", "\x1b[34m", "\x1b[35m", "\x1b[36m", "\x1b[37m"];

function encodeComment(text: string): string {
  return text
    .replace(/\\/g, "&#92;")
    .replace(/\[/g, "&#91;")
    .replace(/]/g, "&#93;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;")
    .replace(/,/g, "&#44;")
    .replace(/:/g, "&#58;")
    .replace(/"/g, "&#34;")
    .replace(/</g, "")
    .replace(/>/g, "");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { comment } = (await request.json()) as { comment?: string };
  if (!comment?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const encoded = encodeComment(comment.trim().substring(0, 60));
  const body = {
    userName: session.user.name ?? "unknown",
    source: "aSCIIaRENA",
    comment: color + encoded,
    bbsshortcode: "ASC",
  };

  const r = await fetch(WALL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) return NextResponse.json({ error: "Wall rejected post" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
