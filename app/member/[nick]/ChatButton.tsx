"use client";

import { useChatContext } from "@/components/chat/ChatContext";

export default function ChatButton({ peerId, peerNick }: { peerId: number; peerNick: string }) {
  const { openChat } = useChatContext();
  return (
    <input
      type="button"
      className="btn-big"
      value="Chat"
      onClick={() => openChat(peerId, peerNick)}
      style={{ cursor: "pointer" }}
    />
  );
}
