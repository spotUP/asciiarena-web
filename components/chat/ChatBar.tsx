"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatContext, dmKey, threadKey } from "./ChatContext";
import ChatWindow from "./ChatWindow";
import { resolveDisplayTitle } from "@/lib/chatThread";
import { playChatAlert, unlockChatAudio } from "@/lib/chatSound";
import { usePoppedOutPeers } from "./popoutRegistry";

interface Props {
  userId: string;
  userNick: string;
}

interface IncomingMessage {
  type: string;
  fromId?: number;
  fromNick?: string;
  threadId?: number;
  byNick?: string;
}

export default function ChatBar({ userId, userNick }: Props) {
  const { windows, openChat, openThread, minimizeChat, closeChat } = useChatContext();
  const [newNick, setNewNick] = useState("");
  const [newNickOpen, setNewNickOpen] = useState(false);
  const [newNickError, setNewNickError] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: number; nick: string }>>([]);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowsRef = useRef(windows);

  // Peers currently popped out into a separate OS window. For these we must NOT
  // render or re-open a docked window — the popout owns that conversation, and a
  // duplicate docked window would (a) twin the UI and (b) double up the
  // thread SSE subscriptions, starving the popout's stream.
  const poppedOutPeers = usePoppedOutPeers();
  const poppedOutRef = useRef(poppedOutPeers);

  useEffect(() => { windowsRef.current = windows; }, [windows]);
  useEffect(() => { poppedOutRef.current = poppedOutPeers; }, [poppedOutPeers]);

  // If a docked DM window exists for a peer that is now popped out, tear it down
  // so its EventSource subscriptions close and the popout regains its SSE budget.
  useEffect(() => {
    for (const w of windows) {
      if (!w.isGroup && poppedOutPeers.has(String(w.peerId))) {
        closeChat(w.key);
      }
    }
  }, [windows, poppedOutPeers, closeChat]);

  // SSE listener for incoming messages and yells. A new message always
  // expands (or opens) the relevant chat window. A yell also opens/expands
  // and plays the X-Copy alert sound so it reaches you even with no window open.
  useEffect(() => {
    const es = new EventSource(`/api/live?channel=user:${userId}:messages`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as IncomingMessage;
        if (event.type === "message" && event.fromId && event.fromNick) {
          const wins = windowsRef.current;
          const tid = event.threadId;
          const groupWin = tid ? wins.find(w => w.key === threadKey(tid)) : undefined;
          const dmWin = wins.find(w => w.key === dmKey(event.fromId!));
          // The peer's chat is popped out into its own window — it handles this
          // message via its own thread channel. Don't open/re-open a docked twin.
          const peerPoppedOut = !groupWin && poppedOutRef.current.has(String(event.fromId));
          if (groupWin) {
            if (groupWin.minimized) minimizeChat(groupWin.key, false); // expand the group
          } else if (peerPoppedOut) {
            // no-op: the popout owns this conversation
          } else if (dmWin) {
            if (dmWin.minimized) minimizeChat(dmWin.key, false);       // expand the DM
          } else {
            openChat(event.fromId, event.fromNick);                    // new DM, expanded
          }
        } else if (event.type === "alert" && event.threadId && event.fromId !== parseInt(userId)) {
          unlockChatAudio();
          const tid = event.threadId;
          const wins = windowsRef.current;
          const groupWin = wins.find(w => w.key === threadKey(tid));
          const dmWin = event.fromId ? wins.find(w => w.key === dmKey(event.fromId!)) : undefined;
          const peerPoppedOut = !groupWin && event.fromId != null && poppedOutRef.current.has(String(event.fromId));
          if (groupWin) {
            if (groupWin.minimized) minimizeChat(groupWin.key, false);
            playChatAlert();
          } else if (peerPoppedOut) {
            // The popout window handles the flash/sound via its own thread channel.
            playChatAlert();
          } else if (dmWin) {
            if (dmWin.minimized) minimizeChat(dmWin.key, false);
            playChatAlert();
          } else {
            // No window yet — fetch members to open the right one, then play.
            fetch(`/api/chat/thread/${tid}/members`)
              .then(r => r.json())
              .then((list: { userId: number; nick: string }[]) => {
                const others = list.filter(p => p.userId !== parseInt(userId)).map(p => ({ id: p.userId, nick: p.nick }));
                if (others.length === 1) openChat(others[0].id, others[0].nick, tid);
                else openThread(tid, others, resolveDisplayTitle(null, null, others.map(o => o.nick)), { startMinimized: false });
                playChatAlert();
              })
              .catch(() => { playChatAlert(); });
          }
        } else if (event.type === "thread-added" && event.threadId) {
          fetch(`/api/chat/thread/${event.threadId}/members`)
            .then(r => r.json())
            .then((list: { userId: number; nick: string }[]) => {
              const others = list.filter(p => p.userId !== parseInt(userId)).map(p => ({ id: p.userId, nick: p.nick }));
              openThread(event.threadId!, others, resolveDisplayTitle(null, null, others.map(o => o.nick)), { startMinimized: true, unread: 1 });
            })
            .catch(() => {});
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [userId, minimizeChat, openChat, openThread]);

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

  // Never render a docked window for a peer whose chat is popped out — the
  // closeChat effect removes it from the store, but filter here too so there's
  // no flash of a twin window before that state update commits.
  const visibleWindows = windows.filter(w => !(!w.isGroup && poppedOutPeers.has(String(w.peerId))));
  const expandedWindows = visibleWindows.filter(w => !w.minimized);

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
        <div key={w.key} style={{ pointerEvents: "all" }}>
          <ChatWindow
            windowKey={w.key}
            threadId={w.threadId}
            isGroup={w.isGroup}
            peerId={w.peerId}
            title={w.title}
            participants={w.participants}
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
        {visibleWindows.filter(w => w.minimized).map(w => (
          <button
            key={w.key}
            onClick={() => minimizeChat(w.key, false)}
            className={w.unread > 0 ? "blink" : undefined}
            style={{
              background: "none", border: "none",
              color: w.unread > 0 ? "#ff55ff" : "#aaaaaa",
              cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "0 4px",
            }}
          >
            [{w.title}{w.unread > 0 ? ` ${w.unread}` : ""}]
          </button>
        ))}

        {/* Tabs for expanded windows (to minimize them) */}
        {expandedWindows.map(w => (
          <button
            key={w.key}
            onClick={() => minimizeChat(w.key, true)}
            style={{
              background: "none", border: "none", color: "#ffff55",
              cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "0 4px",
            }}
          >
            [{w.title}]
          </button>
        ))}
      </div>
    </div>
  );
}
