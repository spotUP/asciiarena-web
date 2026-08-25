"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatContext, threadKey } from "@/components/chat/ChatContext";
import ChatWindow from "@/components/chat/ChatWindow";
import UserPicker, { type PickableUser } from "@/components/chat/UserPicker";
import RelativeTime from "@/components/widgets/RelativeTime";
import { buildInboxRow } from "@/lib/inboxRow";
import { deepLinkThreadChange } from "@/lib/messages-deeplink";
import { subscribeRaw } from "@/lib/sse-pool";

// One conversation as the inbox sees it. The API returns the raw parts
// (subject, participants, preview) rather than one pre-formatted title, because
// a single string cannot say "re: logo swap, with spot and dipswitch".
interface Conversation {
  thread: number;
  id: number;
  from_id: number | null;
  lastFromMe: boolean;
  preview: string | null;
  lastSenderNick: string | null;
  timestamp: number | null;
  title: string;
  overrideTitle: string | null;
  subject: string | null;
  participants: Array<{ id: number; nick: string }>;
  unread: number;
  left: boolean;
  archived: boolean;
}

type View = "active" | "archived" | "left";

const VIEWS: Array<{ key: View; label: string }> = [
  { key: "active", label: "Conversations" },
  { key: "archived", label: "Archived" },
  { key: "left", label: "Left chats" },
];

const SEARCH_DEBOUNCE_MS = 250;

const rowDomId = (thread: number) => `conversation-${thread}`;

interface Props {
  userId: string;
  userNick: string;
  initialReceiverId?: number | null;
  initialThreadId?: number | null;
}

export default function MessagesClient({ userId, userNick, initialReceiverId, initialThreadId }: Props) {
  const { openChat, openThread } = useChatContext();
  const [view, setView] = useState<View>("active");
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  // The thread whose chat is expanded underneath its row. A notification links
  // straight to one (/messages?thread=123), which is the whole point.
  const [expanded, setExpanded] = useState<number | null>(initialThreadId ?? null);
  // useState only reads its argument on the FIRST render. Clicking a bell
  // notification while already on /messages is a same-route navigation: the
  // query changes and this prop changes with it, but the component never
  // remounts, so `expanded` kept whatever thread was already open and the
  // notification appeared to do nothing. Measured: sitting on ?thread=2212 and
  // clicking a notification for 1518 moved the URL and left 2212 expanded.
  // This is React's "adjust state when a prop changes" pattern -- done during
  // render rather than in an effect, so it takes effect in the same commit and
  // does not trip the set-state-in-effect rule.
  const [syncedThreadId, setSyncedThreadId] = useState<number | null | undefined>(initialThreadId);
  const deepLink = deepLinkThreadChange(syncedThreadId, initialThreadId);
  if (deepLink.changed) {
    setSyncedThreadId(initialThreadId);
    if (deepLink.openThread !== null) setExpanded(deepLink.openThread);
  }
  const [composing, setComposing] = useState(!!initialReceiverId);
  const [status, setStatus] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Scroll anchoring for the expanded row across list refreshes.
  const expandedRef = useRef<number | null>(expanded);
  const pendingAnchor = useRef<{ thread: number; top: number } | null>(null);
  useEffect(() => { expandedRef.current = expanded; }, [expanded]);

  // Restore the anchored row to the same viewport position after the list
  // re-renders. useLayoutEffect so the correction lands before paint and the
  // user never sees the intermediate position.
  useLayoutEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor) return;
    pendingAnchor.current = null;
    const el = document.getElementById(rowDomId(anchor.thread));
    if (!el) return;
    const delta = el.getBoundingClientRect().top - anchor.top;
    if (delta !== 0) window.scrollBy(0, delta);
  }, [rows]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  const load = useCallback(async () => {
    // Anchor the expanded conversation before the list changes under it. The
    // list is ordered by last activity, so reading or sending moves a thread
    // to the top — without this the chat you are reading slides around the
    // page every time anything happens.
    const anchorEl = expandedRef.current != null
      ? document.getElementById(rowDomId(expandedRef.current))
      : null;
    pendingAnchor.current = anchorEl ? { thread: expandedRef.current!, top: anchorEl.getBoundingClientRect().top } : null;

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", pagesize: "50" });
      if (view === "left") params.set("left", "1");
      if (view === "archived") params.set("archived", "1");
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (unreadOnly) params.set("unread", "1");
      const res = await fetch(`/api/messages?${params.toString()}`);
      if (res.ok) setRows((await res.json()) as Conversation[]);
    } finally {
      setLoading(false);
    }
  }, [view, debouncedQuery, unreadOnly]);

  useEffect(() => { void load(); }, [load]);

  // Live inbox: new message, read cursor moved, archived, rejoined.
  useEffect(() => {
    if (!userId) return;
    // Same channel ChatBar and UnreadBadge already hold; the pool means this
    // page adds no third connection.
    return subscribeRaw(`user:${userId}:messages`, () => { void load(); });
  }, [userId, load]);

  // A deep-linked thread may not be in the current list at all — it can be
  // archived, LEFT, or past the first page. Pull just that one so the link
  // always lands on the conversation instead of a bare list.
  //
  // This used to build the row here from the members endpoint, which cannot
  // report membership, so it hardcoded `left: false` and `archived: false`. For
  // a thread the user had left that was wrong in a way they could not get out
  // of: the row rendered a ChatWindow rather than "You left this chat — Rejoin
  // to read it", and /api/messages/thread clamps a left member's history to
  // `timestamp <= left_at`. The result was a conversation missing everything
  // said since, with no explanation and no Rejoin button.
  //
  // /api/messages?thread=N answers with the row the inbox itself would show,
  // flags included, so there is nothing left to guess.
  useEffect(() => {
    if (expanded == null || loading) return;
    if (rows.some(r => r.thread === expanded)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/messages?thread=${expanded}`);
        if (!res.ok) return;
        const fetched = (await res.json()) as Conversation[];
        const row = fetched[0];
        if (cancelled || !row) return;
        setRows(prev => prev.some(r => r.thread === expanded) ? prev : [row, ...prev]);
      } catch { /* the row simply stays absent */ }
    })();
    return () => { cancelled = true; };
  }, [expanded, rows, loading, userId]);

  function toggleExpand(thread: number) {
    setStatus("");
    setExpanded(prev => {
      if (prev === thread) return null;
      // The inline ChatWindow POSTs /api/chat/read on mount; clear the badge
      // straight away so the row does not sit there looking unread.
      setRows(rs => rs.map(r => (r.thread === thread ? { ...r, unread: 0 } : r)));
      return thread;
    });
  }

  async function setArchived(thread: number, archived: boolean) {
    const res = await fetch(`/api/chat/thread/${thread}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) { setStatus(archived ? "Could not archive that conversation." : "Could not unarchive that conversation."); return; }
    if (expanded === thread) setExpanded(null);
    void load();
  }

  async function leaveThread(thread: number) {
    const res = await fetch(`/api/messages/${thread}`, { method: "DELETE" });
    if (!res.ok) { setStatus("Could not leave that conversation."); return; }
    if (expanded === thread) setExpanded(null);
    void load();
  }

  async function rejoinThread(thread: number) {
    const res = await fetch(`/api/chat/thread/${thread}/rejoin`, { method: "POST" });
    setStatus(res.ok ? "Rejoined. The chat is back in your conversations." : "Could not rejoin that chat.");
    if (res.ok) { setView("active"); }
  }

  function openInDock(row: Conversation) {
    if (row.participants.length === 1) openChat(row.participants[0].id, row.participants[0].nick, row.thread);
    else openThread(row.thread, row.participants, row.title, { startMinimized: false });
  }

  return (
    <div className="col-lg-12">
      <ul className="nav nav-tabs apt-1 bg-secondary">
        {VIEWS.map(v => (
          <li className="nav-item" key={v.key}>
            <a
              className={`nav-link${view === v.key && !composing ? " active" : ""}`}
              href="#"
              onClick={e => { e.preventDefault(); setComposing(false); setView(v.key); setStatus(""); }}
            >
              {v.label}
            </a>
          </li>
        ))}
        <li className="nav-item">
          <a
            className={`nav-link${composing ? " active" : ""}`}
            href="#"
            onClick={e => { e.preventDefault(); setComposing(true); setStatus(""); }}
          >
            New message
          </a>
        </li>
      </ul>

      {status && (
        <div className="row aml-1 amr-1 apt-1">
          <div className="col-12 lightgrey">{status}</div>
        </div>
      )}

      {composing ? (
        <Composer
          initialReceiverId={initialReceiverId ?? null}
          onSent={threadId => {
            setComposing(false);
            setView("active");
            setExpanded(threadId);
            setStatus("Message sent.");
          }}
          onError={setStatus}
        />
      ) : (
        <div className="aml-1 amr-1">
          {/* Filters */}
          <div className="row apt-1 apb-1" style={{ gap: "8px" }}>
            <div className="col-12 d-flex" style={{ gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                className="form-control search-field"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search subject or nick..."
                style={{ maxWidth: "320px" }}
              />
              <input
                type="button"
                className="btn-big"
                value={unreadOnly ? "Showing unread only" : "Show unread only"}
                onClick={() => setUnreadOnly(v => !v)}
              />
            </div>
          </div>

          {/* Only on the very first load. Rendering this above the list on
              every background refresh (which fires on each SSE event, and on
              every read cursor update) pushed the whole list down a row and
              back — the layout "jumping" while reading a conversation. */}
          {loading && rows.length === 0 && (
            <div className="row bg-secondary apt-1 apb-1 apl-1">
              <div className="col-12 lightgrey">Loading...</div>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="row bg-secondary apt-1 apb-1 apl-1">
              <div className="col-12 lightgrey">
                {debouncedQuery || unreadOnly ? "Nothing matches that filter."
                  : view === "archived" ? "No archived conversations."
                  : view === "left" ? "You have not left any chats."
                  : "No conversations yet."}
              </div>
            </div>
          )}

          {rows.map(row => {
            const model = buildInboxRow({
              overrideTitle: row.overrideTitle,
              subject: row.subject,
              participants: row.participants,
              preview: row.preview,
              lastSenderNick: row.lastSenderNick,
              lastFromMe: row.lastFromMe,
              unread: row.unread,
            });
            const isOpen = expanded === row.thread;
            return (
              <div
                key={row.thread}
                id={rowDomId(row.thread)}
                className="bg-secondary apl-1 apr-1 apt-1 apb-1"
                style={{
                  borderBottom: "1px solid #333",
                  // Unread gets a real treatment, not a parenthesised number
                  // hiding at the end of the title.
                  borderLeft: model.isUnread ? "8px solid #ff55ff" : "8px solid transparent",
                  background: model.isUnread ? "#262626" : undefined,
                }}
              >
                <div
                  onClick={() => toggleExpand(row.thread)}
                  style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "flex-start" }}
                >
                  <span style={{ width: "16px", flexShrink: 0 }} className="lightgrey">{isOpen ? "v" : ">"}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="d-flex" style={{ gap: "8px", alignItems: "baseline" }}>
                      <span
                        className={model.isUnread ? "white" : "lightcyan"}
                        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {model.heading}
                      </span>
                      {row.unread > 0 && <span className="magenta" style={{ flexShrink: 0 }}>{row.unread} new</span>}
                    </span>
                    {model.participantLine && (
                      <span className="d-block lightgrey text-truncate">{model.participantLine}</span>
                    )}
                    {model.previewLine && (
                      <span className="d-block text-truncate" style={{ color: "#777777" }}>{model.previewLine}</span>
                    )}
                  </span>
                  <span className="lightgrey" style={{ flexShrink: 0 }}>
                    {row.timestamp ? <RelativeTime unix={row.timestamp} /> : ""}
                  </span>
                </div>

                {isOpen && (
                  <div className="apt-1">
                    {row.left ? (
                      <div className="lightgrey apb-1">
                        You left this chat. Rejoin to read it and take part again.
                      </div>
                    ) : (
                      <ChatWindow
                        windowKey={threadKey(row.thread)}
                        threadId={row.thread}
                        isGroup={row.participants.length > 1}
                        peerId={row.participants[0]?.id ?? 0}
                        title={row.title}
                        participants={row.participants}
                        minimized={false}
                        userId={userId}
                        userNick={userNick}
                        variant="inline"
                        onClose={() => setExpanded(null)}
                      />
                    )}
                    <div className="apt-1 d-flex" style={{ gap: "8px", flexWrap: "wrap" }}>
                      {row.left ? (
                        <input type="button" className="btn-big" value="Rejoin" onClick={() => rejoinThread(row.thread)} />
                      ) : (
                        <>
                          <input type="button" className="btn-big" value="Open in chat dock" onClick={() => openInDock(row)} />
                          {view === "archived"
                            ? <input type="button" className="btn-big" value="Unarchive" onClick={() => setArchived(row.thread, false)} />
                            : <input type="button" className="btn-big" value="Archive" onClick={() => setArchived(row.thread, true)} />}
                          <input type="button" className="btn-big" value="Leave" onClick={() => leaveThread(row.thread)} />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// New conversation. Recipients are picked by nick — the old form asked for a
// numeric user ID, which nobody knows. Two or more recipients start a group
// thread, which the backend has supported all along.
function Composer({
  initialReceiverId,
  onSent,
  onError,
}: {
  initialReceiverId: number | null;
  onSent: (threadId: number) => void;
  onError: (msg: string) => void;
}) {
  const [recipients, setRecipients] = useState<PickableUser[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Arriving from a "send a message" link on someone's profile: resolve the id
  // to a nick so the picker shows a name rather than a number.
  useEffect(() => {
    if (!initialReceiverId) return;
    let cancelled = false;
    fetch(`/api/chat/user?id=${initialReceiverId}`)
      .then(r => (r.ok ? r.json() : null))
      .then((u: { id?: number; nick?: string } | null) => {
        if (cancelled || !u?.id || !u.nick) return;
        setRecipients([{ id: u.id, nick: u.nick }]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [initialReceiverId]);

  async function send() {
    if (recipients.length === 0) { onError("Pick at least one recipient."); return; }
    if (!subject.trim() || !body.trim()) { onError("Subject and message are both required."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, msgtext: body, receivers: recipients.map(r => r.id) }),
      });
      const data = (await res.json().catch(() => ({}))) as { threadId?: number; error?: string };
      if (!res.ok) { onError(data.error ?? "Failed to send message."); return; }
      setRecipients([]); setSubject(""); setBody("");
      onSent(data.threadId ?? 0);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-fluid bg-secondary aml-1 amr-1">
      <div className="row apl-1 apr-1 apt-1 apb-1">
        <div className="col-3"><span className="white">To:</span></div>
        <div className="col-9">
          {recipients.length > 0 && (
            <div className="d-flex apb-1" style={{ gap: "8px", flexWrap: "wrap" }}>
              {recipients.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecipients(prev => prev.filter(p => p.id !== r.id))}
                  title="Remove"
                  style={{
                    background: "#1a1a1a", border: "1px solid #333", color: "#ffff55",
                    fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px",
                    height: "16px", padding: "0 8px", cursor: "pointer",
                  }}
                >
                  {r.nick} x
                </button>
              ))}
            </div>
          )}
          <UserPicker
            excludeIds={recipients.map(r => r.id)}
            onPick={u => setRecipients(prev => (prev.some(p => p.id === u.id) ? prev : [...prev, u]))}
            placeholder="Type a nick..."
            width="320px"
          />
          {recipients.length > 1 && (
            <div className="lightgrey apt-1">This will start a group chat with {recipients.length} people.</div>
          )}
        </div>
      </div>
      <div className="row apl-1 apr-1 apb-1">
        <div className="col-3"><span className="white">Subject:</span></div>
        <div className="col-9">
          <input
            type="text"
            className="form-control"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
      </div>
      <div className="row apl-1 apr-1 apb-1">
        <div className="col-12">
          <textarea
            className="w-100 bg-secondary"
            rows={6}
            style={{ color: "#aaa" }}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message..."
          />
        </div>
      </div>
      <div className="row apl-1 apr-1 apb-1">
        <div className="col-12">
          <input type="button" className="btn-big" value={sending ? "Sending..." : "Send"} disabled={sending} onClick={send} />
        </div>
      </div>
    </div>
  );
}
