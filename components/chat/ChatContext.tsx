"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
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

const STORAGE_KEY = "asciiarena:chat:windows";

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
  const skipNextPersist = useRef(true);

  // Restore the docked chats from a previous page/session on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as ChatWindowState[];
      if (Array.isArray(parsed) && parsed.length > 0) setWindows(parsed);
    } catch { /* ignore corrupt storage */ }
  }, []);

  // Keep the dock persisted so chats survive navigation + reload. Skip the very
  // first run: on mount `windows` is still the empty initial state (the restore
  // effect's setWindows hasn't committed yet), and writing it would clobber the
  // saved dock before restore applies. After restore re-renders, this runs again
  // with the real data.
  useEffect(() => {
    if (skipNextPersist.current) { skipNextPersist.current = false; return; }
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(windows)); } catch { /* quota / disabled */ }
  }, [windows]);

  // Multi-tab sync: when another tab changes the dock, adopt its state instead of
  // racing/overwriting it (the `storage` event only fires in OTHER tabs). Without
  // this, two tabs' last-write-wins clobbered each other and chat windows vanished.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? (JSON.parse(e.newValue) as ChatWindowState[]) : [];
        if (Array.isArray(parsed)) { skipNextPersist.current = true; setWindows(parsed); }
      } catch { /* ignore corrupt storage */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      // Canonical key per thread: drop any other window already showing this
      // thread (e.g. a DM p:-window with the same threadId) so we never twin it.
      const deduped = prev.filter(w => w.threadId !== threadId);
      return capWindows([...deduped, {
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
      // Snooze is DM-only by construction; groups never reach here because !w.isGroup guards it.
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
      ? { ...w, participants, title,
          // The key prefix is the source of truth for group-ness, not the mutable
          // member count: a t:-keyed window stays a group even if it drops to 1.
          isGroup: key.startsWith("t:") || participants.length > 1,
          peerId: participants[0]?.id ?? w.peerId }
      : w));
  }, []);

  return (
    <ChatContext.Provider value={{ windows, openChat, openThread, closeChat, minimizeChat, markRead, setThreadId, incrementUnread, setParticipants }}>
      {children}
    </ChatContext.Provider>
  );
}
