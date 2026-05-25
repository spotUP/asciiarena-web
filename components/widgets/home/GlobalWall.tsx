"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { ansiToHtml } from "@/lib/ansi";

interface WallPost { userName: string; comment: string; source: string }

function loadPosts(set: (p: WallPost[]) => void) {
  fetch("https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15")
    .then(r => r.json())
    .then((data: unknown) => { if (Array.isArray(data)) set(data as WallPost[]); })
    .catch(() => {});
}

export default function GlobalWall({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPosts(setPosts); }, [uid]);

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
          setTimeout(() => loadPosts(setPosts), 800);
        } else {
          setError(d.error ?? "Failed to post");
        }
      })
      .catch(() => setError("Network error"));
  };

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12 p-0">
        <h2 className="apt-1 apb-1 bg-header">
          <a href="https://scenewall.bbs.io?wall">TAG THE GLOBAL BBS WALL</a>
        </h2>
      </div>
      <div className="container-fluid m-0 p-0">
        <div className="row m-0 p-0 bg-secondary apt-1 apb-1" style={{ paddingLeft: "8px" }}>
          {posts.map((p, i) => (
            <React.Fragment key={i}>
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
            </React.Fragment>
          ))}
        </div>

        {isLoggedIn && (
          <form onSubmit={handleSubmit} className="w-100">
            <div className="row m-0" style={{ paddingLeft: "8px" }}>
              <div className="col-10 col-lg-11 pr-0 pl-0">
                <input
                  ref={inputRef}
                  className="form-control w-100"
                  type="text"
                  maxLength={60}
                  name="tagtext"
                  placeholder="Tag the global wall"
                  required
                  autoComplete="off"
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
