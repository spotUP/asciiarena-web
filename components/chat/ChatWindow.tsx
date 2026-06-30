"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { useChatContext } from "./ChatContext";
import { playChatAlert, unlockChatAudio } from "@/lib/chatSound";
import { resolveDisplayTitle } from "@/lib/chatThread";
import { announcePopoutOpen } from "./popoutRegistry";

interface ChatMessage {
  id: number;
  from_id: number | null;
  postername: string | null;
  message: string | null;
  timestamp: number | null;
  unread?: boolean;
}

interface Props {
  windowKey: string;
  threadId: number | null;
  isGroup: boolean;
  peerId: number;
  title: string;
  participants: { id: number; nick: string }[];
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

export default function ChatWindow({ windowKey, threadId, isGroup, peerId, title, participants, minimized, userId, userNick, popout = false }: Props) {
  const { closeChat, minimizeChat, setThreadId, markRead, incrementUnread, setParticipants } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemLines, setSystemLines] = useState<{ id: number; text: string }[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [peerDraft, setPeerDraft] = useState<{ nick: string; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addSuggestions, setAddSuggestions] = useState<Array<{ id: number; nick: string }>>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [size, setSize] = useState<{ width: number; msgHeight: number }>({ width: 480, msgHeight: 220 });
  const sizeRef = useRef(size);
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esMessagesRef = useRef<EventSource | null>(null);
  const esTypingRef = useRef<EventSource | null>(null);
  const threadIdRef = useRef<number | null>(threadId);
  const minimizedRef = useRef(minimized);
  const sysIdRef = useRef(0);
  // First-open scroll: on the initial render after messages arrive, land
  // at the boundary between read and unread instead of the very bottom,
  // so the user catches up from where they left off. Subsequent message
  // arrivals fall back to scroll-to-bottom (handled in the same effect).
  const hasDoneInitialScrollRef = useRef(false);
  const firstUnreadIdRef = useRef<number | null>(null);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  // Load persisted size from localStorage on mount (docked only, SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined" || popout) return;
    try {
      const saved = window.localStorage.getItem("asciiarena:chat:size");
      if (saved) {
        const s = JSON.parse(saved) as { width?: number; msgHeight?: number };
        if (typeof s.width === "number" && typeof s.msgHeight === "number") setSize({ width: s.width, msgHeight: s.msgHeight });
      }
    } catch { /* ignore */ }
  }, [popout]);

  // Fetch the resolved (per-user) title whenever the thread changes
  useEffect(() => {
    const tid = threadId;
    if (!tid || tid <= 0) return;
    let cancelled = false;
    fetch(`/api/chat/thread/${tid}/title`)
      .then(r => r.json())
      .then((data: { title?: string }) => {
        if (!cancelled && data?.title) setParticipants(windowKey, participants, data.title);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const saveTitle = () => {
    const tid = threadIdRef.current;
    setEditingTitle(false);
    if (!tid || tid <= 0) return;
    fetch(`/api/chat/thread/${tid}/title`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft }),
    })
      .then(r => r.json())
      .then((data: { title?: string }) => { if (data?.title) setParticipants(windowKey, participants, data.title); })
      .catch(() => {});
  };

  const pushSystemLine = useCallback((text: string) => {
    sysIdRef.current += 1;
    const id = sysIdRef.current;
    setSystemLines(prev => [...prev, { id, text }]);
  }, []);

  const refreshParticipants = useCallback(async (tid: number) => {
    try {
      const list = await (await fetch(`/api/chat/thread/${tid}/members`)).json() as { userId: number; nick: string }[];
      const others = list.filter(p => p.userId !== parseInt(userId)).map(p => ({ id: p.userId, nick: p.nick }));
      const titleData = await (await fetch(`/api/chat/thread/${tid}/title`)).json() as { title?: string };
      const resolvedTitle = titleData?.title ?? resolveDisplayTitle(null, null, others.map(o => o.nick));
      setParticipants(windowKey, others, resolvedTitle);
    } catch { /* ignore */ }
  }, [userId, windowKey, setParticipants]);

  const triggerFlash = useCallback(() => {
    setFlashing(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashing(false), 500);
  }, []);

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
            incrementUnread(windowKey);
          } else {
            markReadIfVisible(tid);
          }
        } else if (event.type === "alert") {
          // Ignore the echo of our own yell (we already played it on click).
          // Sound is played once by ChatBar via the user channel; only flash here.
          if (event.fromId !== parseInt(userId)) {
            triggerFlash();
            pushSystemLine(`${event.fromNick || "someone"} boinged ${formatTime(Math.floor(Date.now() / 1000))}!`);
          }
        } else if (event.type === "member-joined") {
          pushSystemLine(`${event.nick} joined`);
          refreshParticipants(tid);
        } else if (event.type === "member-left") {
          pushSystemLine(`${event.nick || "a member"} left`);
          refreshParticipants(tid);
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
  }, [windowKey, userId, userNick, loadMessages, incrementUnread, markReadIfVisible, triggerFlash, pushSystemLine, refreshParticipants]);

  // Initialize: find or confirm thread, load messages
  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
      markReadIfVisible(threadId);
      subscribeToThread(threadId);
    } else if (!isGroup) {
      fetch(`/api/chat/thread?peerId=${peerId}`)
        .then(r => r.json())
        .then((data: { threadId?: number | null }) => {
          const tid = data?.threadId;
          if (tid) {
            setThreadId(windowKey, tid);
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
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (addDebounceRef.current) clearTimeout(addDebounceRef.current);
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
      markRead(windowKey);
    }
  }, [minimized, windowKey, markRead, markReadIfVisible]);

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

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, w: size.width, h: size.msgHeight };
  };
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    // Anchored bottom-right: dragging LEFT (dx<0) widens, dragging UP (dy<0) heightens.
    const width = Math.max(240, Math.min(900, resizeRef.current.w - dx));
    const msgHeight = Math.max(120, Math.min(640, resizeRef.current.h - dy));
    setSize({ width, msgHeight });
  };
  const onResizePointerUp = (_e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    try { window.localStorage.setItem("asciiarena:chat:size", JSON.stringify(sizeRef.current)); } catch { /* ignore */ }
  };

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

  const fetchAddSuggestions = (q: string) => {
    if (addDebounceRef.current) clearTimeout(addDebounceRef.current);
    if (q.length < 1) { setAddSuggestions([]); return; }
    addDebounceRef.current = setTimeout(() => {
      fetch(`/api/chat/users?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) setAddSuggestions(data as Array<{ id: number; nick: string }>);
        })
        .catch(() => {});
    }, 150);
  };

  const selectAddMember = (s: { id: number; nick: string }) => {
    const tid = threadIdRef.current;
    if (!tid) return;
    fetch(`/api/chat/thread/${tid}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: s.id }),
    })
      .then(res => {
        if (!res.ok) return;
        return fetch(`/api/chat/thread/${tid}/members`)
          .then(r => r.json())
          .then(async (list: unknown) => {
            if (!Array.isArray(list)) return;
            const members = list as Array<{ userId: number; nick: string }>;
            const others = members
              .filter(p => p.userId !== parseInt(userId))
              .map(p => ({ id: p.userId, nick: p.nick }));
            const titleData = await (await fetch(`/api/chat/thread/${tid}/title`)).json() as { title?: string };
            const resolvedTitle = titleData?.title ?? resolveDisplayTitle(null, null, others.map(o => o.nick));
            setParticipants(windowKey, others, resolvedTitle);
          });
      })
      .catch(() => {})
      .finally(() => {
        setAddOpen(false);
        setAddSearch("");
        setAddSuggestions([]);
      });
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
      const body: { peerId: number; message: string; threadId?: number } = {
        peerId: isGroup ? (participants[0]?.id ?? peerId) : peerId,
        message: text,
      };
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
        // The block caret (caret-shape: block) doesn't repaint to the start when a
        // controlled input is cleared — a blur+focus cycle forces it to recompute
        // from selectionStart (0). Run after the empty value has committed.
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (!el) return;
          el.blur();
          el.focus();
          el.setSelectionRange(0, 0);
        });
        const newThreadId = data.threadId;
        if ((!tid || tid <= 0) && newThreadId) {
          setThreadId(windowKey, newThreadId);
          subscribeToThread(newThreadId);
        }
        const reloadId = newThreadId ?? (tid && tid > 0 ? tid : null);
        if (reloadId) loadMessages(reloadId);
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const sendAlert = () => {
    const tid = threadIdRef.current;
    if (!tid || tid <= 0) return; // can't yell before the thread exists
    unlockChatAudio();            // this click is a user gesture
    playChatAlert();              // instant local feedback
    triggerFlash();
    fetch("/api/chat/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: tid }),
    }).catch(() => {});
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
    if (w) {
      // Announce immediately (don't wait for the popout window to mount) so the
      // main page's user-channel listener can't re-open a docked twin in the
      // race window before the popout registers itself.
      announcePopoutOpen(peerId);
      closeChat(windowKey);
    }
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
      position: "relative",
      width: `${size.width}px`,
      display: "flex",
      flexDirection: "column",
      border: "1px solid #444",
      backgroundColor: "#111",
      fontFamily: "TopazPlus_a1200, monospace",
      fontSize: "13px",
      lineHeight: "16px",
    }}>
      {!popout && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          title="Drag to resize"
          style={{
            position: "absolute", top: 0, left: 0, width: "14px", height: "14px",
            cursor: "nwse-resize", zIndex: 2,
            background: "linear-gradient(135deg, #666 0 40%, transparent 40%)",
          }}
        />
      )}
      {/* Header */}
      <div style={{
        backgroundColor: flashing ? "#cc7722" : "#444",
        transition: "background-color 120ms",
        padding: "4px 6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: popout ? "default" : "pointer",
        userSelect: "none",
      }} onClick={popout ? undefined : () => minimizeChat(windowKey, true)}>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {editingTitle && !popout ? (
            <input
              autoFocus
              value={titleDraft}
              onClick={e => e.stopPropagation()}
              onChange={e => setTitleDraft(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              onBlur={saveTitle}
              maxLength={128}
              style={{
                flex: 1, minWidth: 0, background: "#111", border: "1px solid #444",
                color: "#ffff55", fontFamily: "TopazPlus_a1200, monospace",
                fontSize: "16px", lineHeight: "16px", padding: "0 4px",
              }}
            />
          ) : (
            <span
              className="yellow"
              onClick={popout ? undefined : (e) => { e.stopPropagation(); setTitleDraft(title); setEditingTitle(true); }}
              title={popout ? undefined : "Click to rename (only you see this name)"}
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: popout ? "default" : "text" }}
            >
              [{title}]
            </span>
          )}
          {isGroup && (
            <span className="lightgrey" style={{ fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {participants.map(p => p.nick).join(", ")}
            </span>
          )}
        </span>
        <span style={{ display: "flex", gap: "4px", flexShrink: 0, position: "relative" }}>
          {threadId ? (
            <button onClick={(e) => { e.stopPropagation(); sendAlert(); }}
              title="Alert everyone in this chat"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              !
            </button>
          ) : null}
          {threadId ? (
            <button
              onClick={(e) => { e.stopPropagation(); setAddOpen(o => !o); setAddSearch(""); setAddSuggestions([]); }}
              title="Add member to this chat"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              +
            </button>
          ) : null}
          {addOpen && (
            <div
              style={{
                position: "absolute", top: "100%", right: 0,
                backgroundColor: "#212121", border: "1px solid #444",
                padding: "6px", display: "flex", flexDirection: "column", gap: "4px",
                minWidth: "160px", zIndex: 100,
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              <input
                type="text"
                value={addSearch}
                onChange={e => { setAddSearch(e.target.value); fetchAddSuggestions(e.target.value); }}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === "Escape") { setAddOpen(false); setAddSearch(""); setAddSuggestions([]); }
                }}
                placeholder="nick..."
                autoFocus
                style={{
                  background: "#111", border: "1px solid #444", color: "#aaaaaa",
                  fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px",
                  padding: "0 8px",
                }}
              />
              {addSuggestions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                  {addSuggestions.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={e => { e.preventDefault(); selectAddMember(s); }}
                      style={{
                        background: "#1a1a1a", border: "1px solid #333", color: "#ffff55",
                        cursor: "pointer", fontFamily: "TopazPlus_a1200, monospace", fontSize: "13px",
                        padding: "2px 4px", textAlign: "left",
                      }}
                    >
                      {s.nick}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!popout && !isGroup && (
            <button onClick={(e) => { e.stopPropagation(); openPopout(); }}
              title="Pop out to a separate window"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              {/* Plain ASCII caret — Amiga / Topaz charset only, matches _ and X. */}
              ^
            </button>
          )}
          {!popout && (
            <button onClick={(e) => { e.stopPropagation(); minimizeChat(windowKey, true); }}
              title="Minimise"
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
              _
            </button>
          )}
          <button onClick={(e) => {
            e.stopPropagation();
            if (popout) window.close();
            else closeChat(windowKey);
          }}
            title={popout ? "Close window" : "Close"}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>
            X
          </button>
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        ...(popout ? { flex: 1, minHeight: 0 } : { height: `${size.msgHeight}px` }),
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
                {isOwn
                  ? (msg.postername ?? userNick)
                  : (msg.postername
                      ?? participants.find(p => p.id === msg.from_id)?.nick
                      ?? "?")}
              </span>
              <span className="lightgrey" style={{ fontSize: "11px" }}>{formatTime(msg.timestamp)}</span>
              <div style={{ color: "#aaaaaa", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.message}
              </div>
            </div>
          );
        })}
        {systemLines.map(s => (
          <div key={`sys-${s.id}`} className="lightgrey" style={{ textAlign: "center", fontSize: "11px", margin: "2px 0", fontFamily: "TopazPlus_a1200, monospace" }}>
            — {s.text} —
          </div>
        ))}
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
          ref={inputRef}
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
          Send
        </button>
      </div>
    </div>
  );
}
