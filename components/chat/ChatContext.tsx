"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { setSnooze, clearSnooze } from "@/lib/chat-snooze";

export interface ChatParticipant { id: number; nick: string }

export interface ChatWindowState {
  key: string;                  // "p:{peerId}" (DM) or "t:{threadId}" (group)
  threadId: number | null;
  isGroup: boolean;
  peerId: number;               // DM peer; for a group, a placeholder (first other participant)
  title: string;                // DM peer nick, or group title (derived nicks)
  participants: ChatParticipant[]; // OTHER participants (excludes self)
  minimized: boolean;
  unread: number;
}

export function dmKey(peerId: number): string { return `p:${peerId}`; }
export function threadKey(threadId: number): string { return `t:${threadId}`; }

interface ChatContextValue {
  windows: ChatWindowState[];
  openChat: (peerId: number, peerNick: string, threadId?: number, opts?: { startMinimized?: boolean; unread?: number }) => void;
  openThread: (threadId: number, participants: ChatParticipant[], title: string, opts?: { startMinimized?: boolean; unread?: number }) => void;
  closeChat: (key: string) => void;
  minimizeChat: (key: string, minimized: boolean) => void;
  markRead: (key: string) => void;
  setThreadId: (key: string, threadId: number) => void;
  incrementUnread: (key: string) => void;
  setParticipants: (key: string, participants: ChatParticipant[], title: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext used outside ChatProvider");
  return ctx;
}

function capWindows(next: ChatWindowState[]): ChatWindowState[] {
  if (next.length > 4) {
    const minIdx = next.findIndex(w => w.minimized);
    if (minIdx >= 0) next.splice(minIdx, 1); else next.shift();
  }
  return next;
}

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<ChatWindowState[]>([]);

  const openChat = useCallback<ChatContextValue["openChat"]>((peerId, peerNick, threadId, opts) => {
    const key = dmKey(peerId);
    const tid = threadId && threadId > 0 ? threadId : null;
    const startMinimized = opts?.startMinimized ?? false;
    const initialUnread = opts?.unread ?? 0;
    if (!startMinimized) clearSnooze(peerId);
    setWindows(prev => {
      const exists = prev.find(w => w.key === key);
      if (exists) {
        return prev.map(w => w.key === key ? {
          ...w,
          minimized: startMinimized ? w.minimized : false,
          unread: startMinimized ? w.unread + initialUnread : 0,
          threadId: tid ?? w.threadId,
        } : w);
      }
      return capWindows([...prev, {
        key, threadId: tid, isGroup: false, peerId, title: peerNick,
        participants: [{ id: peerId, nick: peerNick }],
        minimized: startMinimized, unread: initialUnread,
      }]);
    });
  }, []);

  const openThread = useCallback<ChatContextValue["openThread"]>((threadId, participants, title, opts) => {
    const key = threadKey(threadId);
    const startMinimized = opts?.startMinimized ?? false;
    const initialUnread = opts?.unread ?? 0;
    const placeholderPeer = participants[0]?.id ?? 0;
    setWindows(prev => {
      const exists = prev.find(w => w.key === key);
      if (exists) {
        return prev.map(w => w.key === key ? {
          ...w, participants, title, peerId: placeholderPeer,
          minimized: startMinimized ? w.minimized : false,
          unread: startMinimized ? w.unread + initialUnread : 0,
        } : w);
      }
      return capWindows([...prev, {
        key, threadId, isGroup: true, peerId: placeholderPeer, title, participants,
        minimized: startMinimized, unread: initialUnread,
      }]);
    });
  }, []);

  const closeChat = useCallback((key: string) => {
    setWindows(prev => prev.filter(w => w.key !== key));
  }, []);

  const minimizeChat = useCallback((key: string, minimized: boolean) => {
    setWindows(prev => {
      const w = prev.find(x => x.key === key);
      if (w && !w.isGroup) { if (minimized) setSnooze(w.peerId); else clearSnooze(w.peerId); }
      return prev.map(x => x.key === key ? { ...x, minimized } : x);
    });
  }, []);

  const markRead = useCallback((key: string) => {
    setWindows(prev => prev.map(w => w.key === key ? { ...w, unread: 0 } : w));
  }, []);

  const setThreadId = useCallback((key: string, threadId: number) => {
    setWindows(prev => prev.map(w => w.key === key ? { ...w, threadId } : w));
  }, []);

  const incrementUnread = useCallback((key: string) => {
    setWindows(prev => prev.map(w => w.key === key ? { ...w, unread: w.unread + 1 } : w));
  }, []);

  const setParticipants = useCallback((key: string, participants: ChatParticipant[], title: string) => {
    setWindows(prev => prev.map(w => w.key === key
      ? { ...w, participants, title, isGroup: participants.length > 1, peerId: participants[0]?.id ?? w.peerId }
      : w));
  }, []);

  return (
    <ChatContext.Provider value={{ windows, openChat, openThread, closeChat, minimizeChat, markRead, setThreadId, incrementUnread, setParticipants }}>
      {children}
    </ChatContext.Provider>
  );
}
