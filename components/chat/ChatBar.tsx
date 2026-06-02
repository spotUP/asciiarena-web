"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatContext } from "./ChatContext";
import ChatWindow from "./ChatWindow";
import { isSnoozed } from "@/lib/chat-snooze";

interface Props {
  userId: string;
  userNick: string;
}

interface IncomingMessage {
  type: string;
  fromId?: number;
  fromNick?: string;
  threadId?: number;
}

// After you minimize a chat, new messages from that peer stay collapsed (just
// the blinking unread tab) instead of popping the window open, for this long.
const MINIMIZE_SNOOZE_MS = 30 * 60 * 1000; // 30 minutes

export default function ChatBar({ userId, userNick }: Props) {
  const { windows, openChat, minimizeChat, incrementUnread } = useChatContext();
  const [newNick, setNewNick] = useState("");
  const [newNickOpen, setNewNickOpen] = useState(false);
  const [newNickError, setNewNickError] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: number; nick: string }>>([]);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowsRef = useRef(windows);

  useEffect(() => { windowsRef.current = windows; }, [windows]);

  // SSE listener for incoming messages. A new message opens the chat docked at
  // the bottom, expanded so the message is immediately visible — UNLESS you
  // recently minimized that peer's window, in which case it stays collapsed
  // (blinking unread tab) and doesn't pop open again for MINIMIZE_SNOOZE_MS.
  useEffect(() => {
    const es = new EventSource(`/api/live?channel=user:${userId}:messages`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as IncomingMessage;
        if (event.type === "message" && event.fromId && event.fromNick) {
          const existingWindow = windowsRef.current.find(w => w.peerId === event.fromId);
          if (existingWindow) {
            if (existingWindow.minimized) {
              if (isSnoozed(event.fromId, MINIMIZE_SNOOZE_MS)) {
                // You minimized this recently — keep it collapsed; just bump
                // the blinking unread count instead of popping it open.
                incrementUnread(event.fromId);
              } else {
                // Snooze expired — pop the collapsed tab back open.
                minimizeChat(event.fromId, false);
              }
            }
            // Already expanded: its own thread SSE shows the message inline.
          } else if (isSnoozed(event.fromId, MINIMIZE_SNOOZE_MS)) {
            // No window yet (e.g. after a reload) but still snoozed — park a
            // collapsed blinking tab instead of popping a window open.
            openChat(event.fromId, event.fromNick, undefined, { startMinimized: true, unread: 1 });
          } else {
            // First DM from this person this session — open it expanded.
            openChat(event.fromId, event.fromNick);
          }
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [userId, incrementUnread, minimizeChat, openChat]);

  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (q.length < 1) { setSuggestions([]); return; }
    suggestDebounceRef.current = setTimeout(() => {
      fetch(`/api/chat/users?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) setSuggestions(data as Array<{ id: number; nick: string }>);
        })
        .catch(() => {});
    }, 150);
  }, []);

  const selectSuggestion = (id: number, nick: string) => {
    openChat(id, nick);
    setNewNick("");
    setSuggestions([]);
    setNewNickOpen(false);
    setNewNickError("");
  };

  const startNewChat = async () => {
    const nick = newNick.trim();
    if (!nick) return;
    setNewNickError("");
    try {
      const res = await fetch(`/api/chat/user?nick=${encodeURIComponent(nick)}`);
      if (!res.ok) { setNewNickError("user not found"); return; }
      const data = await res.json() as { id?: number; nick?: string };
      if (data?.id && data?.nick) {
        openChat(data.id, data.nick);
        setNewNick("");
        setNewNickOpen(false);
        setNewNickError("");
      }
    } catch {
      setNewNickError("error");
    }
  };

  const expandedWindows = windows.filter(w => !w.minimized);

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      right: 0,
      zIndex: 9000,
      display: "flex",
      alignItems: "flex-end",
      gap: "4px",
      padding: "0 0 0 0",
      pointerEvents: "none",
      maxWidth: "100vw",
    }}>
      {/* Expanded chat windows stacked right-to-left */}
      {expandedWindows.map(w => (
        <div key={w.peerId} style={{ pointerEvents: "all" }}>
          <ChatWindow
            peerId={w.peerId}
            peerNick={w.peerNick}
            threadId={w.threadId}
            minimized={w.minimized}
            userId={userId}
            userNick={userNick}
          />
        </div>
      ))}

      {/* Bar */}
      <div style={{
        pointerEvents: "all",
        backgroundColor: "#111",
        borderTop: "1px solid #444",
        borderLeft: "1px solid #444",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        fontFamily: "TopazPlus_a1200, monospace",
        fontSize: "13px",
        flexWrap: "wrap",
        maxWidth: "100vw",
      }}>
        {/* NEW CHAT button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setNewNickOpen(o => !o); setNewNickError(""); }}
            style={{
              background: "none", border: "none", color: "#aaaaaa", cursor: "pointer",
              fontFamily: "inherit", fontSize: "inherit", padding: "0 4px",
            }}
          >
            [+ CHAT]
          </button>
          {newNickOpen && (
            <div style={{
              position: "absolute", bottom: "100%", right: 0,
              backgroundColor: "#212121", border: "1px solid #444",
              padding: "6px", display: "flex", flexDirection: "column", gap: "4px",
              minWidth: "160px",
            }}>
              <input
                type="text"
                value={newNick}
                onChange={e => { setNewNick(e.target.value); fetchSuggestions(e.target.value); }}
                onKeyDown={e => { if (e.key === "Enter") startNewChat(); if (e.key === "Escape") { setNewNickOpen(false); setSuggestions([]); } }}
                placeholder="nick..."
                autoFocus
                style={{
                  background: "#111", border: "1px solid #444", color: "#aaaaaa",
                  fontFamily: "inherit", fontSize: "16px", lineHeight: "16px",
                  padding: "0 8px",
                }}
              />
              {suggestions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={e => { e.preventDefault(); selectSuggestion(s.id, s.nick); }}
                      style={{
                        background: "#1a1a1a", border: "1px solid #333", color: "#ffff55",
                        cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
                        padding: "2px 4px", textAlign: "left",
                      }}
                    >
                      {s.nick}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={startNewChat}
                style={{
                  background: "#333", border: "1px solid #444", color: "#aaaaaa",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "2px 4px",
                }}
              >
                [GO]
              </button>
              {newNickError && <span className="lightgrey">{newNickError}</span>}
            </div>
          )}
        </div>

        {/* Minimized window tabs. A tab with unread messages blinks magenta
            and shows its count, and keeps doing so until you click it open —
            no timeout. Clicking re-expands the window. */}
        {windows.filter(w => w.minimized).map(w => (
          <button
            key={w.peerId}
            onClick={() => minimizeChat(w.peerId, false)}
            className={w.unread > 0 ? "blink" : undefined}
            style={{
              background: "none", border: "none",
              color: w.unread > 0 ? "#ff55ff" : "#aaaaaa",
              cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "0 4px",
            }}
          >
            [{w.peerNick}{w.unread > 0 ? ` ${w.unread}` : ""}]
          </button>
        ))}

        {/* Tabs for expanded windows (to minimize them) */}
        {expandedWindows.map(w => (
          <button
            key={w.peerId}
            onClick={() => minimizeChat(w.peerId, true)}
            style={{
              background: "none", border: "none", color: "#ffff55",
              cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "0 4px",
            }}
          >
            [{w.peerNick}]
          </button>
        ))}
      </div>
    </div>
  );
}
