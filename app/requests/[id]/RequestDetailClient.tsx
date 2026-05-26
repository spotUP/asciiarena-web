"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { postRequestComment, updateRequestStatus } from "@/app/actions/requests";

interface Comment {
  id?: number;
  user: string | null;
  time: string | null;
  comment: string | null;
  filename: string | null;
}

interface Draft { nick: string; text: string }
interface LiveEvent { type: string; nick?: string; draft?: string }

interface Props {
  requestId: number;
  canChangeStatus: boolean;
  isLoggedIn: boolean;
  userNick?: string | null;
}

export default function RequestDetailClient({ requestId, canChangeStatus, isLoggedIn, userNick }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postResult, setPostResult] = useState("");
  const [statusResult, setStatusResult] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [watching, setWatching] = useState(0);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channel = `requests:${requestId}`;

  const flash = (msg: string, setter: (s: string) => void) => {
    setter(msg);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setter(""), 3000);
  };

  const loadComments = useCallback(async () => {
    try {
      const data: Comment[] = await (await fetch(`/api/requests/${requestId}/comments`)).json();
      setComments(data ?? []);
      setCommentsLoaded(true);
    } catch {
      setCommentsLoaded(true);
    }
  }, [requestId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${channel}`);
    es.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as LiveEvent;
      if (event.type === "watching") {
        setWatching((event as { count?: number }).count ?? 0);
      } else if (event.type === "typing" && event.nick) {
        const nick = event.nick;
        setDrafts(prev => ({ ...prev, [nick]: { nick, text: event.draft ?? "" } }));
        clearTimeout(draftTimers.current[nick]);
        draftTimers.current[nick] = setTimeout(() => {
          setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
        }, 4000);
      } else if (event.type === "clear" && event.nick) {
        const nick = event.nick;
        clearTimeout(draftTimers.current[nick]);
        setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
      } else if (event.type === "posted") {
        loadComments();
      }
    };
    return () => es.close();
  }, [channel, loadComments]);

  const broadcastTyping = (text: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type: text ? "typing" : "clear", draft: text }),
      }).catch(() => {});
    }, 50);
  };

  const postComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    const r = await postRequestComment(requestId, text);
    if (r.success) {
      setCommentText("");
      flash("Comment posted.", setPostResult);
      loadComments();
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, type: "clear" }),
      }).catch(() => {});
    } else {
      flash(r.error ?? "Failed to post comment.", setPostResult);
    }
  };

  const changeStatus = async (newStatus: number) => {
    const r = await updateRequestStatus(requestId, newStatus);
    if (r.success) {
      window.location.reload();
    } else {
      flash(r.error ?? "Failed to update status.", setStatusResult);
    }
  };

  const activeDrafts = Object.values(drafts).filter(d => d.text && d.nick !== userNick);

  return (
    <>
      {canChangeStatus && (
        <div className="col-lg-12 pl-0 apb-1">
          <span className="lightgrey">Change status: </span>
          {([
            { label: "Open", value: 0 },
            { label: "Close (Unfulfilled)", value: 1 },
            { label: "Close (Fulfilled)", value: 2 },
          ] as const).map(opt => (
            <button
              key={opt.value}
              className="btn-secondary apr-1"
              style={{ marginRight: "4px", cursor: "pointer" }}
              onClick={() => changeStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          {statusResult && <span>{statusResult}</span>}
        </div>
      )}

      <div className="row apt-1 apb-1">
        <h2 className="bg-header">
          Comments
          {watching > 1 && (
            <span className="lightgrey" style={{ fontSize: "13px", marginLeft: "12px" }}>
              {watching} viewing
            </span>
          )}
        </h2>
      </div>

      <div>
        {!commentsLoaded && <div className="lightgrey col-lg-12 pl-0">Loading...</div>}
        {commentsLoaded && comments.length === 0 && activeDrafts.length === 0 && (
          <div className="lightgrey col-lg-12 pl-0">No comments yet.</div>
        )}
        {comments.map((c, i) => (
          <div key={i} className="col-lg-12 pl-0 apb-1 bg-secondary ap-1" style={{ marginBottom: "4px" }}>
            <div className="d-flex justify-content-between">
              <a href={`/member/${c.user ?? ""}`}>{c.user ?? "unknown"}</a>
              <span className="lightgrey">{c.time ?? ""}</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", marginTop: "4px" }}>{c.comment ?? ""}</div>
            {c.filename && (
              <div className="apt-1">
                <span className="lightgrey">Attachment: </span>{c.filename}
              </div>
            )}
          </div>
        ))}
        {activeDrafts.map(d => (
          <div key={d.nick} className="col-lg-12 pl-0 apb-1 bg-secondary ap-1" style={{ marginBottom: "4px", opacity: 0.7 }}>
            <div className="d-flex justify-content-between">
              <span className="lightgrey">{d.nick} <span className="lightgrey">(typing...)</span></span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", marginTop: "4px" }} className="lightgrey">
              {d.text}<span className="cursor-block" />
            </div>
          </div>
        ))}
      </div>

      {isLoggedIn && (
        <div className="col-lg-12 pl-0 apt-1">
          <div className="row apb-1">
            <div className="col-lg-12">
              <textarea
                className="form-control"
                rows={4}
                placeholder="Add a comment..."
                style={{ resize: "vertical" }}
                value={commentText}
                onChange={e => { setCommentText(e.target.value); broadcastTyping(e.target.value); }}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <input type="button" className="btn-big" value="POST COMMENT" onClick={postComment} />
              {postResult && <span className="apl-1">{postResult}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
