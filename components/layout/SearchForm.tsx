"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Search via client-side navigation (router.push) instead of a native form GET,
// so the persistent music player (rooted in the layout) keeps playing across a
// search. A full reload would tear the provider down and stop the music.
export default function SearchForm({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  if (compact) {
    return (
      <form onSubmit={submit}>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="form-control ascii"
          style={{ width: "80px", height: "21px", padding: "0 4px", border: "none" }}
          placeholder="search..."
        />
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="row amb-1">
      <div className="col-12 d-flex" style={{ gap: "8px" }}>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="form-control"
          placeholder="Search releases, artists, crews..."
          autoFocus
          style={{ flex: 1 }}
        />
        <input type="submit" className="btn-big" value="Search" />
      </div>
    </form>
  );
}
