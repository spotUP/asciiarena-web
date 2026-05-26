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
    // 386.css starts the body invisible; the normal site has a SiteLayout
    // bootstrap script that flips it visible. Popouts don't use SiteLayout,
    // so we have to undo it ourselves or the window renders blank.
    document.body.style.visibility = "visible";
    // The popout window is sized exactly for one ChatWindow at 100vw×100vh.
    // Default body margin/padding would make the content overflow and show
    // OS scrollbars; reset margin and pin overflow:hidden on html+body.
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#111";
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
