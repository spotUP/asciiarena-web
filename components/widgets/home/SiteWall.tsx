"use client";
import React, { useEffect, useRef, useState } from "react";
import { ansiToHtml } from "@/lib/ansi";

interface WallPost { tag: string | null; nick: string | null }
interface Draft { nick: string; text: string }
interface LiveEvent { type: string; nick?: string; draft?: string; tag?: string }

const WALL_ID = 1;
const CHANNEL = `wall:${WALL_ID}`;
const DRAFT_TTL = 4000;

export default function SiteWall({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    fetch(`/api/wall?wall_id=${WALL_ID}`)
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setPosts(d as WallPost[]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${CHANNEL}`);
    es.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as LiveEvent;
      if (event.type === "typing" && event.nick) {
        const nick = event.nick;
        setDrafts(prev => ({ ...prev, [nick]: { nick, text: event.draft ?? "" } }));
        clearTimeout(draftTimers.current[nick]);
        draftTimers.current[nick] = setTimeout(() => {
          setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
        }, DRAFT_TTL);
      } else if (event.type === "clear" && event.nick) {
        const nick = event.nick;
        clearTimeout(draftTimers.current[nick]);
        setDrafts(prev => { const next = { ...prev }; delete next[nick]; return next; });
      } else if (event.type === "posted") {
        fetch(`/api/wall?wall_id=${WALL_ID}`)
          .then(r => r.json())
          .then((d: unknown) => { if (Array.isArray(d)) setPosts(d as WallPost[]); })
          .catch(() => {});
      }
    };
    return () => es.close();
  }, []);

  const broadcastTyping = (text: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: CHANNEL, type: text ? "typing" : "clear", draft: text }),
      }).catch(() => {});
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against double-submit: synchronous ref so a second submit fired
    // before React re-renders the button-disabled state still gets blocked.
    if (inFlight.current) return;
    const input = inputRef.current;
    const text = input?.value?.trim();
    if (!text) return;
    inFlight.current = true;
    setSubmitting(true);
    if (input) input.value = "";
    fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagtext: text, wall_id: WALL_ID }),
    })
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setPosts(data as WallPost[]);
        fetch("/api/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: CHANNEL, type: "clear" }),
        }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => {
        inFlight.current = false;
        setSubmitting(false);
      });
  };

  const activeDrafts = Object.values(drafts).filter(d => d.text.length > 0);

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12 p-0">
        <h2 className="apt-1 apb-1 bg-header">TAG THE aSCIIaRENA WALL</h2>
      </div>
      <div className="container-fluid m-0 p-0">
        <div className="row m-0 p-0 bg-secondary apt-1 apb-1" style={{ paddingLeft: "8px" }}>
          {posts.map((p, i) => (
            <React.Fragment key={i}>
              <div className="col-10 d-flex">
                <span
                  className="text-truncate"
                  style={{ whiteSpace: "pre" }}
                  dangerouslySetInnerHTML={{ __html: ansiToHtml(p.tag ?? "") }}
                />
              </div>
              <div className="col-2 text-right">
                <span className="lightpink">{p.nick ?? ""}</span>
              </div>
            </React.Fragment>
          ))}
          {activeDrafts.map(d => (
            <React.Fragment key={d.nick}>
              <div className="col-10 d-flex">
                <span className="text-truncate lightgrey" style={{ whiteSpace: "pre" }}>
                  {d.text}<span className="cursor-block" />
                </span>
              </div>
              <div className="col-2 text-right">
                <span className="lightpink">{d.nick}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {isLoggedIn && (
          <form onSubmit={handleSubmit} className="w-100">
            <div className="row m-0">
              <div className="col-10 col-lg-11 pr-0" style={{ paddingLeft: "8px" }}>
                <input
                  ref={inputRef}
                  className="form-control w-100"
                  type="text"
                  maxLength={60}
                  name="tagtext"
                  placeholder="Tag the wall"
                  required
                  autoComplete="off"
                  disabled={submitting}
                  onChange={e => broadcastTyping(e.target.value)}
                />
              </div>
              <div className="col-2 col-lg-1 bg-secondary m-0 p-0">
                <button className="button w-100 btn-primary black bg-lightgrey" type="submit" disabled={submitting}>Tag</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
