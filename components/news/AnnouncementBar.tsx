"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ContentLink from "@/components/ui/ContentLink";
import {
  pickBannerItem,
  rememberSeen,
  parseSeen,
  BANNER_VISIBLE_MS,
  SEEN_STORAGE_KEY,
  type NewsItem,
} from "@/lib/newsBanner";

interface BannerPayload {
  tracked: boolean;
  items: NewsItem[];
}

// Site news, shown once. It appears under the page header, holds for a few
// seconds, then hides itself and is counted as read — so a returning visitor
// is never shown the same announcement twice.
//
// Read state lives in news_reads for members and in localStorage for everyone
// else; the choice of WHICH item to show is the same pure rule either way.
export default function AnnouncementBar() {
  const [item, setItem] = useState<NewsItem | null>(null);
  const [visible, setVisible] = useState(false);
  const trackedRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markRead = useCallback((id: number) => {
    if (trackedRef.current) {
      // Server-side for members, so it follows them to other devices.
      fetch(`/api/news/${id}/read`, { method: "POST" }).catch(() => {});
    }
    // Also locally: it costs nothing and keeps the bar quiet for the rest of
    // this browser's session even if the request fails.
    try {
      const seen = parseSeen(window.localStorage.getItem(SEEN_STORAGE_KEY));
      window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(rememberSeen(seen, id)));
    } catch { /* storage disabled or full */ }
  }, []);

  const dismiss = useCallback((id: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
    markRead(id);
  }, [markRead]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/news/banner");
        if (!res.ok) return;
        const data = (await res.json()) as BannerPayload;
        if (cancelled) return;
        trackedRef.current = data.tracked;
        const seen = (() => {
          try { return parseSeen(window.localStorage.getItem(SEEN_STORAGE_KEY)); } catch { return []; }
        })();
        const next = pickBannerItem(data.items ?? [], seen);
        if (!next) return;
        setItem(next);
        setVisible(true);
        hideTimer.current = setTimeout(() => {
          setVisible(false);
          markRead(next.id);
        }, BANNER_VISIBLE_MS);
      } catch { /* no banner is a fine outcome */ }
    })();
    return () => {
      cancelled = true;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [markRead]);

  // Rendering nothing rather than an empty bar: an element that reserves
  // height would shift the whole page down for a few seconds and back.
  if (!item || !visible) return null;

  return (
    <div className="row m-0 p-0 bg-lightblue" role="status">
      <div
        className="col-12 d-flex align-items-center"
        style={{ gap: "16px", minHeight: "32px", lineHeight: "16px", padding: "8px 16px" }}
      >
        <span className="yellow" style={{ flexShrink: 0 }}>NEWS</span>
        <span className="white" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </span>
        {/* White, not the usual lightgrey/lightcyan: those are low contrast
            against the light blue band. */}
        <ContentLink
          href="/news"
          className="white"
          style={{ flexShrink: 0 }}
          onClick={() => dismiss(item.id)}
        >
          [more]
        </ContentLink>
        <button
          type="button"
          onClick={() => dismiss(item.id)}
          title="Dismiss"
          className="white"
          style={{
            flexShrink: 0, background: "transparent", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: "inherit", lineHeight: "16px", padding: 0,
          }}
        >
          [X]
        </button>
      </div>
    </div>
  );
}
