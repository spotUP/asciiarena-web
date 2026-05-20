"use client";
import { useEffect, useId, useState } from "react";

interface WallPost { nick: string; message: string }

export default function GlobalWall() {
  const uid = useId().replace(/:/g, "");
  const [posts, setPosts] = useState<WallPost[]>([]);

  useEffect(() => {
    fetch("https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Wall?Count=13")
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as { wall?: { nick: string; message: string }[] };
        if (d?.wall) setPosts(d.wall);
      })
      .catch(() => {});
  }, [uid]);

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
                <span className="cyan text-truncate" style={{ whiteSpace: "pre" }}>{p.message}</span>
              </div>
              <div className="col-2 text-right">
                <span className="lightpink">{p.nick}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
