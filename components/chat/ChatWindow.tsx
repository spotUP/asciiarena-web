"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { useChatContext } from "./ChatContext";

interface ChatMessage {
  id: number;
  from_id: number | null;
  postername: string | null;
  message: string | null;
  timestamp: number | null;
}

interface Props {
  peerId: number;
  peerNick: string;
  threadId: number | null;
  minimized: boolean;
  userId: string;
  userNick: string;
}

function formatTime(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

export default function ChatWindow({ peerId, peerNick, threadId, minimized, userId, userNick }: Props) {
  const { closeChat, minimizeChat, setThreadId, markRead, incrementUnread } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typingNick, setTypingNick] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esMessagesRef = useRef<EventSource | null>(null);
  const esTypingRef = useRef<EventSource | null>(null);
  const threadIdRef = useRef<number | null>(threadId);
  const minimizedRef = useRef(minimized);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);

  const loadMessages = useCallback((tid: number) => {
    fetch(`/api/chat/messages/${tid}`)
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setMessages([...(data as ChatMessage[])].reverse());
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
          setTypingNick(event.nick as string);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingNick(null), 4000);
        } else if (event.type === "clear") {
          setTypingNick(null);
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
      if (tid !== null) body.threadId = tid;
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok?: boolean; threadId?: number };
      if (data?.ok) {
        setInput("");
        const newThreadId = data.threadId;
        if (!tid && newThreadId) {
          setThreadId(peerId, newThreadId);
          subscribeToThread(newThreadId);
        }
        loadMessages(newThreadId ?? tid!);
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

  if (minimized) return null; // ChatBar renders the tab; window is hidden

  return (
    <div style={{
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
        cursor: "pointer",
        userSelect: "none",
      }} onClick={() => minimizeChat(peerId, true)}>
        <span className="yellow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          [{peerNick}]
        </span>
        <span style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); minimizeChat(peerId, true); }}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
            _
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeChat(peerId); }}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
            X
          </button>
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        height: "220px",
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
          const isOwn = msg.from_id === myId;
          return (
            <div key={msg.id} style={{ marginBottom: "4px" }}>
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
        {typingNick && (
          <div className="lightgrey" style={{ fontStyle: "italic", opacity: 0.7 }}>
            {typingNick} is typing...
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
            fontSize: "13px",
            padding: "4px 6px",
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
