"use client";
import React, { useEffect, useRef, useState } from "react";
import { ansiToHtml } from "@/lib/ansi";
import { useScenewall } from "@/lib/useScenewall";
import PrintLines from "@/components/ui/PrintLines";
import { subscribeRaw } from "@/lib/sse-pool";

interface WallPost { userName: string; comment: string; source: string }
interface Draft { nick: string; text: string }
interface LiveEvent { type: string; nick?: string; draft?: string }

// Local-only SSE channel: other asciiarena.se users see each other typing the
// global wall in real time. Posts themselves still go through scenewall.bbs.io
// (which we don't control), so federated users on other sites won't be seen
// typing — only people on this site, while we share the SSE channel.
const CHANNEL = "globalwall:1";
const DRAFT_TTL = 4000;
// The upstream returns itemcount=15 (see lib/scenewall.ts globalwall URL).
const EXPECTED_LINES = 15;

function loadPosts(set: (p: WallPost[]) => void) {
  fetch("/api/scenewall?endpoint=globalwall")
    .then(r => r.json())
    .then((data: unknown) => { if (Array.isArray(data)) set(data as WallPost[]); })
    .catch(() => {});
}

// Module-level so the hook's effect dependency stays referentially stable.
function parsePosts(data: unknown): WallPost[] | null {
  return Array.isArray(data) ? (data as WallPost[]) : null;
}

export default function GlobalWall({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  // Initial load goes through the retrying hook (the upstream is slow and the
  // first fetch after a deploy can fail); loadPosts() handles post-submit refresh.
  const initialPosts = useScenewall("globalwall", parsePosts);
  useEffect(() => { if (initialPosts) setPosts(initialPosts); }, [initialPosts]);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const input = inputRef.current;
    const text = input?.value?.trim();
    if (!text) return;
    setError("");
    fetch("/api/globalwall/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text }),
    })
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as { ok?: boolean; error?: string };
        if (d.ok) {
          if (input) input.value = "";
          // Clear local typing indicator across all subscribers
          fetch("/api/live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel: CHANNEL, type: "clear" }),
          }).catch(() => {});
          setTimeout(() => loadPosts(setPosts), 800);
        } else {
          setError(d.error ?? "Failed to post");
        }
      })
      .catch(() => setError("Network error"));
  };

  const activeDrafts = Object.values(drafts).filter(d => d.text.length > 0);

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12 p-0">
        <h2 className="apt-1 apb-1 bg-header">
          <a href="https://scenewall.bbs.io?wall">TAG THE GLOBAL BBS WALL</a>
        </h2>
      </div>
      <div className="container-fluid m-0 p-0">
        <div className="bg-secondary apt-1 apb-1" style={{ paddingLeft: "8px" }}>
          {/* Each post is its own grid row so PrintLines can animate one line
              at a time. Live typing drafts stay below, outside the animation. */}
          <PrintLines reserveLines={EXPECTED_LINES}>
            {posts.map((p, i) => (
              <div className="row m-0 p-0" key={i}>
                <div className="col-10 d-flex">
                  <span
                    className="text-truncate"
                    style={{ whiteSpace: "pre" }}
                    dangerouslySetInnerHTML={{ __html: ansiToHtml(p.comment) }}
                  />
                </div>
                <div className="col-2 text-right">
                  <span className="lightpink">{p.userName}</span>
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
            <div className="row m-0">
              <div className="col-10 col-lg-11 pr-0" style={{ paddingLeft: "8px" }}>
                <input
                  ref={inputRef}
                  className="form-control w-100"
                  type="text"
                  maxLength={60}
                  name="tagtext"
                  placeholder="Tag the global wall"
                  required
                  autoComplete="off"
                  onChange={e => broadcastTyping(e.target.value)}
                />
              </div>
              <div className="col-2 col-lg-1 bg-secondary m-0 p-0">
                <button className="button w-100 btn-primary black bg-lightgrey" type="submit">Tag</button>
              </div>
            </div>
            {error && <div className="col-12 lightgrey apt-1">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
