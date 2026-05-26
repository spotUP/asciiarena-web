import { redirect } from "next/navigation";
import { getSession as auth } from "@/lib/session";
import { prisma } from "@/lib/db";
import PopoutClient from "./PopoutClient";

export default async function ChatPopoutPage({
  params,
}: {
  params: Promise<{ peerId: string }>;
}) {
  const { peerId: peerIdStr } = await params;
  const peerId = parseInt(peerIdStr);
  if (!peerId || isNaN(peerId)) redirect("/");

  const session = await auth();
  const sessionUser = (session as { user?: { id?: string; name?: string } } | null)?.user;
  if (!sessionUser?.id) redirect("/login");

  const peer = await prisma.users.findUnique({
    where: { id: peerId },
    select: { nick: true },
  });
  if (!peer?.nick) redirect("/");

  return (
    <PopoutClient
      peerId={peerId}
      peerNick={peer.nick}
      userId={sessionUser.id}
      userNick={sessionUser.name ?? ""}
    />
  );
}
