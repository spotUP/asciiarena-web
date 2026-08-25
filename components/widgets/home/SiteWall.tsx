"use client";
import React, { useEffect, useRef, useState } from "react";
import { ansiToHtml } from "@/lib/ansi";
import PrintLines from "@/components/ui/PrintLines";
import { subscribeRaw } from "@/lib/sse-pool";

interface WallPost { tag: string | null; nick: string | null }
interface Draft { nick: string; text: string }
interface LiveEvent { type: string; nick?: string; draft?: string; tag?: string }

const WALL_ID = 1;
const CHANNEL = `wall:${WALL_ID}`;
const DRAFT_TTL = 4000;
// The wall API returns up to 13 posts (ORDER BY id DESC LIMIT 13). Reserve
// that many lines so the empty-on-load posts area holds its height instead
// of popping in and pushing the rest of the page down.
const WALL_POST_LIMIT = 13;

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
    return subscribeRaw(CHANNEL, (raw) => {
      if (!raw) return;
      const event = raw as unknown as LiveEvent;
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
    });
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
        <div className="bg-secondary apt-1 apb-1" style={{ paddingLeft: "8px" }}>
          {/* Each post is its own grid row so PrintLines can animate one line
              at a time and reserve height. Live typing drafts stay below. */}
          <PrintLines reserveLines={WALL_POST_LIMIT}>
            {posts.map((p, i) => (
              <div className="row m-0 p-0" key={i}>
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
              </div>
            ))}
          </PrintLines>
          {activeDrafts.map(d => (
            <div className="row m-0 p-0" key={d.nick}>
              <div className="col-10 d-flex">
                <span className="text-truncate lightgrey" style={{ whiteSpace: "pre" }}>
                  {d.text}<span className="cursor-block" />
                </span>
              </div>
              <div className="col-2 text-right">
                <span className="lightpink">{d.nick}</span>
              </div>
            </div>
          ))}
        </div>

        {isLoggedIn && (
          <form onSubmit={handleSubmit} className="w-100">
            {/* Flex, not a 12-column grid: the button used to hold a whole
                col-lg-1 -- around 165px on a wide screen -- for a
                three-character label, and the input stopped short of it.
                Now the button is as wide as its own text and the input
                takes everything else. */}
            <div className="d-flex m-0" style={{ paddingLeft: "8px" }}>
              <input
                ref={inputRef}
                className="form-control"
                style={{ flex: 1, minWidth: 0 }}
                type="text"
                maxLength={60}
                name="tagtext"
                placeholder="Tag the wall"
                required
                autoComplete="off"
                disabled={submitting}
                onChange={e => broadcastTyping(e.target.value)}
              />
              {/* .btn-big is the site's standard button. It was .btn-primary,
                  which used to carry a fixed `width: 132px` and held that much
                  of the row whatever its label said; that width is gone now,
                  but the standard button is still the right one here. */}
              <button className="btn-big black bg-lightgrey" style={{ flex: "0 0 auto" }} type="submit" disabled={submitting}>Tag</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
