"use client";

import { useEffect } from "react";
import { ChatContextProvider, useChatContext } from "@/components/chat/ChatContext";
import ChatWindow from "@/components/chat/ChatWindow";

interface Props {
  peerId: number;
  peerNick: string;
  userId: string;
  userNick: string;
}

// Renders a single ChatWindow that fills the OS window. Wrapped in a private
// ChatContextProvider so ChatWindow's internal setThreadId / unread accounting
// has a real store to write to — driven by the context the same way the docked
// chat windows are, but with only one peer.
export default function PopoutClient({ peerId, peerNick, userId, userNick }: Props) {
  useEffect(() => {
    document.title = `[${peerNick}] chat — aSCIIaRENA`;
  }, [peerNick]);

  return (
    <ChatContextProvider>
      <PopoutInner peerId={peerId} peerNick={peerNick} userId={userId} userNick={userNick} />
    </ChatContextProvider>
  );
}

function PopoutInner({ peerId, peerNick, userId, userNick }: Props) {
  const { windows, openChat } = useChatContext();

  // Ensure the peer's window is registered in the context exactly once on mount.
  useEffect(() => {
    openChat(peerId, peerNick);
  }, [peerId, peerNick, openChat]);

  const w = windows.find(x => x.peerId === peerId);
  // Wait for openChat's setState to land so threadId/peerNick are stable.
  if (!w) return null;

  return (
    <ChatWindow
      peerId={w.peerId}
      peerNick={w.peerNick}
      threadId={w.threadId}
      minimized={false}
      userId={userId}
      userNick={userNick}
      popout
    />
  );
}
