"use client";

import React, { useEffect, useRef, useState } from "react";

interface MessageSummary {
  id: number;
  thread: number;
  postedto: string | null;
  postername: string | null;
  subject: string | null;
  message: string | null;
  new: number | null;
  timestamp: number | null;
  total_count: number;
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

type ActiveTab = "inbox" | "outbox" | "new";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialReceiverId ? "new" : "inbox");
  const [messages, setMessages] = useState<MessageSummary[]>([]);
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

  async function loadBox(box: 1 | 2) {
    setLoadingMsgs(true);
    setMessages([]);
    setCurrentThread([]);
    setSelectedThreadId(null);
    try {
      const res = await fetch(`/api/messages?box=${box}&page=1&pagesize=50`);
      if (res.ok) {
        const data = (await res.json()) as MessageSummary[];
        setMessages(data);
      }
    } finally {
      setLoadingMsgs(false);
    }
  }

  useEffect(() => {
    if (!initialReceiverId) loadBox(1);
  }, [initialReceiverId]);

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/live?channel=user:${userId}:messages`);
    es.onmessage = () => {
      if (activeTab === "inbox") loadBox(1);
    };
    return () => es.close();
  // loadBox captured at mount is fine — it only uses setState
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab]);

  function handleTabClick(tab: ActiveTab) {
    setActiveTab(tab);
    setStatusMsg("");
    if (tab === "inbox") loadBox(1);
    if (tab === "outbox") loadBox(2);
    if (tab === "new") {
      setMessages([]);
      setCurrentThread([]);
      setSelectedThreadId(null);
    }
  }

  async function viewThread(threadId: number, subject: string, msg: MessageSummary) {
    setLoadingThread(true);
    setSelectedThreadId(threadId);
    setSelectedSubject(subject);

    // Determine receiver: in inbox the sender is postername, we need their id.
    // The API DELETE uses thread id, reply POST needs receiver user id.
    // We use message id to get replyid from GET /api/messages/[id].
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

  async function deleteThread(threadId: number) {
    await fetch(`/api/messages/${threadId}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.thread !== threadId));
    if (selectedThreadId === threadId) closeThread();
  }

  async function sendReply() {
    if (!selectedThreadId || !selectedReceiverId) return;
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
        subject: selectedSubject,
        msgtext: text,
        receiver: selectedReceiverId,
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
      setStatusMsg("Failed to send reply.");
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

  const isInbox = activeTab === "inbox";

  return (
    <div className="col-lg-12">
      <ul className="nav nav-tabs apt-1 bg-secondary">
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === "inbox" ? " active" : ""}`}
            data-bs-toggle="tab"
            href="#"
            onClick={(e) => { e.preventDefault(); handleTabClick("inbox"); }}
          >
            Inbox
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === "outbox" ? " active" : ""}`}
            data-bs-toggle="tab"
            href="#"
            onClick={(e) => { e.preventDefault(); handleTabClick("outbox"); }}
          >
            Outbox
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link${activeTab === "new" ? " active" : ""}`}
            data-bs-toggle="tab"
            href="#"
            onClick={(e) => { e.preventDefault(); handleTabClick("new"); }}
          >
            New Message
          </a>
        </li>
      </ul>

      {statusMsg && (
        <div className="row aml-1 amr-1 apt-1">
          <div className="col-12 lightgrey small">{statusMsg}</div>
        </div>
      )}

      {/* Inbox / Outbox list */}
      {(activeTab === "inbox" || activeTab === "outbox") && (
        <div className="aml-1 amr-1">
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
          {messages.map((msg) => {
            const nick = isInbox ? (msg.postername ?? "") : (msg.postedto ?? "");
            const label = isInbox ? "From" : "To";
            return (
              <div
                key={msg.id}
                className="row bg-secondary apl-1 apr-1 apt-1 apb-1"
                style={{ borderBottom: "1px solid #333" }}
              >
                <div className="col-7 text-truncate">{msg.subject ?? "(no subject)"}</div>
                <div className="col-3 text-truncate yellow" title={`${label}: ${nick}`}>{nick}</div>
                <div className="col-2 text-right lightgrey small">{formatDate(msg.timestamp)}</div>
                <div className="col-12 apt-1">
                  <input
                    type="button"
                    className="btn-big"
                    value="View"
                    onClick={() => viewThread(msg.thread, msg.subject ?? "", msg)}
                  />
                  {" "}
                  <input
                    type="button"
                    className="btn-big"
                    value="Delete"
                    onClick={() => deleteThread(msg.thread)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thread view */}
      {selectedThreadId !== null && currentThread.length > 0 && (
        <div className="container-fluid bg-secondary aml-1 amr-1 apb-1 amt-1">
          <div className="header col-12 bg-header ap-1">{selectedSubject}</div>
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
