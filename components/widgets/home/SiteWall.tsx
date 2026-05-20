"use client";
import { useEffect, useId, useRef } from "react";

export default function SiteWall({ isLoggedIn }: { isLoggedIn: boolean }) {
  const uid = useId().replace(/:/g, "");
  const wallId = `wall_${uid}`;
  const formId = `form_${uid}`;
  const tagId = `tag_${uid}`;

  useEffect(() => {
    const renderPosts = (data: { tag: string | null; nick: string | null }[]) => {
      const html = data.map(p =>
        `<div class="col-10 d-flex"><span class="cyan text-truncate" style="white-space:pre">${p.tag ?? ""}</span></div><div class="col-2 text-right"><span class="lightpink">${p.nick ?? ""}</span></div>`
      ).join("");
      const el = document.getElementById(wallId);
      if (el) el.innerHTML = html;
    };

    fetch("/api/wall?wall_id=1")
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) renderPosts(d as { tag: string | null; nick: string | null }[]); })
      .catch(() => {});
  }, [wallId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById(tagId) as HTMLInputElement;
    const text = input?.value?.trim();
    if (!text) return;
    fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagtext: text, wall_id: 1 }),
    }).then(r => r.json()).then((data: unknown[]) => {
      if (Array.isArray(data)) {
        const html = data.map((p: unknown) => {
          const post = p as { tag: string; nick: string };
          return `<div class="col-10 d-flex"><span class="cyan text-truncate" style="white-space:pre">${post.tag}</span></div><div class="col-2 text-right"><span class="lightpink">${post.nick}</span></div>`;
        }).join("");
        const el = document.getElementById(wallId);
        if (el) el.innerHTML = html;
      }
      if (input) input.value = "";
    });
  };

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header col-12">
        <h2 className="apt-1 apb-1 bg-header">TAG THE aSCIIaRENA WALL</h2>
      </div>
      <div className="container-fluid m-0">
        <div className="row m-0 p-0 bg-secondary apt-1 apb-1" id={wallId}></div>
        {isLoggedIn && (
          <form id={formId} onSubmit={handleSubmit} className="w-100">
            <div className="row col-12 m-0">
              <div className="col-10 col-lg-11 pr-0 pl-0">
                <input
                  className="form-control w-100"
                  style={{ color: "white" }}
                  type="text"
                  maxLength={60}
                  name="tagtext"
                  placeholder="Tag the wall"
                  id={tagId}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="col-2 col-lg-1 bg-secondary m-0 p-0">
                <button className="button w-100 btn-primary black bg-lightgrey" type="submit">Tag</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
