"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatContext } from "@/components/chat/ChatContext";

interface MessageSummary {
  total_count: number;
  thread: number;
  id: number;
  from_id: number | null;
  lastFromMe: boolean;
  preview: string | null;
  timestamp: number | null;
  title: string;
  unread: number;
  left?: boolean;
}

interface ThreadMessage {
  id: number;
  thread: number;
  postedto: string | null;
  postername: string | null;
  subject: string | null;
  message: string | null;
  timestamp: number | null;
}

interface NewMsg {
  receiver: string;
  subject: string;
  msgtext: string;
}

type ActiveTab = "conversations" | "new";

function formatDate(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  userId: string;
  userNick: string;
  initialReceiverId?: number | null;
}

export default function MessagesClient({ userId, userNick, initialReceiverId }: Props) {
  const { openChat, openThread } = useChatContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialReceiverId ? "new" : "conversations");
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [showLeft, setShowLeft] = useState(false);
  const [leftMessages, setLeftMessages] = useState<MessageSummary[]>([]);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [currentThread, setCurrentThread] = useState<ThreadMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [newMsg, setNewMsg] = useState<NewMsg>({
    receiver: initialReceiverId ? String(initialReceiverId) : "",
    subject: "",
    msgtext: "",
  });
  const replyRef = useRef<HTMLTextAreaElement>(null);

  async function loadConversations() {
    setLoadingMsgs(true);
    setMessages([]);
    setCurrentThread([]);
    setSelectedThreadId(null);
    try {
      const res = await fetch(`/api/messages?page=1&pagesize=50`);
      if (res.ok) setMessages((await res.json()) as MessageSummary[]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  useEffect(() => {
    if (!initialReceiverId) loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReceiverId]);

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/live?channel=user:${userId}:messages`);
    es.onmessage = () => {
      if (activeTab === "conversations") loadConversations();
    };
    return () => es.close();
  // loadConversations captured at mount is fine — it only uses setState
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab]);

  function handleTabClick(tab: ActiveTab) {
    setActiveTab(tab);
    setStatusMsg("");
    if (tab === "conversations") loadConversations();
    if (tab === "new") {
      setMessages([]);
      setCurrentThread([]);
      setSelectedThreadId(null);
    }
  }

  async function viewThread(threadId: number, title: string, msg: MessageSummary) {
    setLoadingThread(true);
    setSelectedThreadId(threadId);
    setSelectedSubject(title);

    // Determine receiver for reply: use message id to get replyid from GET /api/messages/[id].
    try {
      const detailRes = await fetch(`/api/messages/${msg.id}`);
      if (detailRes.ok) {
        const detail = (await detailRes.json()) as { replyid: number | null };
        setSelectedReceiverId(detail.replyid ?? null);
      }
    } catch {
      setSelectedReceiverId(null);
    }

    try {
      const res = await fetch(`/api/messages/thread/${threadId}?page=1`);
      if (res.ok) {
        const data = (await res.json()) as ThreadMessage[];
        setCurrentThread(data);
      }
    } finally {
      setLoadingThread(false);
    }
  }

  function closeThread() {
    setCurrentThread([]);
    setSelectedThreadId(null);
    setSelectedReceiverId(null);
  }

  async function loadLeftConversations() {
    setLoadingLeft(true);
    try {
      const res = await fetch(`/api/messages?left=1`);
      if (res.ok) setLeftMessages((await res.json()) as MessageSummary[]);
    } finally {
      setLoadingLeft(false);
    }
  }

  function toggleShowLeft() {
    const next = !showLeft;
    setShowLeft(next);
    if (next) loadLeftConversations();
  }

  async function deleteThread(threadId: number) {
    await fetch(`/api/messages/${threadId}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.thread !== threadId));
    if (selectedThreadId === threadId) closeThread();
    // The thread is now a left chat; if the left list is showing, refresh it.
    if (showLeft) loadLeftConversations();
  }

  async function rejoinThread(threadId: number) {
    const res = await fetch(`/api/chat/thread/${threadId}/rejoin`, { method: "POST" });
    if (res.ok) {
      setLeftMessages((prev) => prev.filter((m) => m.thread !== threadId));
      if (selectedThreadId === threadId) closeThread();
      loadConversations();
      setStatusMsg("Rejoined. The chat is back in your conversations.");
    } else {
      setStatusMsg("Could not rejoin that chat.");
    }
  }

  async function openInChat(threadId: number, title: string) {
    try {
      const list = (await (await fetch(`/api/chat/thread/${threadId}/members`)).json()) as { userId: number; nick: string }[];
      const others = list
        .filter((p) => p.userId !== parseInt(userId))
        .map((p) => ({ id: p.userId, nick: p.nick }));
      if (others.length === 1) openChat(others[0].id, others[0].nick, threadId);
      else openThread(threadId, others, title, { startMinimized: false });
    } catch { /* ignore */ }
  }

  async function sendReply() {
    if (!selectedThreadId) return;
    const text = replyRef.current?.value.trim() ?? "";
    if (!text) {
      setStatusMsg("Reply text is required.");
      return;
    }
    const res = await fetch(`/api/messages/thread/${selectedThreadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread: selectedThreadId,
        subject: selectedSubject || "Re:",
        msgtext: text,
        receiver: selectedReceiverId, // server falls back to thread lookup if null
      }),
    });
    if (res.ok) {
      if (replyRef.current) replyRef.current.value = "";
      // Reload thread
      const threadRes = await fetch(`/api/messages/thread/${selectedThreadId}?page=1`);
      if (threadRes.ok) {
        const data = (await threadRes.json()) as ThreadMessage[];
        setCurrentThread(data);
      }
      setStatusMsg("Reply sent.");
    } else {
      const err = await res.json().catch(() => ({} as { error?: string }));
      setStatusMsg(err.error ?? "Failed to send reply.");
    }
  }

  async function sendMessage() {
    const { receiver, subject, msgtext } = newMsg;
    if (!receiver || !subject || !msgtext) {
      setStatusMsg("All fields are required.");
      return;
    }
    const receiverId = parseInt(receiver, 10);
    if (isNaN(receiverId)) {
      setStatusMsg("Receiver must be a numeric user ID.");
      return;
    }
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, msgtext, receiver: receiverId }),
    });
    if (res.ok) {
      setNewMsg({ receiver: "", subject: "", msgtext: "" });
      setStatusMsg("Message sent.");
    } else {
      const err = (await res.json()) as { error?: string };
      setStatusMsg(err.error ?? "Failed to send message.");
    }
  }

  return (
    <div className="col-lg-12">
      <ul className="nav nav-tabs apt-1 bg-secondary">
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === "conversations" ? " active" : ""}`}
            data-bs-toggle="tab"
            href="#"
            onClick={(e) => { e.preventDefault(); handleTabClick("conversations"); }}
          >
            Conversations
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === "new" ? " active" : ""}`}
            data-bs-toggle="tab"
            href="#"
            onClick={(e) => { e.preventDefault(); handleTabClick("new"); }}
          >
            New Chat
          </a>
        </li>
      </ul>

      {statusMsg && (
        <div className="row aml-1 amr-1 apt-1">
          <div className="col-12 lightgrey small">{statusMsg}</div>
        </div>
      )}

      {/* Conversations list — hidden while viewing a thread */}
      {activeTab === "conversations" && selectedThreadId === null && (
        <div className="aml-1 amr-1">
          <div className="row apt-1 apb-1">
            <div className="col-12">
              <input
                type="button"
                className="btn-big"
                value={showLeft ? "Hide left chats" : "Show left chats"}
                onClick={toggleShowLeft}
              />
            </div>
          </div>
          {showLeft && (
            <div className="amb-1" style={{ border: "1px solid #333" }}>
              <div className="row bg-header apl-1 apt-1 apb-1">
                <div className="col-12 white">Chats you left</div>
              </div>
              {loadingLeft && (
                <div className="row bg-secondary apt-1 apb-1 apl-1">
                  <div className="col-12 lightgrey">Loading...</div>
                </div>
              )}
              {!loadingLeft && leftMessages.length === 0 && (
                <div className="row bg-secondary apt-1 apb-1 apl-1">
                  <div className="col-12 lightgrey">You have not left any chats.</div>
                </div>
              )}
              {leftMessages.map((msg) => (
                <div
                  key={`left-${msg.thread}`}
                  className="row bg-secondary apl-1 apr-1 apt-1 apb-1"
                  style={{ borderBottom: "1px solid #333" }}
                >
                  <div className="col-8 text-truncate">{msg.title}</div>
                  <div className="col-4 text-right lightgrey small">{formatDate(msg.timestamp)}</div>
                  <div className="col-12 apt-1">
                    <input
                      type="button"
                      className="btn-big"
                      value="Read history"
                      onClick={() => viewThread(msg.thread, msg.title, msg)}
                    />
                    {" "}
                    <input
                      type="button"
                      className="btn-big"
                      value="Rejoin"
                      onClick={() => rejoinThread(msg.thread)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {loadingMsgs && (
            <div className="row bg-secondary apt-1 apb-1 apl-1">
              <div className="col-12 lightgrey">Loading...</div>
            </div>
          )}
          {!loadingMsgs && messages.length === 0 && (
            <div className="row bg-secondary apt-1 apb-1 apl-1">
              <div className="col-12 lightgrey">No messages.</div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="row bg-secondary apl-1 apr-1 apt-1 apb-1"
              style={{ borderBottom: "1px solid #333" }}
            >
              <div className="col-8 text-truncate">
                {msg.title}
                {msg.unread > 0 && (
                  <span style={{ color: "#ff55ff" }}> ({msg.unread})</span>
                )}
              </div>
              <div className="col-4 text-right lightgrey small">{formatDate(msg.timestamp)}</div>
              <div className="col-12 apt-1">
                <input
                  type="button"
                  className="btn-big"
                  value="View"
                  onClick={() => viewThread(msg.thread, msg.title, msg)}
                />
                {" "}
                <input
                  type="button"
                  className="btn-big"
                  value="Open in chat"
                  onClick={() => openInChat(msg.thread, msg.title)}
                />
                {" "}
                <input
                  type="button"
                  className="btn-big"
                  value="Leave"
                  onClick={() => deleteThread(msg.thread)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thread view */}
      {selectedThreadId !== null && (
        <div className="container-fluid bg-secondary aml-1 amr-1 apb-1 amt-1">
          <div className="header col-12 bg-header ap-1 d-flex justify-content-between align-items-center">
            <span>{selectedSubject || "(no subject)"}</span>
            <input type="button" className="btn-big" value="Back to conversations" onClick={closeThread} />
          </div>
          {loadingThread && (
            <div className="row apl-1 apt-1">
              <div className="col-12 lightgrey">Loading thread...</div>
            </div>
          )}
          {currentThread.map((tm) => (
            <div
              key={tm.id}
              className="row apl-1 apr-1 apb-1 apt-1"
              style={{ borderBottom: "1px solid #222" }}
            >
              <div className="col-12">
                <span className="yellow">{tm.postername ?? userNick}</span>{" "}
                <span className="lightgrey small">{formatDate(tm.timestamp)}</span>
              </div>
              <div className="col-12 apt-1" style={{ whiteSpace: "pre-wrap" }}>
                {tm.message}
              </div>
            </div>
          ))}
          <div className="row apl-1 apr-1 apt-1">
            <div className="col-12 apb-1">
              <textarea
                className="w-100 bg-secondary"
                id="reply-text"
                ref={replyRef}
                rows={4}
                style={{ color: "#aaa" }}
                placeholder="Write your reply..."
              />
            </div>
            <div className="col-12">
              <input type="button" className="btn-big" value="Reply" onClick={sendReply} />
              {" "}
              <input type="button" className="btn-big" value="Close" onClick={closeThread} />
            </div>
          </div>
        </div>
      )}

      {/* New message form */}
      {activeTab === "new" && (
        <div className="container-fluid bg-secondary aml-1 amr-1">
          <div className="row apl-1 apr-1 apt-1 apb-1">
            <div className="col-3"><span className="white">User ID:</span></div>
            <div className="col-9">
              <input
                type="number"
                className="form-control"
                value={newMsg.receiver}
                onChange={(e) => setNewMsg((p) => ({ ...p, receiver: e.target.value }))}
                placeholder="Recipient user ID"
              />
            </div>
          </div>
          <div className="row apl-1 apr-1 apb-1">
            <div className="col-3"><span className="white">Subject:</span></div>
            <div className="col-9">
              <input
                type="text"
                className="form-control"
                value={newMsg.subject}
                onChange={(e) => setNewMsg((p) => ({ ...p, subject: e.target.value }))}
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
                value={newMsg.msgtext}
                onChange={(e) => setNewMsg((p) => ({ ...p, msgtext: e.target.value }))}
                placeholder="Write your message..."
              />
            </div>
          </div>
          <div className="row apl-1 apr-1 apb-1">
            <div className="col-12">
              <input type="button" className="btn-big" value="Send" onClick={sendMessage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
