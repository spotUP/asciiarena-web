"use client";
import { useEffect, useId, useState } from "react";

interface WallPost { userName: string; comment: string; source: string }

export default function GlobalWall() {
  const uid = useId().replace(/:/g, "");
  const [posts, setPosts] = useState<WallPost[]>([]);

  useEffect(() => {
    fetch("https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15")
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setPosts(data as WallPost[]);
      })
      .catch(() => {});
  }, [uid]);

  // Strip ANSI escape codes for display
  const stripAnsi = (s: string) => s.replace(/\[[0-9;]*m/g, "").replace(/&#91;/g, "[");

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12">
        <h2 className="apt-1 apb-1 bg-header">
          <a href="https://scenewall.bbs.io?wall">TAG THE GLOBAL BBS WALL</a>
        </h2>
      </div>
      <div className="container-fluid m-0">
        <div className="row m-0 p-0 bg-secondary apt-1 apb-1">
          {posts.map((p, i) => (
            <div key={i} className="col-12 d-flex">
              <div className="col-10">
                <span className="cyan text-truncate" style={{ whiteSpace: "pre" }}>
                  {stripAnsi(p.comment)}
                </span>
              </div>
              <div className="col-2 text-right">
                <span className="lightpink">{p.userName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
