"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { useChatContext } from "./ChatContext";

interface ChatMessage {
  id: number;
  from_id: number | null;
  postername: string | null;
  message: string | null;
  timestamp: number | null;
  unread?: boolean;
}

interface Props {
  peerId: number;
  peerNick: string;
  threadId: number | null;
  minimized: boolean;
  userId: string;
  userNick: string;
  // When true: rendering as a standalone popped-out window. Hides minimize and
  // popout buttons, fills the viewport instead of a fixed 240×~300 dock window,
  // and the close button closes the OS window via window.close() rather than
  // mutating the parent's ChatContext.
  popout?: boolean;
}

function formatTime(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

export default function ChatWindow({ peerId, peerNick, threadId, minimized, userId, userNick, popout = false }: Props) {
  const { closeChat, minimizeChat, setThreadId, markRead, incrementUnread } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [peerDraft, setPeerDraft] = useState<{ nick: string; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esMessagesRef = useRef<EventSource | null>(null);
  const esTypingRef = useRef<EventSource | null>(null);
  const threadIdRef = useRef<number | null>(threadId);
  const minimizedRef = useRef(minimized);
  // First-open scroll: on the initial render after messages arrive, land
  // at the boundary between read and unread instead of the very bottom,
  // so the user catches up from where they left off. Subsequent message
  // arrivals fall back to scroll-to-bottom (handled in the same effect).
  const hasDoneInitialScrollRef = useRef(false);
  const firstUnreadIdRef = useRef<number | null>(null);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);

  const loadMessages = useCallback((tid: number) => {
    fetch(`/api/chat/messages/${tid}`)
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const list = [...(data as ChatMessage[])].reverse();
          // Record the first unread message id once, on the initial load,
          // so the scroll effect below can find it after render. We capture
          // before /api/chat/read clears the flag.
          if (!hasDoneInitialScrollRef.current && firstUnreadIdRef.current == null) {
            const firstUnread = list.find(m => m.unread);
            if (firstUnread) firstUnreadIdRef.current = firstUnread.id;
          }
          setMessages(list);
        }
      })
      .catch(() => {});
  }, []);

  const markReadIfVisible = useCallback((tid: number) => {
    if (!minimizedRef.current) {
      fetch(`/api/chat/read/${tid}`, { method: "POST" }).catch(() => {});
    }
  }, []);

  const subscribeToThread = useCallback((tid: number) => {
    if (esMessagesRef.current) esMessagesRef.current.close();
    if (esTypingRef.current) esTypingRef.current.close();

    const esMsg = new EventSource(`/api/live?channel=thread:${tid}`);
    esMsg.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "message") {
          loadMessages(tid);
          if (minimizedRef.current) {
            incrementUnread(peerId);
          } else {
            markReadIfVisible(tid);
          }
        }
      } catch { /* ignore */ }
    };
    esMessagesRef.current = esMsg;

    const esTyping = new EventSource(`/api/live?channel=thread:${tid}:typing`);
    esTyping.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "typing" && event.nick && event.nick !== userNick) {
          setPeerDraft({ nick: event.nick as string, text: (event.draft as string) ?? "" });
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setPeerDraft(null), 4000);
        } else if (event.type === "clear") {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          setPeerDraft(null);
        }
      } catch { /* ignore */ }
    };
    esTypingRef.current = esTyping;
  }, [peerId, userNick, loadMessages, incrementUnread, markReadIfVisible]);

  // Initialize: find or confirm thread, load messages
  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
      markReadIfVisible(threadId);
      subscribeToThread(threadId);
    } else {
      fetch(`/api/chat/thread?peerId=${peerId}`)
        .then(r => r.json())
        .then((data: { threadId?: number | null }) => {
          const tid = data?.threadId;
          if (tid) {
            setThreadId(peerId, tid);
            loadMessages(tid);
            markReadIfVisible(tid);
            subscribeToThread(tid);
          }
        })
        .catch(() => {});
    }

    return () => {
      esMessagesRef.current?.close();
      esTypingRef.current?.close();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe when threadId arrives for a new conversation
  useEffect(() => {
    if (threadId && !esMessagesRef.current) {
      subscribeToThread(threadId);
    }
  }, [threadId, subscribeToThread]);

  // Mark read when window is un-minimized
  useEffect(() => {
    if (!minimized && threadIdRef.current) {
      markReadIfVisible(threadIdRef.current);
      markRead(peerId);
    }
  }, [minimized, peerId, markRead, markReadIfVisible]);

  // Initial open: scroll to the first unread message so the user lands at
  // the read/unread boundary and can catch up downward. Subsequent renders
  // (new arrivals, typing indicators) just stick to the bottom as before.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!hasDoneInitialScrollRef.current && messages.length > 0) {
      hasDoneInitialScrollRef.current = true;
      const target = firstUnreadIdRef.current;
      if (target != null) {
        const node = el.querySelector<HTMLElement>(`[data-msg-id="${target}"]`);
        if (node) {
          // Position the first unread row near the top, leaving the older
          // (already-read) tail above it so context is one quick scroll away.
          el.scrollTop = node.offsetTop - el.clientTop - 4;
          return;
        }
      }
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, peerDraft]);

  const broadcastTyping = (text: string) => {
    const tid = threadIdRef.current;
    if (!tid) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: `thread:${tid}:typing`, type: text ? "typing" : "clear", nick: userNick, draft: text.slice(0, 120) }),
      }).catch(() => {});
    }, 50);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    // Clear typing indicator
    const tid = threadIdRef.current;
    if (tid) {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: `thread:${tid}:typing`, type: "clear", nick: userNick }),
      }).catch(() => {});
    }

    try {
      const body: { peerId: number; message: string; threadId?: number } = { peerId, message: text };
      // Only pass a positive thread id; the server's Zod schema requires
      // .int().positive(), so threadId=0 (legacy rows) would 400.
      if (tid && tid > 0) body.threadId = tid;
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; threadId?: number };
      if (data?.ok) {
        setInput("");
        const newThreadId = data.threadId;
        if ((!tid || tid <= 0) && newThreadId) {
          setThreadId(peerId, newThreadId);
          subscribeToThread(newThreadId);
        }
        const reloadId = newThreadId ?? (tid && tid > 0 ? tid : null);
        if (reloadId) loadMessages(reloadId);
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const myId = parseInt(userId);

  const openPopout = () => {
    const w = window.open(
      `/chat/window/${peerId}`,
      `chat_${peerId}`,
      "width=340,height=500,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no"
    );
    if (w) closeChat(peerId);
  };

  if (minimized) return null; // ChatBar renders the tab; window is hidden

  return (
    <div style={popout ? {
      // Popout: fill the OS window
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#111",
      fontFamily: "TopazPlus_a1200, monospace",
      fontSize: "13px",
      lineHeight: "16px",
    } : {
      // Inline dock
      width: "240px",
      display: "flex",
      flexDirection: "column",
      border: "1px solid #444",
      backgroundColor: "#111",
      fontFamily: "TopazPlus_a1200, monospace",
      fontSize: "13px",
      lineHeight: "16px",
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#444",
        padding: "4px 6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: popout ? "default" : "pointer",
        userSelect: "none",
      }} onClick={popout ? undefined : () => minimizeChat(peerId, true)}>
        <span className="yellow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          [{peerNick}]
        </span>
        <span style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {!popout && (
            <button onClick={(e) => { e.stopPropagation(); openPopout(); }}
              title="Pop out to a separate window"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              {/* Plain ASCII caret — Amiga / Topaz charset only, matches _ and X. */}
              ^
            </button>
          )}
          {!popout && (
            <button onClick={(e) => { e.stopPropagation(); minimizeChat(peerId, true); }}
              title="Minimise"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              _
            </button>
          )}
          <button onClick={(e) => {
            e.stopPropagation();
            if (popout) window.close();
            else closeChat(peerId);
          }}
            title={popout ? "Close window" : "Close"}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
            X
          </button>
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        ...(popout ? { flex: 1, minHeight: 0 } : { height: "220px" }),
        overflowY: "auto",
        overflowX: "hidden",
        backgroundColor: "#212121",
        padding: "4px 6px",
      }}>
        {messages.length === 0 && (
          <div className="lightgrey" style={{ paddingTop: "8px", textAlign: "center" }}>
            start your conversation
          </div>
        )}
        {messages.map(msg => {
          // Legacy rows can have null from_id; in that case fall back to
          // comparing the stored sender nick against the viewer's nick.
          const isOwn =
            msg.from_id === myId ||
            (msg.from_id == null && msg.postername === userNick);
          const isFirstUnreadMarker = firstUnreadIdRef.current === msg.id;
          return (
            <div key={msg.id} data-msg-id={msg.id} style={{ marginBottom: "4px" }}>
              {isFirstUnreadMarker && (
                <div className="lightred" style={{
                  fontSize: "11px",
                  borderTop: "1px dashed #ff5555",
                  paddingTop: "2px",
                  marginBottom: "2px",
                  textAlign: "center",
                  fontFamily: "TopazPlus_a1200, monospace",
                }}>
                  — new since last visit —
                </div>
              )}
              <span style={{ color: isOwn ? "#ffff55" : "#ff55ff", marginRight: "4px" }}>
                {msg.postername ?? (isOwn ? userNick : peerNick)}
              </span>
              <span className="lightgrey" style={{ fontSize: "11px" }}>{formatTime(msg.timestamp)}</span>
              <div style={{ color: "#aaaaaa", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.message}
              </div>
            </div>
          );
        })}
        {peerDraft && (
          <div style={{ marginBottom: "4px" }}>
            <span style={{ color: "#ff55ff", marginRight: "4px" }}>{peerDraft.nick}</span>
            <span style={{ color: "#aaaaaa", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {peerDraft.text}<span className="cursor-block" />
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", borderTop: "1px solid #333" }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); broadcastTyping(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="message..."
          maxLength={1000}
          style={{
            flex: 1,
            background: "#111",
            border: "none",
            color: "#aaaaaa",
            fontFamily: "TopazPlus_a1200, monospace",
            fontSize: "16px",
            lineHeight: "16px",
            padding: "0 8px",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending}
          style={{
            background: "#333",
            border: "none",
            borderLeft: "1px solid #444",
            color: "#aaaaaa",
            cursor: "pointer",
            fontFamily: "TopazPlus_a1200, monospace",
            fontSize: "13px",
            padding: "4px 8px",
            flexShrink: 0,
          }}
        >
          SND
        </button>
      </div>
    </div>
  );
}
