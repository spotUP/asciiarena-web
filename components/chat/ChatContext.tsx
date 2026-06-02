"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { setSnooze, clearSnooze } from "@/lib/chat-snooze";

export interface ChatWindowState {
  threadId: number | null;
  peerId: number;
  peerNick: string;
  minimized: boolean;
  unread: number;
}

interface ChatContextValue {
  windows: ChatWindowState[];
  openChat: (peerId: number, peerNick: string, threadId?: number, opts?: { startMinimized?: boolean; unread?: number }) => void;
  closeChat: (peerId: number) => void;
  minimizeChat: (peerId: number, minimized: boolean) => void;
  markRead: (peerId: number) => void;
  setThreadId: (peerId: number, threadId: number) => void;
  incrementUnread: (peerId: number) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext used outside ChatProvider");
  return ctx;
}

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<ChatWindowState[]>([]);

  const openChat = useCallback((
    peerId: number,
    peerNick: string,
    threadId?: number,
    opts?: { startMinimized?: boolean; unread?: number },
  ) => {
    // Legacy messages have thread=0; treat that as "no real thread yet" so the
    // window falls through to /api/chat/thread lookup or new-thread creation.
    const tid = threadId && threadId > 0 ? threadId : null;
    const startMinimized = opts?.startMinimized ?? false;
    const initialUnread = opts?.unread ?? 0;
    // Expanding/opening a chat ends its auto-expand snooze.
    if (!startMinimized) clearSnooze(peerId);
    setWindows(prev => {
      const exists = prev.find(w => w.peerId === peerId);
      if (exists) {
        // Existing window: don't override minimized state if caller wants
        // a passive (background) open — only expand when the user explicitly
        // opened it. Always clear unread because the user is now aware of it.
        return prev.map(w =>
          w.peerId === peerId
            ? {
                ...w,
                minimized: startMinimized ? w.minimized : false,
                unread: startMinimized ? w.unread + initialUnread : 0,
                threadId: tid ?? w.threadId,
              }
            : w
        );
      }
      const next = [...prev, { peerId, peerNick, threadId: tid, minimized: startMinimized, unread: initialUnread }];
      if (next.length > 4) {
        // Drop oldest minimized window to stay at max 4
        const minIdx = next.findIndex(w => w.minimized);
        if (minIdx >= 0) next.splice(minIdx, 1);
        else next.shift();
      }
      return next;
    });
  }, []);

  const closeChat = useCallback((peerId: number) => {
    setWindows(prev => prev.filter(w => w.peerId !== peerId));
  }, []);

  const minimizeChat = useCallback((peerId: number, minimized: boolean) => {
    // Minimizing starts the auto-expand snooze; re-opening ends it. Persisted
    // in localStorage so the snooze survives a page reload.
    if (minimized) setSnooze(peerId); else clearSnooze(peerId);
    setWindows(prev => prev.map(w => w.peerId === peerId ? { ...w, minimized } : w));
  }, []);

  const markRead = useCallback((peerId: number) => {
    setWindows(prev => prev.map(w => w.peerId === peerId ? { ...w, unread: 0 } : w));
  }, []);

  const setThreadId = useCallback((peerId: number, threadId: number) => {
    setWindows(prev => prev.map(w => w.peerId === peerId ? { ...w, threadId } : w));
  }, []);

  const incrementUnread = useCallback((peerId: number) => {
    setWindows(prev => prev.map(w => w.peerId === peerId ? { ...w, unread: w.unread + 1 } : w));
  }, []);

  return (
    <ChatContext.Provider value={{ windows, openChat, closeChat, minimizeChat, markRead, setThreadId, incrementUnread }}>
      {children}
    </ChatContext.Provider>
  );
}
